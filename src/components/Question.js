// File: components/Question.js
import React, { useState, useRef } from 'react';
import DrawingCanvas from './DrawingCanvas';
import './Question.css';

const Question = ({ question, onUpdate }) => {
  const [hint, setHint] = useState(null);
  const [explanation, setExplanation] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canvasRef = useRef(null);

  const handleRequestHint = () => {
    if (question.hint_requested) return;
    
    // In a real app, we would call an AI service for a hint
    // For now, generate a simple hint based on the question
    
    // Extract a hint from the explanation
    const hintText = question.question_payload.explanation.split('.')[0] + '.';
    
    setHint(hintText);
    onUpdate({ hint_requested: true });
  };

  const handleRequestExplanation = () => {
    if (question.explanation_requested) return;
    
    // Set the explanation from our question data
    setExplanation(question.question_payload.explanation);
    onUpdate({ explanation_requested: true });
  };

  const handleSubmitAndNext = async () => {
    if (isSubmitting || !canvasRef.current) return;
    
    setIsSubmitting(true);
    
    try {
      // Get the canvas drawing as a data URL
      const canvasImage = canvasRef.current.getImageData();
      
      // Update the question with the user's answer
      await onUpdate({ user_answer: canvasImage });
      
      // Reset states
      setHint(null);
      setExplanation(null);
    } catch (error) {
      console.error("Error submitting answer:", error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="question-entry">
      <div className="question-text">
        {question.question_payload.questionText}
      </div>
      
      <DrawingCanvas ref={canvasRef} existingData={question.user_answer} />
      
      {hint && (
        <div className="hint-box">
          <h4>Hint:</h4>
          <p>{hint}</p>
        </div>
      )}
      
      {explanation && (
        <div className="explanation-box">
          <h4>Explanation:</h4>
          <p>{explanation}</p>
        </div>
      )}
      
      <div className="question-controls">
        <button 
          className="hint-button"
          onClick={handleRequestHint}
          disabled={question.hint_requested && !hint}
        >
          {question.hint_requested && !hint ? 'Loading Hint...' : 'Hint'}
        </button>
        
        <button 
          className="explain-button"
          onClick={handleRequestExplanation}
          disabled={question.explanation_requested && !explanation}
        >
          {question.explanation_requested && !explanation ? 'Loading Explanation...' : 'Explain'}
        </button>
        
        <button 
          className="submit-button"
          onClick={handleSubmitAndNext}
          disabled={isSubmitting || !!question.user_answer}
        >
          {isSubmitting ? 'Submitting...' : question.user_answer ? 'Submitted' : 'Submit & Next'}
        </button>
      </div>
    </div>
  );
};

export default Question;