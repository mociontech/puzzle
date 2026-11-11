// Navegación de la experiencia Renault: Puzzle existente + nueva trivia.
import { useRef, useState } from 'react';
import Splash from './ui/Splash';
import ScenarioSelect from './ui/ScenarioSelect';
import Puzzle20 from './rompecabezas/Puzzle20';
import JigsawSVG from './jigsaw/JigsawSVG';
import Header from './ui/Header';
import Trivia from './trivia/Trivia';
import { newSession, trackPuzzleCompleted } from './evius/tracker';
import './ui/ui.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | select | play | trivia
  const [triviaSession, setTriviaSession] = useState(0);
  const [img, setImg] = useState('/images/esc1.png');
  const [model, setModel] = useState('');
  const [lastMoves, setLastMoves] = useState(null);
  const [mode, setMode] = useState('grid');
  // Evius: una sesión = una persona usando el puzzle (desde que toca PUZZLE hasta que vuelve al inicio).
  const [session, setSession] = useState(null);
  const playStartedAt = useRef(null);
  const reported = useRef(false);
  const ROWS = 3;
  const COLS = 5;

  function openTrivia() {
    setTriviaSession((session) => session + 1);
    setScreen('trivia');
  }
  function openPuzzle() {
    setSession(newSession());
    setScreen('select');
  }
  function goHome() {
    setSession(null);
    setLastMoves(null);
    setScreen('home');
  }
  function startPlay() {
    playStartedAt.current = new Date().toISOString();
    reported.current = false;
    setLastMoves(null);
  }
  // Los dos modos pueden avisar varias veces el mismo final; solo se registra una vez por partida.
  function finishPlay(moves) {
    setLastMoves(moves);
    if (reported.current) return;
    reported.current = true;
    trackPuzzleCompleted({ sessionId: session?.id, model, mode, moves, startedAt: playStartedAt.current });
  }

  if (screen === 'home') {
    return <Splash onTrivia={openTrivia} onPuzzle={openPuzzle} />;
  }
  if (screen === 'trivia') {
    return <Trivia key={triviaSession} onExit={() => setScreen('home')} />;
  }
  if (screen === 'select') {
    return (
      <ScenarioSelect
        onPick={(picked, name) => {
          setImg(picked);
          setModel(name || picked);
          startPlay();
          setScreen('play');
        }}
        onBack={goHome}
      />
    );
  }

  // Todo el flujo del puzzle se conserva sin cambiar sus reglas.
  return (
    <div className="game-wrap">
      <Header showBack onBack={() => { setScreen('select'); setLastMoves(null); }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '4px 0 12px' }}>
        <button className={`btn ${mode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setMode('grid'); startPlay(); }}>Modo A: Cuadrícula</button>
        <button className={`btn ${mode === 'jigsaw' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setMode('jigsaw'); startPlay(); }}>Modo B: Piezas</button>
      </div>
      <div className="board">
        {mode === 'grid' ? (
          <Puzzle20 image={img} rows={ROWS} cols={COLS} className="fill"
            onWin={finishPlay} />
        ) : (
          <JigsawSVG imageSrc={img} rows={ROWS} cols={COLS}
            onSolved={finishPlay} />
        )}
      </div>
      {lastMoves != null && (
        <div className="pzl-overlay">
          <div className="pzl-card">
            <h2>¡rompecabezas completado!</h2>
            <div className="subtle">Movimientos: <b>{lastMoves}</b></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
              <button className="btn btn-primary"
                onClick={goHome}>Volver al inicio</button>
              <button className="btn btn-ghost"
                onClick={() => { setScreen('select'); setLastMoves(null); }}>Elegir otro puzzle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
