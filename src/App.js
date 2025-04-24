// File: App.js
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Workspace from './components/workspace';
import { initDB } from './utils/dbHelper';
import './App.css';

function App() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Initialize the database on app start
    const setupDB = async () => {
      const db = await initDB();
      loadSessions(db);
    };
    
    setupDB();
  }, []);

  const loadSessions = async (db) => {
    try {
      // Fetch sessions from database
      const sessionsData = await db.all(`
        SELECT Sessions.id, Sessions.subject, Sessions.date, Users.name as userName
        FROM Sessions
        JOIN Users ON Sessions.user_id = Users.id
        ORDER BY Sessions.date DESC
      `);
      setSessions(sessionsData);
    } catch (error) {
      console.error("Error loading sessions:", error);
    }
  };

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
  };

  const handleCreateSession = (newSession) => {
    setSessions([newSession, ...sessions]);
    setSelectedSession(newSession);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="app-container">
      <Sidebar 
        sessions={sessions}
        onSelectSession={handleSessionSelect}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
      />
      <Workspace 
        selectedSession={selectedSession}
        onCreateSession={handleCreateSession}
      />
    </div>
  );
}

export default App;