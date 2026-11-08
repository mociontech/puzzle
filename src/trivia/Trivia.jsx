import { useEffect, useRef, useState } from 'react';
import { CARS, QUESTIONS, getTriviaResult } from './triviaData';
import './trivia.css';

const LETTERS = ['A', 'B', 'C', 'D'];
const CAR_ORDER = ['kardian', 'arkana', 'filante', 'kwid', 'koleos', 'duster'];
const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 1.5;

function TriviaHeader({ onExit, showBack, onBack }) {
  return (
    <header className="trv-header">
      <button className="trv-nav-back" onClick={showBack ? onBack : onExit}
        aria-label={showBack ? 'Volver al paso anterior' : 'Volver al menú'}>← <span>VOLVER</span></button>
      <div className="trv-brand">
        <img src="/images/logo-renault.png" alt="Renault" />
        <span>EXPERIENCIA RENAULT</span>
      </div>
      <button className="trv-menu" onClick={onExit}>MENÚ <span aria-hidden="true">↗</span></button>
    </header>
  );
}

/**
 * Visor a pantalla completa: foto completa del vehículo con zoom
 * (botones, rueda, doble toque y pellizco) y desplazamiento con el dedo.
 */
function CarViewer({ carKey, onClose, onNavigate }) {
  const car = CARS[carKey];
  const index = CAR_ORDER.indexOf(carKey);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef(0);

  useEffect(() => { setView({ scale: 1, x: 0, y: 0 }); }, [carKey]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      if (onNavigate && e.key === 'ArrowRight') onNavigate(1);
      if (onNavigate && e.key === 'ArrowLeft') onNavigate(-1);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNavigate]);

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  // Limita el desplazamiento para que la foto no se pierda fuera del área.
  function clampOffset(x, y, scale) {
    const stage = stageRef.current?.getBoundingClientRect();
    const img = imgRef.current?.getBoundingClientRect();
    if (!stage || !img) return { x, y };
    const baseW = img.width / (view.scale || 1);
    const baseH = img.height / (view.scale || 1);
    const maxX = Math.max(0, (baseW * scale - stage.width) / 2 + 40);
    const maxY = Math.max(0, (baseH * scale - stage.height) / 2 + 40);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }

  // Acerca o aleja manteniendo fijo el punto (px, py) relativo al centro del área.
  function zoomTo(nextScale, px = 0, py = 0) {
    setView((cur) => {
      const scale = clamp(nextScale, ZOOM_MIN, ZOOM_MAX);
      if (scale === 1) return { scale: 1, x: 0, y: 0 };
      const k = scale / cur.scale;
      const { x, y } = clampOffset(px - (px - cur.x) * k, py - (py - cur.y) * k, scale);
      return { scale, x, y };
    });
  }

  function relative(e) {
    const r = stageRef.current.getBoundingClientRect();
    return { x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) };
  }

  function onPointerDown(e) {
    if (e.target.closest('button')) return; // los botones ‹ › gestionan su propio clic
    stageRef.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    if (pts.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        const p = relative(e);
        zoomTo(view.scale > 1 ? 1 : 2.5, p.x, p.y);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
      gesture.current = { type: 'pan', startX: e.clientX, startY: e.clientY, origX: view.x, origY: view.y };
    } else if (pts.length === 2) {
      gesture.current = {
        type: 'pinch',
        startDist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        startScale: view.scale,
      };
    }
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.type === 'pan' && view.scale > 1) {
      const { x, y } = clampOffset(g.origX + (e.clientX - g.startX), g.origY + (e.clientY - g.startY), view.scale);
      setView((cur) => ({ ...cur, x, y }));
    } else if (g.type === 'pinch' && pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const r = stageRef.current.getBoundingClientRect();
      const mid = { x: (pts[0].x + pts[1].x) / 2 - (r.left + r.width / 2), y: (pts[0].y + pts[1].y) / 2 - (r.top + r.height / 2) };
      zoomTo(g.startScale * (dist / g.startDist), mid.x, mid.y);
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    const pts = [...pointers.current.entries()];
    if (pts.length === 1) {
      const [, p] = pts[0];
      gesture.current = { type: 'pan', startX: p.x, startY: p.y, origX: view.x, origY: view.y };
    } else if (pts.length === 0) {
      gesture.current = null;
    }
  }

  function onWheel(e) {
    const p = relative(e);
    zoomTo(view.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y);
  }

  return (
    <div className="trv-viewer" role="dialog" aria-modal="true" aria-label={`Foto de ${car.name}`}>
      <header className="trv-viewer-top">
        <button className="trv-nav-back" onClick={onClose} aria-label="Volver">← <span>VOLVER</span></button>
        <div className="trv-brand">
          <img src="/images/logo-renault.png" alt="Renault" />
          <span>{onNavigate ? `VEHÍCULO ${String(index + 1).padStart(2, '0')} / 06` : 'TU RENAULT IDEAL'}</span>
        </div>
        <button className="trv-viewer-close" onClick={onClose} aria-label="Cerrar">CERRAR <span aria-hidden="true">✕</span></button>
      </header>

      <div className={`trv-viewer-stage ${view.scale > 1 ? 'is-zoomed' : ''}`} ref={stageRef}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp} onPointerCancel={onPointerUp} onWheel={onWheel}>
        <img ref={imgRef} src={car.image} alt={car.name} draggable="false"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }} />
        {onNavigate && (
          <>
            <button className="trv-viewer-nav trv-viewer-nav--prev" onClick={() => onNavigate(-1)} aria-label="Vehículo anterior">‹</button>
            <button className="trv-viewer-nav trv-viewer-nav--next" onClick={() => onNavigate(1)} aria-label="Vehículo siguiente">›</button>
          </>
        )}
      </div>

      <footer className="trv-viewer-bottom">
        <div className="trv-viewer-name">
          <span className="trv-kicker"><span className="trv-kicker-line" /> {car.profile.toUpperCase()}</span>
          <strong>{car.name}</strong>
        </div>
        <div className="trv-viewer-zoom" aria-label="Zoom">
          <button onClick={() => zoomTo(view.scale / ZOOM_STEP)} disabled={view.scale <= ZOOM_MIN} aria-label="Alejar">−</button>
          <span className="trv-viewer-level">{Math.round(view.scale * 100)}%</span>
          <button onClick={() => zoomTo(view.scale * ZOOM_STEP)} disabled={view.scale >= ZOOM_MAX} aria-label="Acercar">+</button>
          <button className="trv-viewer-reset" onClick={() => zoomTo(1)} disabled={view.scale === 1}>AJUSTAR</button>
        </div>
      </footer>
    </div>
  );
}

function Intro({ onStart, onExit }) {
  const [viewer, setViewer] = useState(null);
  const navigate = (dir) => setViewer((key) => CAR_ORDER[(CAR_ORDER.indexOf(key) + dir + CAR_ORDER.length) % CAR_ORDER.length]);
  return (
    <div className="trv-app">
      <TriviaHeader onExit={onExit} />
      <main className="trv-intro">
        <section className="trv-intro-content">
          <div className="trv-kicker"><span className="trv-kicker-line" /> DESCUBRE TU ESTILO</div>
          <h1>¿QUÉ RENAULT<br />VA CONTIGO<span>?</span></h1>
          <p>Hay un Renault para cada forma de vivir. Responde cinco preguntas y descubre cuál se parece más a ti.</p>
          <div className="trv-metrics"><span><strong>05</strong> PREGUNTAS</span><span><strong>06</strong> VEHÍCULOS</span><span><strong>01</strong> RESULTADO</span></div>
          <button className="trv-cta" onClick={onStart}>COMENZAR TRIVIA <span aria-hidden="true">↗</span></button>
          <div className="trv-helper">Sin respuestas correctas o incorrectas. Solo tu personalidad.</div>
        </section>
        <section className="trv-intro-visual" aria-label="Vehículos Renault">
          <div className="trv-gallery-head"><span>SEIS VEHÍCULOS</span><span>TOCA UNA FOTO PARA VERLA COMPLETA</span></div>
          <div className="trv-gallery">
            {CAR_ORDER.map((key, index) => (
              <button type="button" className={`trv-gallery-card trv-gallery-card--${index}`} key={key}
                onClick={() => setViewer(key)} aria-label={`Ver foto de ${CARS[key].name}`}>
                <div className="trv-gallery-photo">
                  <img src={CARS[key].image} alt="" />
                  <i className="trv-gallery-zoom" aria-hidden="true">⊕</i>
                </div>
                <span className="trv-gallery-label">{CARS[key].name}</span>
              </button>
            ))}
          </div>
        </section>
      </main>
      <div className="trv-bottomline"><span>RENAULT</span><span>¿QUÉ RENAULT VA CON TU ESTILO?</span></div>
      {viewer && <CarViewer carKey={viewer} onClose={() => setViewer(null)} onNavigate={navigate} />}
    </div>
  );
}

function Question({ index, answer, onChoose, onPrevious, onExit }) {
  const question = QUESTIONS[index];
  return (
    <div className="trv-app trv-app--question">
      <TriviaHeader showBack onBack={onPrevious} onExit={onExit} />
      <main className="trv-question-shell">
        <aside className="trv-question-left">
          <div className="trv-kicker"><span className="trv-kicker-line" /> ENCUENTRA TU RENAULT</div>
          <div className="trv-question-count"><strong>{String(index + 1).padStart(2, '0')}</strong><span>/ 05</span></div>
          <h1>ELIGE LO QUE<br />MÁS VA <em>CONTIGO.</em></h1>
          <div className="trv-progress" aria-label={`Pregunta ${index + 1} de 5`}>
            {QUESTIONS.map((_, i) => <span className={i <= index ? 'active' : ''} key={i} />)}
          </div>
          <div className="trv-question-sidebar-note">NO HAY RESPUESTAS EQUIVOCADAS.<br />SIGUE TU INSTINTO.</div>
          {/* Logo Renault original como marca de agua */}
          <img className="trv-geo" src="/images/logo-renault.png" alt="" aria-hidden="true" />
        </aside>
        <section className="trv-question-panel">
          <div className="trv-question-overline">PREGUNTA {String(index + 1).padStart(2, '0')} <span>DE 05</span></div>
          <h2>{question.text}</h2>
          <div className="trv-options">
            {question.options.map((option, i) => (
              <button className={`trv-option ${answer === i ? 'trv-option--selected' : ''}`}
                onClick={() => onChoose(i)} key={`${index}-${i}`}>
                <span className="trv-option-letter">{LETTERS[i]}</span>
                <span className="trv-option-label">{option.text}</span>
                <span className="trv-option-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <div className="trv-question-footer">TOCA UNA RESPUESTA PARA CONTINUAR <span>✳</span></div>
        </section>
      </main>
      <div className="trv-bottomline"><span>RENAULT</span><span>DESCUBRE TU ESTILO</span></div>
    </div>
  );
}

function Result({ car, onRestart, onExit }) {
  const [viewer, setViewer] = useState(false);
  return (
    <div className="trv-app trv-app--result">
      <TriviaHeader showBack onBack={onRestart} onExit={onExit} />
      <main className="trv-result">
        <button type="button" className="trv-result-image" onClick={() => setViewer(true)} aria-label={`Ver foto completa de ${car.name}`}>
          <img src={car.image} alt="" />
          <span className="trv-result-image-label">TU RENAULT IDEAL / 01</span>
          <span className="trv-result-image-zoom"><i aria-hidden="true">⊕</i> VER CON ZOOM</span>
        </button>
        <section className="trv-result-info">
          <div className="trv-kicker"><span className="trv-kicker-line" /> EL RESULTADO ESTÁ AQUÍ</div>
          <span className="trv-result-overline">TU RENAULT IDEAL ES…</span>
          <h1>{car.name}</h1>
          <span className="trv-result-profile">{car.profile.toUpperCase()}</span>
          <h2>{car.motto}</h2>
          <p>{car.description}</p>
          <div className="trv-result-actions">
            <button className="trv-cta" onClick={onRestart}>VOLVER A JUGAR <span aria-hidden="true">↗</span></button>
            <button className="trv-outline" onClick={onExit}>MENÚ PRINCIPAL</button>
          </div>
          <a className="trv-original-link" href={car.boxUrl} target="_blank" rel="noopener noreferrer">
            VER IMAGEN DEL VEHÍCULO ↗
          </a>
        </section>
      </main>
      <div className="trv-bottomline"><span>RENAULT</span><span>TU ESTILO · TU RENAULT</span></div>
      {viewer && <CarViewer carKey={car.id} onClose={() => setViewer(false)} onNavigate={null} />}
    </div>
  );
}

export default function Trivia({ onExit }) {
  const [step, setStep] = useState(-1); // -1: intro; 0..4: pregunta; 5: resultado
  const [answers, setAnswers] = useState([null, null, null, null, null]);

  function restart() {
    setAnswers([null, null, null, null, null]);
    setStep(-1);
  }
  function choose(choice) {
    setAnswers((current) => current.map((value, index) => index === step ? choice : value));
    setStep((current) => current + 1);
  }
  function previous() {
    setStep((current) => Math.max(-1, current - 1));
  }
  if (step === -1) return <Intro onStart={() => setStep(0)} onExit={onExit} />;
  if (step < QUESTIONS.length) {
    return <Question index={step} answer={answers[step]} onChoose={choose}
      onPrevious={previous} onExit={onExit} />;
  }
  const { car } = getTriviaResult(answers);
  return <Result car={car} onRestart={restart} onExit={onExit} />;
}
