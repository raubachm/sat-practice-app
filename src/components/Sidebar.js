// File: components/Sidebar.js
import React from 'react';
import './Sidebar.css';

const Sidebar = ({ sessions, onSelectSession, collapsed, onToggleCollapse }) => {
  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Sessions</h2>}
        <button
          className="toggle-button"
          onClick={onToggleCollapse}
        >
          {collapsed ? '☰' /* hamburger icon */ : '←'}
        </button>
      </div>
      
      {!collapsed && (
        <div className="sessions-list">
          {sessions.length === 0 ? (
            <div className="no-sessions">No sessions yet</div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                className="session-item"
                onClick={() => onSelectSession(session)}
              >
                <div className="session-title">
                  {session.userName} — {session.subject}
                </div>
                <div className="session-subtitle">
                  {new Date(session.date).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Sidebar;