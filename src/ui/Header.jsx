export default function Header({ showBack = false, onBack }) {
  return (
    <header className="hdr">
      {showBack && (
        <button className="hdr-back" onClick={onBack} aria-label="Volver">
          ⟵
        </button>
      )}
      <img
        className="hdr-logo"
        src="/images/logo-renault.png"
        alt="Renault"
      />
    </header>
  );
}
