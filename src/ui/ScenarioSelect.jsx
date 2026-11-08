import Header from "./Header";

// Fotos oficiales del cliente (Box), recortadas a 16:9 para el tablero.
// Los nombres comerciales son EXACTOS al correo del cliente.
const items = [
  { id: "arkana", name: "RENAULT ARKANA HYBRID E-TECH", img: "/images/puzzle/arkana.jpg" },
  { id: "koleos", name: "RENAULT KOLEOS FULL HYBRID E-TECH", img: "/images/puzzle/koleos.jpg" },
  { id: "duster", name: "RENAULT DUSTER HYBRID E-TECH 4X4", img: "/images/puzzle/duster.jpg" },
  { id: "filante", name: "RENAULT FILANTE FULL HYBRID E-TECH", img: "/images/puzzle/filante.jpg" },
];

export default function ScenarioSelect({ onPick, onBack }) {
  return (
    <div className="screen select-screen">
      <Header showBack onBack={onBack} />

      <div className="select-head">
        <span className="select-kicker"><span className="select-kicker-line" /> 02 / EXPLORA</span>
        <h2 className="title font-bold">SELECCIONA TU ROMPECABEZAS</h2>
        <p className="select-sub">Cuatro modelos. Elige uno y arma cada pieza.</p>
      </div>

      <div className="grid cols-4">
        {items.map((it, index) => (
          <button key={it.id} className="card" onClick={() => onPick(it.img, it.name)}>
            <div className="thumb">
              <img src={it.img} alt={it.name} />
              <span className="card-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="arrow-overlay" aria-hidden>➜</span>
            </div>
            <div className="caption">
              <div className="title font-regular">{it.name}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
