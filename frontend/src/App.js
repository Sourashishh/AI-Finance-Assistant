import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Send, Plus, TrendingUp, Calendar, DollarSign, MessageSquare } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:8000';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function App() {
  const [expenses, setExpenses] = useState([]);
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchExpenses = async () => {
    try {
      const response = await fetch(`${API_URL}/get-expenses`);
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    addExpenseToBackend();
  };

  const addExpenseToBackend = async () => {
    try {
      const response = await fetch(`${API_URL}/add-expense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'user_1',
          amount: parseFloat(newExpense.amount),
          category: newExpense.category,
          description: newExpense.description,
          date: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        setNewExpense({ amount: '', category: '', description: '' });
        fetchExpenses();
        alert('Expense added successfully!');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense. Please try again.');
    }
  };

  const handleQuery = (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    sendQueryToBackend(userMessage.content);
  };

  const sendQueryToBackend = async (queryText) => {
    try {
      const response = await fetch(`${API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'user_1', query: queryText })
      });
      
      const data = await response.json();
      const aiMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, aiMessage]);
      fetchExpenses();
    } catch (error) {
      const errorMessage = { role: 'assistant', content: 'Sorry, I encountered an error processing your request.' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryData = () => {
    const categoryTotals = {};
    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  };

  const getWeeklyData = () => {
    const weeklyData = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    expenses.forEach(exp => {
      const date = new Date(exp.date);
      const day = days[date.getDay()];
      weeklyData[day] = (weeklyData[day] || 0) + exp.amount;
    });
    
    return days.map(day => ({ day, amount: weeklyData[day] || 0 }));
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };

  return (
    <div className="container">
      <header className="header">
        <h1 className="title">💰 AI Finance Assistant</h1>
        <p className="subtitle">Manage your expenses with natural language</p>
      </header>

      <nav className="nav">
        <button 
          className={`nav-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare size={18} /> Chat
        </button>
        <button 
          className={`nav-button ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <DollarSign size={18} /> Expenses
        </button>
        <button 
          className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={18} /> Analytics
        </button>
      </nav>

      <main className="main">
        {activeTab === 'chat' && (
          <div className="chat-container">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="empty-state">
                  <MessageSquare size={48} style={{ opacity: 0.3 }} />
                  <p>Start a conversation with your AI assistant</p>
                  <div className="suggestions">
                    <button 
                      className="suggestion-btn" 
                      onClick={() => handleSuggestionClick("Show my expenses for this week")}
                    >
                      Show my expenses for this week
                    </button>
                    <button 
                      className="suggestion-btn" 
                      onClick={() => handleSuggestionClick("What category did I spend the most on?")}
                    >
                      What category did I spend the most on?
                    </button>
                    <button 
                      className="suggestion-btn" 
                      onClick={() => handleSuggestionClick("Summarize my monthly spending")}
                    >
                      Summarize my monthly spending
                    </button>
                  </div>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`}>
                  <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong>
                  <p>{msg.content}</p>
                </div>
              ))}
              {loading && (
                <div className="message ai-message">
                  <strong>AI:</strong>
                  <p className="loading-dots">Thinking...</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-form-container">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !loading && handleQuery(e)}
                placeholder="Ask me anything about your expenses..."
                className="chat-input"
                disabled={loading}
              />
              <button 
                onClick={handleQuery} 
                className="send-button" 
                disabled={loading}
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expenses-container">
            <div className="card">
              <h2 className="card-title"><Plus size={20} /> Add New Expense</h2>
              <div className="form">
                <div className="form-group">
                  <label className="label">Amount (₹)</label>
                  <input
                    type="number"
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                    placeholder="500"
                    className="input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="label">Category</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                    className="input"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="Food">Food</option>
                    <option value="Transport">Transport</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Bills">Bills</option>
                    <option value="Health">Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Description</label>
                  <input
                    type="text"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                    placeholder="Lunch at restaurant"
                    className="input"
                    required
                  />
                </div>
                <button 
                  onClick={handleAddExpense} 
                  className="submit-button"
                >
                  <Plus size={18} /> Add Expense
                </button>
              </div>
            </div>

            <div className="card">
              <h2 className="card-title">Recent Expenses</h2>
              <div className="table-container">
                {expenses.length === 0 ? (
                  <p className="empty-text">No expenses yet. Add your first expense!</p>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th className="th">Date</th>
                        <th className="th">Category</th>
                        <th className="th">Description</th>
                        <th className="th">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.slice().reverse().map((exp, idx) => (
                        <tr key={idx} className="tr">
                          <td className="td">{new Date(exp.date).toLocaleDateString()}</td>
                          <td className="td">
                            <span className="badge" style={{background: COLORS[idx % COLORS.length]}}>
                              {exp.category}
                            </span>
                          </td>
                          <td className="td">{exp.description}</td>
                          <td className="td">₹{exp.amount.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-container">
            <div className="stats-grid">
              <div className="stat-card">
                <DollarSign size={32} style={{ color: '#3b82f6' }} />
                <h3>Total Expenses</h3>
                <p className="stat-value">₹{totalExpenses.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <Calendar size={32} style={{ color: '#10b981' }} />
                <h3>This Month</h3>
                <p className="stat-value">{expenses.length} transactions</p>
              </div>
              <div className="stat-card">
                <TrendingUp size={32} style={{ color: '#f59e0b' }} />
                <h3>Avg/Transaction</h3>
                <p className="stat-value">
                  ₹{expenses.length > 0 ? (totalExpenses / expenses.length).toFixed(2) : '0.00'}
                </p>
              </div>
            </div>

            <div className="charts-grid">
              <div className="card">
                <h2 className="card-title">Spending by Category</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getCategoryData()}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {getCategoryData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h2 className="card-title">Weekly Spending Trend</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getWeeklyData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;