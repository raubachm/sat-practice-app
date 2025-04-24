// File: components/workspace.js
import React, { useState, useEffect } from 'react';
import StartSessionModal from './StartSessionModal';
import SessionContent from './SessionContent';
import { getDB, db } from '../utils/dbHelper';
import './workspace.css';

const Workspace = ({ selectedSession, onCreateSession }) => {
  const [showStartModal, setShowStartModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedSession) {
      loadSessionQuestions(selectedSession.id);
    }
  }, [selectedSession]);

  const loadSessionQuestions = async (sessionId) => {
    setLoading(true);
    try {
      await getDB();
      const questionsData = await db.all(`
        SELECT * FROM Questions
        WHERE session_id = ?
        ORDER BY created_at ASC
      `, [sessionId]);
      
      setQuestions(questionsData.map(q => ({
        ...q,
        question_payload: JSON.parse(q.question_payload)
      })));
    } catch (error) {
      console.error("Error loading questions:", error);
    }
    setLoading(false);
  };

  const startNewSession = () => {
    setShowStartModal(true);
  };

  const handleSessionCreated = (newSession) => {
    setShowStartModal(false);
    onCreateSession(newSession);
  };

  const handleReturnHome = () => {
    onCreateSession(null);
  };

  const handleAddQuestion = (newQuestion) => {
    setQuestions([...questions, newQuestion]);
  };

  const handleUpdateQuestion = (updatedQuestion) => {
    setQuestions(questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    ));
  };

  return (
    <div className="workspace">
      {selectedSession ? (
        <SessionContent
          session={selectedSession}
          questions={questions}
          onAddQuestion={handleAddQuestion}
          onUpdateQuestion={handleUpdateQuestion}
          onReturnHome={handleReturnHome}
          loading={loading}
        />
      ) : (
        <div className="empty-workspace">
          <button 
            className="start-session-btn"
            onClick={startNewSession}
          >
            Start Tutoring Session
          </button>
        </div>
      )}

      {showStartModal && (
        <StartSessionModal
          onClose={() => setShowStartModal(false)}
          onSessionCreate={handleSessionCreated}
        />
      )}
    </div>
  );
};

export default Workspace;