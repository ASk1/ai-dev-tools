import React, { useState, useEffect, useRef } from "react";

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{ x: 8, y: 8 }];
const INITIAL_FOOD = { x: 5, y: 5 };
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

export default function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState(INITIAL_FOOD);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  const directionRef = useRef(direction);
  directionRef.current = direction;

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case "ArrowUp":
          if (directionRef.current.y === 0)
            setDirection({ x: 0, y: -1 });
          break;
        case "ArrowDown":
          if (directionRef.current.y === 0)
            setDirection({ x: 0, y: 1 });
          break;
        case "ArrowLeft":
          if (directionRef.current.x === 0)
            setDirection({ x: -1, y: 0 });
          break;
        case "ArrowRight":
          if (directionRef.current.x === 0)
            setDirection({ x: 1, y: 0 });
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      moveSnake();
    }, GAME_SPEED);

    return () => clearInterval(interval);
  }, [snake, gameOver]);

  const moveSnake = () => {
    const newHead = {
      x: snake[0].x + directionRef.current.x,
      y: snake[0].y + directionRef.current.y,
    };

    // Wall collision
    if (
      newHead.x < 0 ||
      newHead.y < 0 ||
      newHead.x >= GRID_SIZE ||
      newHead.y >= GRID_SIZE
    ) {
      setGameOver(true);
      return;
    }

    // Self collision
    if (snake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
      setGameOver(true);
      return;
    }

    const newSnake = [newHead, ...snake];

    // Food collision
    if (newHead.x === food.x && newHead.y === food.y) {
      setScore(score + 1);
      generateFood(newSnake);
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  };

  const generateFood = (currentSnake) => {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );

    setFood(newFood);
  };

  const restartGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood(INITIAL_FOOD);
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
  };

  return (
    <div style={{ textAlign: "center", marginTop: 20 }}>
      <h1>🐍 Snake Game</h1>
      <h2>Score: {score}</h2>

      <div
        style={{
          margin: "0 auto",
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          display: "grid",
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          backgroundColor: "#111",
        }}
      >
        {[...Array(GRID_SIZE * GRID_SIZE)].map((_, index) => {
          const x = index % GRID_SIZE;
          const y = Math.floor(index / GRID_SIZE);

          const isSnake = snake.some(
            (segment) => segment.x === x && segment.y === y
          );

          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={index}
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor: isSnake
                  ? "lime"
                  : isFood
                  ? "red"
                  : "#222",
                border: "1px solid #333",
              }}
            />
          );
        })}
      </div>

      {gameOver && (
        <div>
          <h2>Game Over</h2>
          <button onClick={restartGame}>Restart</button>
        </div>
      )}
    </div>
  );
}
