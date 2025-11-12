import Header from "./Header";

const items = [
  { id: "esc1", name: "ARKANA HYBRID E-TECH", img: "/images/esc1.png" },
  { id: "esc2", name: "KOLEOS FULL HYBRID E-TECH", img: "/images/esc2.png" },
  { id: "esc3", name: "BOREAL", img: "/images/esc3.png" },
];

export default function ScenarioSelect({ onPick, onBack }) {
  return (
    <div className="screen" style={{ gap: 16 }}>
      <Header showBack onBack={onBack} />
      <h2 className="title">Selecciona tu puzzle</h2>

      <div className="grid cols-3">
    {items.map(it => (
  <button key={it.id} className="card" onClick={() => onPick(it.img)}>
    <div className="thumb">
      <img src={it.img} alt={it.name} />
      <span className="arrow-overlay" aria-hidden>➜</span>
    </div>

    <div className="caption">
      <div className="title">{it.name}</div>
    </div>
  </button>
))}

      </div>
    </div>
  );
}
