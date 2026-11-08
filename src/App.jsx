// Navegación de la experiencia Renault: Puzzle existente + nueva trivia.
import { useState } from 'react';
import Splash from './ui/Splash';
import ScenarioSelect from './ui/ScenarioSelect';
import Puzzle20 from './rompecabezas/Puzzle20';
import JigsawSVG from './jigsaw/JigsawSVG';
import Header from './ui/Header';
import Trivia from './trivia/Trivia';
import './ui/ui.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | select | play | trivia
  const [triviaSession, setTriviaSession] = useState(0);
  const [img, setImg] = useState('/images/esc1.png');
  const [lastMoves, setLastMoves] = useState(null);
  const [mode, setMode] = useState('grid');
  const ROWS = 3;
  const COLS = 5;

  function openTrivia() {
    setTriviaSession((session) => session + 1);
    setScreen('trivia');
  }

  if (screen === 'home') {
    return <Splash onTrivia={openTrivia} onPuzzle={() => setScreen('select')} />;
  }
  if (screen === 'trivia') {
    return <Trivia key={triviaSession} onExit={() => setScreen('home')} />;
  }
  if (screen === 'select') {
    return (
      <ScenarioSelect
        onPick={(picked) => {
          setImg(picked);
          setLastMoves(null);
          setScreen('play');
        }}
        onBack={() => setScreen('home')}
      />
    );
  }

  // Todo el flujo del puzzle se conserva sin cambiar sus reglas.
  return (
    <div className="game-wrap">
      <Header showBack onBack={() => { setScreen('select'); setLastMoves(null); }} />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '4px 0 12px' }}>
        <button className={`btn ${mode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setMode('grid'); setLastMoves(null); }}>Modo A: Cuadrícula</button>
        <button className={`btn ${mode === 'jigsaw' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => { setMode('jigsaw'); setLastMoves(null); }}>Modo B: Piezas</button>
      </div>
      <div className="board">
        {mode === 'grid' ? (
          <Puzzle20 image={img} rows={ROWS} cols={COLS} className="fill"
            onWin={(moves) => setLastMoves(moves)} />
        ) : (
          <JigsawSVG imageSrc={img} rows={ROWS} cols={COLS}
            onSolved={(totalMoves) => setLastMoves(totalMoves)} />
        )}
      </div>
      {lastMoves != null && (
        <div className="pzl-overlay">
          <div className="pzl-card">
            <h2>¡Rompecabezas completado! 🎉</h2>
            <div className="subtle">Movimientos: <b>{lastMoves}</b></div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
              <button className="btn btn-primary"
                onClick={() => { setScreen('home'); setLastMoves(null); }}>Volver al inicio</button>
              <button className="btn btn-ghost"
                onClick={() => { setScreen('select'); setLastMoves(null); }}>Elegir otro puzzle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
