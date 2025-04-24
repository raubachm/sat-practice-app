// File: components/DrawingCanvas.js
import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './DrawingCanvas.css';

const DrawingCanvas = forwardRef(({ existingData }, ref) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const isDrawingRef = useRef(false);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;
    
    const context = canvas.getContext("2d");
    context.scale(2, 2); // Retina display support
    context.lineCap = "round";
    context.strokeStyle = "black";
    context.lineWidth = 2;
    contextRef.current = context;
    
    // If there's existing data, load it
    if (existingData) {
      const image = new Image();
      image.onload = () => {
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      image.src = existingData;
    }
  }, [existingData]);
  
  // Expose functions to parent component
  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      const context = contextRef.current;
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
    getImageData: () => {
      const canvas = canvasRef.current;
      return canvas.toDataURL("image/png");
    }
  }));
  
  const startDrawing = ({ nativeEvent }) => {
    if (existingData) return; // Prevent drawing if answer already submitted
    
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
  };
  
  const finishDrawing = () => {
    contextRef.current.closePath();
    isDrawingRef.current = false;
  };
  
  const draw = ({ nativeEvent }) => {
    if (!isDrawingRef.current || existingData) return;
    
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };
  
  const handleTouchStart = (e) => {
    if (existingData) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    isDrawingRef.current = true;
  };
  
  const handleTouchMove = (e) => {
    if (!isDrawingRef.current || existingData) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const offsetX = touch.clientX - rect.left;
    const offsetY = touch.clientY - rect.top;
    
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();
  };
  
  const handleClear = () => {
    if (existingData) return;
    
    const canvas = canvasRef.current;
    const context = contextRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
  };
  
  return (
    <div className="drawing-container">
      <canvas
        className="drawing-canvas"
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={finishDrawing}
        onMouseLeave={finishDrawing}
        onMouseMove={draw}
        onTouchStart={handleTouchStart}
        onTouchEnd={finishDrawing}
        onTouchCancel={finishDrawing}
        onTouchMove={handleTouchMove}
      />
      {!existingData && (
        <div className="canvas-controls">
          <button
            className="clear-button"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
});

export default DrawingCanvas;