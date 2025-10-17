// src/pages/EasterEggPage.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';

// Game Constants
const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const DIRECTIONS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

// Custom hook for game loop interval
const useInterval = (callback: () => void, delay: number | null) => {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    function tick() {
      if (savedCallback.current) {
        savedCallback.current();
      }
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

const EasterEggPage: React.FC = () => {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(DIRECTIONS.ArrowRight);
  const [speed, setSpeed] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const generateFood = (snakeBody: { x: number; y: number }[]) => {
    let newFoodPosition;
    do {
      newFoodPosition = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
      };
    } while (snakeBody.some(segment => segment.x === newFoodPosition.x && segment.y === newFoodPosition.y));
    return newFoodPosition;
  };

  const changeDirection = useCallback((newDirection: { x: number, y: number }) => {
    if (newDirection.x !== 0 && direction.x === 0) {
      setDirection(newDirection);
    }
    if (newDirection.y !== 0 && direction.y === 0) {
      setDirection(newDirection);
    }
  }, [direction]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowUp': changeDirection(DIRECTIONS.ArrowUp); break;
      case 'ArrowDown': changeDirection(DIRECTIONS.ArrowDown); break;
      case 'ArrowLeft': changeDirection(DIRECTIONS.ArrowLeft); break;
      case 'ArrowRight': changeDirection(DIRECTIONS.ArrowRight); break;
    }
  }, [changeDirection]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchStartRef.current) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartRef.current.x;
    const deltaY = touchEndY - touchStartRef.current.y;
    const swipeThreshold = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      if (Math.abs(deltaX) > swipeThreshold) {
        changeDirection(deltaX > 0 ? DIRECTIONS.ArrowRight : DIRECTIONS.ArrowLeft);
      }
    } else {
      if (Math.abs(deltaY) > swipeThreshold) {
        changeDirection(deltaY > 0 ? DIRECTIONS.ArrowDown : DIRECTIONS.ArrowUp);
      }
    }

    touchStartRef.current = null;
  };

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(DIRECTIONS.ArrowRight);
    setSpeed(150);
    setGameOver(false);
    setScore(0);
  };

  const gameLoop = useCallback(() => {
    const newSnake = [...snake];
    const head = { ...newSnake[0] };
    head.x += direction.x;
    head.y += direction.y;

    if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
      setGameOver(true);
      setSpeed(null);
      return;
    }

    for (let i = 1; i < newSnake.length; i++) {
      if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
        setGameOver(true);
        setSpeed(null);
        return;
      }
    }

    newSnake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      setScore(s => s + 10);
      setFood(generateFood(newSnake));
      setSpeed(s => Math.max(50, s! - 2));
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, [snake, direction, food]);

  useInterval(gameLoop, speed);
  
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4 font-sans">
      <div className="absolute top-4 left-4">
        <Link to="/" className="text-text-tertiary hover:text-brand-green transition-colors">
          &larr; Back to litelelo.
        </Link>
      </div>
      <h1 className="text-3xl sm:text-4xl font-raleway font-black text-brand-green mb-1">SNAKE</h1>
      <p className="text-text-secondary mb-3 text-sm sm:text-base">Use arrow keys or swipe to move</p>
      
      <div 
        className="relative bg-secondary p-2 rounded-lg shadow-2xl border-2 border-tertiary"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="grid gap-px bg-tertiary"
          style={{ 
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            width: 'clamp(300px, 90vw, 600px)',
            aspectRatio: '1 / 1',
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, i) => {
            const x = i % BOARD_SIZE;
            const y = Math.floor(i / BOARD_SIZE);
            const isSnake = snake.some(seg => seg.x === x && seg.y === y);
            const isFood = food.x === x && food.y === y;
            return (
              <div 
                key={i} 
                className={`w-full h-full ${
                  isSnake ? 'bg-brand-green rounded-sm' : isFood ? 'bg-red-500 rounded-full' : 'bg-primary'
                }`}
              />
            );
          })}
        </div>
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
            <h2 className="text-5xl font-bold text-red-500">Game Over</h2>
            <p className="text-xl text-white mt-2">Your Score: {score}</p>
            <button
              onClick={startGame} // Keep onClick for desktop & keyboard users
              onTouchEnd={(e) => {
                e.stopPropagation(); // Stop the event from bubbling to the parent div
                startGame();
              }}
              className="mt-6 bg-brand-green text-black font-bold py-3 px-8 rounded-full hover:bg-brand-green-darker transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
      <div className="mt-4 text-xl text-text-main font-semibold">
        Score: <span className="text-brand-green">{score}</span>
      </div>
      {!speed && !gameOver && (
        <button
            onClick={startGame}
            className="mt-6 bg-brand-green text-black font-bold py-3 px-8 rounded-full hover:bg-brand-green-darker transition-colors animate-pulse"
        >
            Start Game
        </button>
      )}
    </div>
  );
};

export default EasterEggPage;