import { useState, useEffect, useCallback, useRef } from "react";

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const INITIAL_SPEED = 150;

const Direction = { UP: "UP", DOWN: "DOWN", LEFT: "LEFT", RIGHT: "RIGHT" };

const getInitialState = () => ({
  snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
  food: { x: 15, y: 15 },
  dir: Direction.RIGHT,
  nextDir: Direction.RIGHT,
  score: 0,
  highScore: 0,
  status: "idle", // idle | playing | paused | dead
  speed: INITIAL_SPEED,
});

const randomFood = (snake) => {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * GRID_SIZE), y: Math.floor(Math.random() * GRID_SIZE) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
};

export default function SnakeGame() {
  const [state, setState] = useState(getInitialState());
  const stateRef = useRef(state);
  stateRef.current = state;
  const intervalRef = useRef(null);
  const [flash, setFlash] = useState(false);

  const tick = useCallback(() => {
    setState(prev => {
      if (prev.status !== "playing") return prev;
      const dir = prev.nextDir;
      const head = prev.snake[0];
      const newHead = {
        x: (head.x + (dir === "RIGHT" ? 1 : dir === "LEFT" ? -1 : 0) + GRID_SIZE) % GRID_SIZE,
        y: (head.y + (dir === "DOWN" ? 1 : dir === "UP" ? -1 : 0) + GRID_SIZE) % GRID_SIZE,
      };
      const hitSelf = prev.snake.slice(1).some(s => s.x === newHead.x && s.y === newHead.y);
      if (hitSelf) {
        return { ...prev, status: "dead", highScore: Math.max(prev.score, prev.highScore) };
      }
      const ateFood = newHead.x === prev.food.x && newHead.y === prev.food.y;
      const newSnake = [newHead, ...prev.snake];
      if (!ateFood) newSnake.pop();
      const newScore = ateFood ? prev.score + 10 : prev.score;
      const newFood = ateFood ? randomFood(newSnake) : prev.food;
      const newSpeed = Math.max(60, INITIAL_SPEED - Math.floor(newScore / 50) * 10);
      if (ateFood) setFlash(true);
      return {
        ...prev, snake: newSnake, food: newFood, dir, nextDir: dir,
        score: newScore, speed: newSpeed,
      };
    });
  }, []);

  useEffect(() => {
    if (state.status === "playing") {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, state.speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [state.status, state.speed, tick]);

  useEffect(() => {
    if (flash) { const t = setTimeout(() => setFlash(false), 150); return () => clearTimeout(t); }
  }, [flash]);

  useEffect(() => {
    const handleKey = (e) => {
      const s = stateRef.current;
      const map = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT" };
      const opp = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (s.status === "idle" || s.status === "dead") {
          setState({ ...getInitialState(), highScore: s.highScore, status: "playing" });
        } else if (s.status === "playing") {
          setState(p => ({ ...p, status: "paused" }));
        } else if (s.status === "paused") {
          setState(p => ({ ...p, status: "playing" }));
        }
        return;
      }
      if (map[e.key] && s.status === "playing") {
        e.preventDefault();
        const newDir = map[e.key];
        if (opp[s.dir] !== newDir) setState(p => ({ ...p, nextDir: newDir }));
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const startGame = () => setState(p => ({ ...getInitialState(), highScore: p.highScore, status: "playing" }));
  const togglePause = () => setState(p => p.status === "playing" ? { ...p, status: "paused" } : p.status === "paused" ? { ...p, status: "playing" } : p);

  const snakeSet = new Set(state.snake.map(s => `${s.x},${s.y}`));
  const isHead = (x, y) => state.snake[0].x === x && state.snake[0].y === y;
  const isBody = (x, y) => !isHead(x, y) && snakeSet.has(`${x},${y}`);
  const segmentIndex = (x, y) => state.snake.findIndex(s => s.x === x && s.y === y);

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", background: "#0a0a0f",
      fontFamily: "'Courier New', monospace",
    }}>
      {/* Scanline overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
      }} />

      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h1 style={{
          fontSize: 48, fontWeight: 900, letterSpacing: 12,
          color: "#00ff88", textTransform: "uppercase",
          textShadow: "0 0 20px #00ff88, 0 0 40px #00ff8866",
          margin: 0, lineHeight: 1,
        }}>SNAKE</h1>
        <div style={{ color: "#ffffff33", fontSize: 11, letterSpacing: 6, marginTop: 6 }}>
          ◆ ARCADE EDITION ◆
        </div>
      </div>

      {/* Score row */}
      <div style={{ display: "flex", gap: 48, marginBottom: 16 }}>
        {[["SCORE", state.score], ["BEST", state.highScore]].map(([label, val]) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div style={{ color: "#ffffff44", fontSize: 10, letterSpacing: 4 }}>{label}</div>
            <div style={{
              color: "#00ff88", fontSize: 28, fontWeight: 900, letterSpacing: 4,
              textShadow: flash && label === "SCORE" ? "0 0 20px #00ff88" : "none",
              transition: "text-shadow 0.1s",
            }}>{String(val).padStart(4, "0")}</div>
          </div>
        ))}
      </div>

      {/* Game board */}
      <div style={{
        position: "relative",
        border: "2px solid #00ff8844",
        boxShadow: "0 0 30px #00ff8822, inset 0 0 60px #00000088",
        background: "#050508",
      }}>
        {/* Grid */}
        <svg
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          style={{ display: "block" }}
        >
          {/* Grid lines */}
          {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
            <g key={i}>
              <line x1={i * CELL_SIZE} y1={0} x2={i * CELL_SIZE} y2={GRID_SIZE * CELL_SIZE} stroke="#ffffff06" strokeWidth={1} />
              <line x1={0} y1={i * CELL_SIZE} x2={GRID_SIZE * CELL_SIZE} y2={i * CELL_SIZE} stroke="#ffffff06" strokeWidth={1} />
            </g>
          ))}

          {/* Snake body */}
          {state.snake.map((seg, i) => {
            const isH = i === 0;
            const t = i / state.snake.length;
            const alpha = Math.round((1 - t * 0.6) * 255).toString(16).padStart(2, "0");
            return (
              <g key={i}>
                <rect
                  x={seg.x * CELL_SIZE + 2}
                  y={seg.y * CELL_SIZE + 2}
                  width={CELL_SIZE - 4}
                  height={CELL_SIZE - 4}
                  rx={isH ? 6 : 4}
                  fill={isH ? "#00ff88" : `#00cc6e${alpha}`}
                  style={isH ? { filter: "drop-shadow(0 0 8px #00ff88)" } : {}}
                />
                {isH && (
                  <>
                    {/* Eyes */}
                    <circle cx={seg.x * CELL_SIZE + (state.dir === "LEFT" ? 7 : state.dir === "RIGHT" ? 17 : 8)} cy={seg.y * CELL_SIZE + (state.dir === "UP" ? 7 : state.dir === "DOWN" ? 17 : 8)} r={2} fill="#0a0a0f" />
                    <circle cx={seg.x * CELL_SIZE + (state.dir === "LEFT" ? 7 : state.dir === "RIGHT" ? 17 : 16)} cy={seg.y * CELL_SIZE + (state.dir === "UP" ? 7 : state.dir === "DOWN" ? 17 : 16)} r={2} fill="#0a0a0f" />
                  </>
                )}
              </g>
            );
          })}

          {/* Food */}
          <g>
            <circle
              cx={state.food.x * CELL_SIZE + CELL_SIZE / 2}
              cy={state.food.y * CELL_SIZE + CELL_SIZE / 2}
              r={CELL_SIZE / 2 - 4}
              fill="#ff3366"
              style={{ filter: "drop-shadow(0 0 8px #ff3366)" }}
            >
              <animate attributeName="r" values={`${CELL_SIZE/2-5};${CELL_SIZE/2-3};${CELL_SIZE/2-5}`} dur="1s" repeatCount="indefinite" />
            </circle>
            <circle
              cx={state.food.x * CELL_SIZE + CELL_SIZE / 2 - 2}
              cy={state.food.y * CELL_SIZE + CELL_SIZE / 2 - 2}
              r={2}
              fill="#ffffff55"
            />
          </g>

          {/* Overlay for non-playing states */}
          {state.status !== "playing" && (
            <rect x={0} y={0} width={GRID_SIZE * CELL_SIZE} height={GRID_SIZE * CELL_SIZE} fill="#00000099" />
          )}
        </svg>

        {/* State overlays */}
        {state.status === "idle" && (
          <div style={overlayStyle}>
            <div style={overlayTitle("#00ff88")}>READY?</div>
            <div style={overlayHint}>PRESS SPACE TO START</div>
            <div style={{ color: "#ffffff33", fontSize: 10, letterSpacing: 3, marginTop: 16 }}>
              ↑ ↓ ← → OR WASD TO MOVE
            </div>
          </div>
        )}
        {state.status === "paused" && (
          <div style={overlayStyle}>
            <div style={overlayTitle("#ffcc00")}>PAUSED</div>
            <div style={overlayHint}>PRESS SPACE TO RESUME</div>
          </div>
        )}
        {state.status === "dead" && (
          <div style={overlayStyle}>
            <div style={overlayTitle("#ff3366")}>GAME OVER</div>
            <div style={{ color: "#ffffff66", fontSize: 14, letterSpacing: 3, margin: "8px 0 4px" }}>
              SCORE: {state.score}
            </div>
            {state.score >= state.highScore && state.score > 0 && (
              <div style={{ color: "#ffcc00", fontSize: 11, letterSpacing: 4, marginBottom: 8, textShadow: "0 0 10px #ffcc00" }}>
                ★ NEW HIGH SCORE ★
              </div>
            )}
            <div style={overlayHint}>PRESS SPACE TO RETRY</div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
        {state.status === "idle" || state.status === "dead" ? (
          <button onClick={startGame} style={btnStyle("#00ff88")}>START GAME</button>
        ) : (
          <button onClick={togglePause} style={btnStyle(state.status === "paused" ? "#00ff88" : "#ffcc00")}>
            {state.status === "paused" ? "RESUME" : "PAUSE"}
          </button>
        )}
        {(state.status === "playing" || state.status === "paused") && (
          <button onClick={startGame} style={btnStyle("#ff3366")}>RESTART</button>
        )}
      </div>

      {/* Mobile controls */}
      <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 48px)", gridTemplateRows: "repeat(3, 48px)", gap: 4 }}>
        {[
          [null, "UP", null],
          ["LEFT", null, "RIGHT"],
          [null, "DOWN", null],
        ].map((row, ri) => row.map((dir, ci) => dir ? (
          <button key={`${ri}-${ci}`} onClick={() => {
            const opp = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
            if (stateRef.current.status === "playing" && opp[stateRef.current.dir] !== dir)
              setState(p => ({ ...p, nextDir: dir }));
          }} style={{
            width: 48, height: 48, background: "#ffffff0d", border: "1px solid #ffffff22",
            color: "#00ff88", fontSize: 18, cursor: "pointer", borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.1s",
          }}>
            {dir === "UP" ? "↑" : dir === "DOWN" ? "↓" : dir === "LEFT" ? "←" : "→"}
          </button>
        ) : <div key={`${ri}-${ci}`} />))
        }
      </div>

      <div style={{ color: "#ffffff1a", fontSize: 10, letterSpacing: 2, marginTop: 20 }}>
        © SNAKE ARCADE — BUILT WITH REACT
      </div>
    </div>
  );
}

const overlayStyle = {
  position: "absolute", inset: 0, display: "flex", flexDirection: "column",
  alignItems: "center", justifyContent: "center",
};

const overlayTitle = (color) => ({
  fontSize: 36, fontWeight: 900, letterSpacing: 8, color,
  textShadow: `0 0 20px ${color}`,
  fontFamily: "'Courier New', monospace",
});

const overlayHint = {
  color: "#ffffffaa", fontSize: 11, letterSpacing: 4, marginTop: 12,
  animation: "none",
};

const btnStyle = (color) => ({
  background: "transparent", border: `1px solid ${color}44`,
  color: color, fontFamily: "'Courier New', monospace",
  fontSize: 11, letterSpacing: 4, padding: "10px 20px",
  cursor: "pointer", textTransform: "uppercase",
  boxShadow: `0 0 10px ${color}22`,
  transition: "all 0.2s",
});
