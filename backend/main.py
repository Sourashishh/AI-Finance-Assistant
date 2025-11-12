from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware #allow browser clients to call the API.
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from pymongo import MongoClient
from groq import Groq
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = FastAPI()

# CORS configuration        APP + CORS for FAST Api and Enables CORS for React dev URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["finance_assistant"]
expenses_collection = db["expenses"]

# Groq client setup # Used as it is an Open source / Free API
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Pydantic models # validations of Add expennse and query 
class Expense(BaseModel):
    user_id: str
    amount: float
    category: str
    description: str
    date: str

class Query(BaseModel):
    user_id: str
    query: str

# Helper functions
def get_user_expenses(user_id: str, days: Optional[int] = None):  
     #Retrieve user expenses from MongoDB
    query = {"user_id": user_id}
    
    if days:
        start_date = datetime.now() - timedelta(days=days)
        query["date"] = {"$gte": start_date.isoformat()}
    
    expenses = list(expenses_collection.find(query, {"_id": 0}))        #returns a list of expenses with date if provided
    return expenses

def format_expenses_for_context(expenses: List[dict]) -> str:
    #Format expenses for LLM , so it is easy #string dates
    if not expenses:
        return "No expenses found."
    
    context = "User's expense data:\n\n"
    for exp in expenses:
        date = exp.get('date', 'N/A')
        if isinstance(date, str):
            try:
                date = datetime.fromisoformat(date).strftime("%Y-%m-%d")
            except:
                pass
        context += f"- Date: {date}, Category: {exp.get('category', 'N/A')}, Amount: ₹{exp.get('amount', 0)}, Description: {exp.get('description', 'N/A')}\n"
    
    return context

def calculate_category_totals(expenses: List[dict]) -> dict:
    #Calculate total spending per category
    totals = {}
    for exp in expenses:
        category = exp.get('category', 'Other')
        totals[category] = totals.get(category, 0) + exp.get('amount', 0)
    return totals

def process_natural_language_query(user_id: str, query: str):
    """Process user query using Groq AI with RAG"""
    
    # Check if query is asking to add an expense
    query_lower = query.lower()
    if any(keyword in query_lower for keyword in ["add", "spent", "bought", "paid"]):
        return handle_add_expense_query(user_id, query)
    
    # Retrieve relevant expense data (RAG approach)
    all_expenses = get_user_expenses(user_id)
    expense_context = format_expenses_for_context(all_expenses)
    
    # Calculate statistics
    total = sum(exp.get('amount', 0) for exp in all_expenses)
    category_totals = calculate_category_totals(all_expenses)
    
    # Create system prompt
    system_prompt = f"""You are a helpful personal finance assistant. You help users understand and manage their expenses.

Current expense data:
{expense_context}

Statistics:
- Total expenses: ₹{total:.2f}
- Number of transactions: {len(all_expenses)}
- Category breakdown: {category_totals}

When answering:
1. Be conversational and friendly
2. Use the provided expense data to give accurate answers
3. Format numbers with ₹ symbol for Indian Rupees
4. If asked about specific time periods, filter the data accordingly
5. Provide insights and recommendations when appropriate
6. Keep responses concise and helpful"""

    try:
        # Call Groq API
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            model="llama-3.1-8b-instant",  # Updated to supported model
            temperature=0.7,
            max_tokens=1024,
        )
        
        return chat_completion.choices[0].message.content
    
    except Exception as e:
        return f"Sorry, I encountered an error: {str(e)}"

def handle_add_expense_query(user_id: str, query: str):
    """Handle expense addition through natural language"""
    
    system_prompt = """You are a financial assistant that extracts expense information from natural language.

Extract the following information from the user's message:
- amount (as a number, remove currency symbols)
- category (must be one of: Food, Transport, Entertainment, Shopping, Bills, Health, Other)
- description (brief description of the expense)

Respond ONLY with a valid JSON object in this exact format:
{"amount": <number>, "category": "<category>", "description": "<description>"}

If you cannot extract the information, respond with:
{"error": "Unable to parse expense information"}

Examples:
User: "Add 500 rupees in food category for lunch"
Response: {"amount": 500, "category": "Food", "description": "lunch"}

User: "I spent 200 on transport"
Response: {"amount": 200, "category": "Transport", "description": "transport expense"}"""

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": query
                }
            ],
            model="llama-3.1-8b-instant",  # Updated to supported model
            temperature=0.3,
            max_tokens=256,
        )
        
        response_text = chat_completion.choices[0].message.content.strip()
        
        # Try to parse JSON response
        try:
            data = json.loads(response_text)
            
            if "error" in data:
                return "I couldn't understand the expense details. Please provide the amount, category, and description clearly. For example: 'Add ₹500 in Food category for lunch'"
            
            amount = data.get("amount")
            category = data.get("category")
            description = data.get("description")
            
            if amount and category and description:
                # Add expense to database
                expense = {
                    "user_id": user_id,
                    "amount": float(amount),
                    "category": category,
                    "description": description,
                    "date": datetime.now().isoformat()
                }
                expenses_collection.insert_one(expense)
                return f"✅ Successfully added expense: ₹{amount:.2f} in {category} category for '{description}'"
            else:
                return "I couldn't extract all the necessary information. Please provide amount, category, and description."
        
        except json.JSONDecodeError:
            return "I couldn't parse the expense information. Please try again with clear details."
    
    except Exception as e:
        return f"Error processing expense: {str(e)}"

# API Endpoints
@app.get("/")
def root():
    return {
        "message": "Finance Assistant API is running",
        "ai_provider": "Groq (FREE)",
        "model": "llama-3.1-8b-instant"
    }

@app.post("/add-expense")
def add_expense(expense: Expense):
    """Add a new expense"""
    try:
        expense_dict = expense.dict()
        expense_dict["date"] = datetime.now().isoformat() if not expense.date else expense.date
        expenses_collection.insert_one(expense_dict)
        return {"message": "Expense added successfully", "expense": expense_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/get-expenses")
def get_expenses(user_id: str = "user_1", days: Optional[int] = None):
    """Retrieve expenses for a user"""
    try:
        expenses = get_user_expenses(user_id, days)
        return {"expenses": expenses, "count": len(expenses)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/query")
def process_query(query_data: Query):
    """Process natural language query using Groq AI"""
    try:
        response = process_natural_language_query(query_data.user_id, query_data.query)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.delete("/delete-all-expenses")
def delete_all_expenses(user_id: str = "user_1"):
    """Delete all expenses (for testing)"""
    try:
        result = expenses_collection.delete_many({"user_id": user_id})
        return {"message": f"Deleted {result.deleted_count} expenses"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Finance Assistant API on http://localhost:8000")
    print("📊 MongoDB:", MONGO_URI)
    print("🤖 AI Provider: Groq (FREE)")
    print("🧠 Model: llama-3.1-8b-instant")
    uvicorn.run(app, host="0.0.0.0", port=8000)