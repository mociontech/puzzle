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
          <h1>Tu próximo<br /><em>gran plan</em><br />comienza aquí.</h1>
          <p>Dos experiencias, una forma diferente de descubrir el universo Renault.</p>
        </div>
        <div className="experience-home__choices" aria-label="Elige tu experiencia">
          <button className="experience-choice experience-choice--trivia" onClick={onTrivia}>
            <span className="experience-choice__eyebrow">01 / DESCUBRE</span>
            <span className="experience-choice__icon" aria-hidden="true">✳</span>
            <span className="experience-choice__name">TRIVIA</span>
            <span className="experience-choice__description">¿Qué Renault va con tu estilo?<br />5 preguntas · 1 resultado</span>
            <span className="experience-choice__arrow" aria-hidden="true">↗</span>
          </button>
          <button className="experience-choice experience-choice--puzzle" onClick={onPuzzle}>
            <span className="experience-choice__eyebrow">02 / EXPLORA</span>
            <span className="experience-choice__icon experience-choice__icon--tiles" aria-hidden="true">▦</span>
            <span className="experience-choice__name">PUZZLE</span>
            <span className="experience-choice__description">Cada pieza revela<br />lo extraordinario.</span>
            <span className="experience-choice__arrow" aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
      <div className="experience-home__bottom"><span>RENAULT</span><span>ELIGE · JUEGA · DESCUBRE</span></div>
    </main>
  );
}
