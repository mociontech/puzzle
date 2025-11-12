import Header from "./Header";

export default function Splash({ onStart }) {
  return (
    <section className="screen splash">
      {/* LOGO grande y más arriba */}
      <img
        className="s-logo"
        src="/images/logo-renault.png"   // usa tu ruta de logo
        alt="Renault"
      />

      {/* Texto y botón */}
      <div className="hero s-hero">
        <div className="big">
          bienvenidos a la experiencia Renault,
          <br />
          donde cada pieza revela lo extraordinario
        </div>
        <div className="small" style={{ marginTop: 10 }}>
          Toca “Iniciar” para comenzar
        </div>

        <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={onStart}>
          Iniciar
        </button>
      </div>
    </section>
  );
}


