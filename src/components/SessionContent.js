// File: components/SessionContent.js
import React, { useState } from 'react';
import Question from './Question';
import { getDB, db } from '../utils/dbHelper';
import './SessionContent.css';

const SessionContent = ({ 
  session, 
  questions, 
  onAddQuestion, 
  onUpdateQuestion, 
  onReturnHome,
  loading 
}) => {
  const [generating, setGenerating] = useState(false);

  // Helper function to generate a sample SAT question
  // In a real app, this would call an AI service
  const generateSampleQuestion = (topic) => {
    // Mock questions based on subject
    const mockQuestions = {
      'Algebra': {
        text: "If 3x + 5 = 17, what is the value of 2x - 1?",
        answer: "7",
        explanation: "First, solve for x: 3x + 5 = 17, 3x = 12, x = 4. Then substitute: 2x - 1 = 2(4) - 1 = 8 - 1 = 7."
      },
      'Geometry': {
        text: "In a right triangle, one leg is 6 units and the hypotenuse is 10 units. What is the length of the other leg?",
        answer: "8",
        explanation: "Using the Pythagorean theorem: a² + b² = c². We know a = 6 and c = 10. So 6² + b² = 10², 36 + b² = 100, b² = 64, b = 8."
      },
      'Reading': {
        text: "Based on the passage, which of the following best describes the author's attitude toward the new environmental policy?",
        answer: "Cautiously optimistic",
        explanation: "Throughout the passage, the author acknowledges potential benefits while also expressing concerns about implementation challenges."
      }
    };
    
    // Default fallback question
    let questionData = {
      text: "What is the solution to the equation 2x + 3 = 7?",
      answer: "x = 2",
      explanation: "Subtract 3 from both sides: 2x = 4. Then divide both sides by 2: x = 2."
    };
    
    // Try to match the topic to our mock questions
    for (const [subject, question] of Object.entries(mockQuestions)) {
      if (session.subject.toLowerCase().includes(subject.toLowerCase())) {
        questionData = question;
        break;
      }
    }
    
    return {
      question_payload: {
        questionText: questionData.text,
        correctAnswer: questionData.answer,
        explanation: questionData.explanation
      }
    };
  };

  const handleGenerateQuestion = async () => {
    setGenerating(true);
    
    try {
      // Generate a question
      // In a real app, we would call an AI service here
      const questionData = generateSampleQuestion(session.subject);
      
      // Save to database
      await getDB();
      const now = new Date().toISOString();
      
      const result = await db.run(
        `INSERT INTO Questions 
         (session_id, question_payload, hint_requested, explanation_requested, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [
          session.id,
          JSON.stringify(questionData.question_payload),
          false,
          false,
          now
        ]
      );
      
      // Add the new question to the list
      const newQuestion = {
        id: result.lastID,
        session_id: session.id,
        question_payload: questionData.question_payload,
        user_answer: null,
        hint_requested: false,
        explanation_requested: false,
        created_at: now
      };
      
      onAddQuestion(newQuestion);
    } catch (error) {
      console.error("Error generating question:", error);
    }
    
    setGenerating(false);
  };

  const handleQuestionUpdate = async (questionId, updateData) => {
    try {
      await getDB();
      
      // Update specific fields in the database
      if (updateData.user_answer !== undefined) {
        await db.run(
          'UPDATE Questions SET user_answer = ? WHERE id = ?',
          [updateData.user_answer, questionId]
        );
      }
      
      if (updateData.hint_requested !== undefined) {
        await db.run(
          'UPDATE Questions SET hint_requested = ? WHERE id = ?',
          [updateData.hint_requested ? 1 : 0, questionId]
        );
      }
      
      if (updateData.explanation_requested !== undefined) {
        await db.run(
          'UPDATE Questions SET explanation_requested = ? WHERE id = ?',
          [updateData.explanation_requested ? 1 : 0, questionId]
        );
      }
      
      // Get the updated question from our state
      const questionToUpdate = questions.find(q => q.id === questionId);
      if (!questionToUpdate) return;
      
      // Create updated question object
      const updatedQuestion = {
        ...questionToUpdate,
        ...updateData
      };
      
      onUpdateQuestion(updatedQuestion);
      
      // If this was a submit action, generate a new question
      if (updateData.user_answer !== undefined) {
        handleGenerateQuestion();
      }
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  return (
    <div className="session-content">
      <div className="session-header">
        <h2>
          {session.userName} — {session.subject}
        </h2>
        <div className="session-date">
          {new Date(session.date).toLocaleDateString()}
        </div>
        <button 
          className="return-home-button"
          onClick={onReturnHome}
        >
          Return Home
        </button>
      </div>
      
      <div className="questions-container">
        {loading ? (
          <div className="loading">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="no-questions">
            <p>No questions yet. Let's get started!</p>
            <button 
              className="generate-question-button"
              onClick={handleGenerateQuestion}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate First Question'}
            </button>
          </div>
        ) : (
          questions.map(question => (
            <Question
              key={question.id}
              question={question}
              onUpdate={(updateData) => handleQuestionUpdate(question.id, updateData)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default SessionContent;