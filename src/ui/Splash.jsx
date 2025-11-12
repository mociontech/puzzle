import Header from "./Header";

export default function Splash({ onStart }) {
  return (
    <div className="screen">
      <Header />
      <div className="hero">
        <div className="big">Bienvenidos a la experiencia Renault,</div>
        <div className="big">donde cada pieza revela lo extraordinario</div>
        <div className="small subtle" style={{ marginTop: 10 }}>
          Toca “Iniciar” para comenzar
        </div>
      </div>
      <button className="btn btn-primary" onClick={onStart}>Iniciar</button>
    </div>
  );
}

