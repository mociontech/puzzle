/* eslint-disable react/prop-types */
import { ArrowUpRightIcon, ChatIcon, SquaresIcon } from './icons';
import './experience.css';

export default function Splash({ onTrivia, onPuzzle }) {
  return (
    <main className="experience-home">
      <div className="experience-home__top">
        <img src="/images/logo-renault.png" alt="Renault" className="experience-home__logo" />
        <span className="experience-home__edition">EXPERIENCIA INTERACTIVA</span>
      </div>

      <div className="experience-home__main">
        <div className="experience-home__intro">
          <span className="experience-eyebrow"><span className="experience-dot" /> DESCUBRE TU CAMINO</span>
          <h1>tu próximo<br />gran plan<br />comienza aquí</h1>
          <span className="experience-home__bar" aria-hidden="true" />
          <p>dos experiencias, una forma diferente de descubrir el universo Renault</p>
        </div>
        <div className="experience-home__choices" aria-label="Elige tu experiencia">
          <button className="experience-choice experience-choice--trivia" onClick={onTrivia}>
            <span className="experience-choice__eyebrow">01 / DESCUBRE</span>
            <ChatIcon className="experience-choice__icon experience-choice__icon--chat" />
            <span className="experience-choice__name">TRIVIA</span>
            <span className="experience-choice__description">¿cuál Renault va con tu estilo?<br />5 preguntas · 1 resultado</span>
            <ArrowUpRightIcon className="experience-choice__arrow" />
          </button>
          <button className="experience-choice experience-choice--puzzle" onClick={onPuzzle}>
            <span className="experience-choice__eyebrow">02 / EXPLORA</span>
            <SquaresIcon className="experience-choice__icon experience-choice__icon--tiles" />
            <span className="experience-choice__name">PUZZLE</span>
            <span className="experience-choice__description">cada pieza revela<br />lo extraordinario</span>
            <ArrowUpRightIcon className="experience-choice__arrow" />
          </button>
        </div>
      </div>
      <div className="experience-home__bottom"><span>RENAULT</span><span>ELIGE · JUEGA · DESCUBRE</span></div>
    </main>
  );
}
