// File: components/StartSessionModal.js
import React, { useState, useEffect, useRef } from 'react';
import { getDB, db } from '../utils/dbHelper';
import './StartSessionModal.css';

const StartSessionModal = ({ onClose, onSessionCreate }) => {
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hi! I'll help you start an SAT practice session. What subject or topic would you like to work on today?" }
  ]);
  const [inputText, setInputText] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [showNewUserInput, setShowNewUserInput] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [sessionReady, setSessionReady] = useState(false);
  const [subject, setSubject] = useState('');
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Load users from database
    const loadUsers = async () => {
      try {
        await getDB();
        const usersData = await db.all('SELECT * FROM Users ORDER BY name');
        setUsers(usersData);
      } catch (error) {
        console.error("Error loading users:", error);
      }
    };
    
    loadUsers();
  }, []);

  useEffect(() => {
    // Scroll to bottom of chat when messages change
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    
    // Add user message to chat
    const newMessage = { sender: 'user', text: inputText };
    setChatMessages([...chatMessages, newMessage]);
    
    // In a real app, here we would send the message to an AI service
    // For now, we'll simulate AI responses
    setTimeout(() => {
      let aiResponse;
      
      if (!subject) {
        setSubject(inputText);
        aiResponse = { 
          sender: 'ai', 
          text: `Great! I'll help you practice ${inputText}. Is there anything specific about ${inputText} you want to focus on?` 
        };
      } else {
        aiResponse = { 
          sender: 'ai', 
          text: "Perfect! I understand what you're looking for. Click 'Start Session' when you're ready to begin." 
        };
        setSessionReady(true);
      }
      
      setChatMessages(prev => [...prev, aiResponse]);
    }, 500);
    
    setInputText('');
  };

  const handleCreateNewUser = async () => {
    if (!newUserName.trim()) return;
    
    try {
      await getDB();
      const result = await db.run(
        'INSERT INTO Users (name) VALUES (?)',
        [newUserName]
      );
      
      const newUser = {
        id: result.lastID,
        name: newUserName
      };
      
      setUsers([...users, newUser]);
      setSelectedUser(newUser.id);
      setShowNewUserInput(false);
    } catch (error) {
      console.error("Error creating new user:", error);
    }
  };

  const handleStartSession = async () => {
    if (!selectedUser || !subject) return;
    
    try {
      await getDB();
      const now = new Date().toISOString();
      
      const result = await db.run(
        'INSERT INTO Sessions (user_id, subject, date) VALUES (?, ?, ?)',
        [selectedUser, subject, now]
      );
      
      // Get user name for the new session
      const userData = users.find(u => u.id === parseInt(selectedUser));
      
      const newSession = {
        id: result.lastID,
        user_id: selectedUser,
        userName: userData.name,
        subject,
        date: now
      };
      
      onSessionCreate(newSession);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="start-session-modal">
        <div className="modal-header">
          <h2>Start Tutoring Session</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="user-selection">
          <label>Select Student:</label>
          {showNewUserInput ? (
            <div className="new-user-input">
              <input
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="Enter student name"
              />
              <button onClick={handleCreateNewUser}>Add</button>
              <button onClick={() => setShowNewUserInput(false)}>Cancel</button>
            </div>
          ) : (
            <div className="user-dropdown-container">
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select a student</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
              <button 
                className="add-user-button"
                onClick={() => setShowNewUserInput(true)}
              >
                Add New User
              </button>
            </div>
          )}
        </div>
        
        <div className="chat-container">
          <div className="chat-transcript">
            {chatMessages.map((msg, index) => (
              <div 
                key={index} 
                className={`chat-message ${msg.sender}`}
              >
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Describe the subject/topic..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              className="send-button"
              onClick={handleSendMessage}
            >
              Send
            </button>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="start-button"
            disabled={!sessionReady || !selectedUser}
            onClick={handleStartSession}
          >
            Start Session
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartSessionModal;