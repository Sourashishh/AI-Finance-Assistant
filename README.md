# AI-Powered Personal Finance Assistant

## Overview

A production-ready AI-powered personal finance assistant that allows users to ask natural language questions about their financial data. The system combines structured expense data from MongoDB with unstructured data (receipts, notes) using LangChain and RAG (Retrieval-Augmented Generation) pipeline.

## Features

- Natural language querying of financial data using AI
- Transaction management with categorization and filtering
- Document upload and processing (receipts, invoices, statements)
- Spending analytics and summaries
- AI-powered chat interface for financial insights
- User authentication and authorization
- RESTful API with comprehensive documentation
- Responsive web interface

## Technology Stack

### Backend
- Python 3.9+
- FastAPI - Modern web framework
- LangChain - AI/LLM orchestration
- OpenAI API or Ollama - Language model
- ChromaDB - Vector database for RAG
- MongoDB - Primary database
- PyPDF2, pytesseract - Document processing
- JWT - Authentication

### Frontend
- React 18
- Tailwind CSS - Styling
- Axios - HTTP client
- Lucide React - Icons

## Prerequisites

Before you begin, ensure you have the following installed:

- Python 3.9 or higher
- Node.js 16 or higher
- MongoDB 6.0 or higher
- OpenAI API key (or local Ollama installation)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/finance-assistant.git
cd finance-assistant
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env  # or use your preferred editor
```

Required environment variables in .env:
```
MONGODB_URL=mongodb://localhost:27017/finance_assistant
MONGODB_DB_NAME=finance_assistant
JWT_SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
CORS_ORIGINS=http://localhost:3000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create environment file (optional)
cp .env.example .env
```

### 4. Database Setup

```bash
# Start MongoDB service
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS
net start MongoDB  # Windows

# Verify MongoDB is running
mongosh --eval "db.runCommand('ping')"
```

## Running the Application

### Development Mode

Option 1: Use the provided script
```bash
chmod +x scripts/start-dev.sh
./scripts/start-dev.sh
```

Option 2: Manual startup

Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
python main.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000


## Project Structure

```
finance-assistant/
├── backend/
│   ├── app/
│   │   ├── models/          # Data models
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── database/        # Database configuration
│   │   ├── utils/           # Utility functions
│   │   └── main.py          # Application entry point
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── App.js           # Main application
│   ├── package.json         # Node dependencies
│   └── public/              # Static files
├── scripts/
│   ├── setup.sh             # Setup script
│   ├── start-dev.sh         # Development startup
│   └── backup-db.sh         # Database backup
├── docs/
│   ├── API.md               # API documentation
│   ├── DEPLOYMENT.md        # Deployment guide
│   └── TESTING.md           # Test documentation
└── README.md
```

## Usage

### Creating an Account

1. Navigate to http://localhost:3000
2. Click "Sign up" to create a new account
3. Enter your email, name, and password
4. Click "Create Account"

### Adding Transactions

1. Log in to your account
2. Navigate to "Transactions" page
3. Click "Add Transaction" button
4. Fill in the transaction details:
   - Description
   - Amount
   - Category
   - Date
   - Notes (optional)
5. Click "Save"

### Uploading Documents

1. Navigate to "Documents" page
2. Drag and drop files or click to browse
3. Select PDF, image, or text files
4. Files will be automatically processed for text extraction
5. Extracted text will be indexed for AI queries

### Using the AI Assistant

1. Navigate to "AI Chat" page
2. Type natural language questions such as:
   - "How much did I spend on food last month?"
   - "What was my biggest expense this year?"
   - "Show me my spending trends"
3. The AI will analyze your financial data and provide detailed answers





### Key Endpoints

Authentication:
- POST /auth/register - Register new user
- POST /auth/login - User login
- GET /auth/me - Get current user

Transactions:
- GET /transactions - List transactions
- POST /transactions - Create transaction
- PUT /transactions/{id} - Update transaction
- DELETE /transactions/{id} - Delete transaction
- GET /transactions/summary/spending - Get spending summary

Documents:
- POST /documents/upload - Upload document
- GET /documents - List documents
- DELETE /documents/{id} - Delete document

Chat:
- POST /chat/query - Ask AI question
- GET /chat/history - Get chat history

## Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov

# Run all tests
pytest

# Run with coverage
pytest --cov=app tests/

# Run specific test file
pytest tests/unit/test_auth_service.py -v
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## Deployment

### Production Deployment on VM

1. Prepare the server:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip nodejs npm mongodb nginx -y
```

2. Clone and setup:
```bash
git clone https://github.com/yourusername/finance-assistant.git
cd finance-assistant
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. Configure production environment:
```bash
cd backend
nano .env  # Update with production settings
```

4. Build frontend:
```bash
cd frontend
npm run build
```

5. Setup systemd service:
```bash
sudo cp scripts/finance-assistant-backend.service /etc/systemd/system/
sudo systemctl enable finance-assistant-backend
sudo systemctl start finance-assistant-backend
```

6. Configure Nginx:
```bash
sudo cp scripts/nginx.conf /etc/nginx/sites-available/finance-assistant
sudo ln -s /etc/nginx/sites-available/finance-assistant /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Detailed deployment instructions are available in docs/DEPLOYMENT.md

## Configuration

### Backend Configuration

Environment variables in backend/.env:

- MONGODB_URL - MongoDB connection string
- MONGODB_DB_NAME - Database name
- JWT_SECRET_KEY - Secret key for JWT tokens
- JWT_ALGORITHM - JWT signing algorithm (default: HS256)
- JWT_ACCESS_TOKEN_EXPIRE_MINUTES - Token expiration time
- OPENAI_API_KEY - OpenAI API key for AI features
- CHROMA_DB_PATH - Path to ChromaDB vector store
- MAX_FILE_SIZE - Maximum upload file size in bytes
- UPLOAD_DIR - Directory for uploaded files
- CORS_ORIGINS - Allowed CORS origins

### Frontend Configuration

Environment variables in frontend/.env:

- REACT_APP_API_URL - Backend API URL
- REACT_APP_NAME - Application name

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check MongoDB status
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log
```

### Backend Won't Start

```bash
# Verify Python version
python --version

# Reinstall dependencies
pip install -r requirements.txt

# Check for port conflicts
lsof -i :8000
```

### Frontend Build Errors

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm cache clean --force
```

### AI/RAG Pipeline Issues

```bash
# Verify OpenAI API key
echo $OPENAI_API_KEY

# Clear vector database
rm -rf chroma_db/
# Restart backend to reinitialize
```

## Security Considerations

- Change JWT_SECRET_KEY to a strong, random value in production
- Use HTTPS in production environments
- Keep OpenAI API key secure and never commit to version control
- Implement rate limiting for API endpoints
- Regular security updates for dependencies
- Enable MongoDB authentication in production
- Use environment-specific configuration files

## Performance Optimization

- Database indexes are automatically created on startup
- Vector database (ChromaDB) is optimized for similarity search
- Frontend uses code splitting and lazy loading
- API responses are paginated for large datasets
- File uploads are validated and size-limited

## Backup and Recovery

### Database Backup

```bash
# Create backup
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh

# Restore from backup
./scripts/restore-db.sh backups/finance_assistant_backup_20231201.tar.gz
```

### Automated Backups

```bash
# Add to crontab for daily backups
crontab -e
# Add line: 0 2 * * * /path/to/scripts/backup-db.sh
```

## Contributing

1. Fork the repository
2. Create a feature branch: git checkout -b feature-name
3. Make your changes and commit: git commit -am 'Add feature'
4. Push to the branch: git push origin feature-name
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions:
- Create an issue on GitHub
- Review documentation in the docs/ directory


## Acknowledgments

- FastAPI for the excellent web framework
- LangChain for AI/LLM integration capabilities
- OpenAI for language model API
- MongoDB for flexible data storage
- React community for frontend tools and libraries