import "@/components/garden/garden.css";
export default function Loading() {
  return (
    <main
      className="catalyst-garden-app garden-main"
      aria-busy="true"
      aria-label="Loading your garden"
    >
      <p className="garden-eyebrow">FIRST FRUITS</p>
      <header className="garden-heading">
        <div>
          <h1>Your garden</h1>
          <p role="status">Gathering your churches and their latest updates…</p>
        </div>
      </header>
      <div className="garden-scene" aria-hidden="true">
        <div className="garden-landscape">
          <div className="garden-hill garden-hill-back" />
          <div className="garden-hill garden-hill-front" />
        </div>
      </div>
    </main>
  );
}
