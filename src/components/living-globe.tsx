const TREE_MARKERS = [
  "north-america",
  "south-america",
  "europe",
  "africa",
  "asia",
  "oceania",
] as const;

export function LivingGlobe({ label }: { label: string }) {
  return (
    <div className="living-globe" role="img" aria-label={label}>
      <div className="living-globe__halo" aria-hidden="true" />

      <div className="living-globe__sphere" aria-hidden="true">
        <div className="living-globe__surface">
          <div className="living-globe__land" />

          <div className="living-globe__meridian" />
          <div className="living-globe__parallel" />

          <svg
            className="living-globe__arcs"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            focusable="false"
          >
            <path d="M16 39 C34 14 59 15 79 37" />
            <path d="M31 67 C47 45 67 43 84 62" />
          </svg>

          {TREE_MARKERS.map((marker) => (
            <span
              key={marker}
              className={`living-tree living-tree--${marker}`}
            >
              <span className="living-tree__glow" />
            </span>
          ))}
        </div>

        <div className="living-globe__specular" />
        <div className="living-globe__shade" />
      </div>
    </div>
  );
}
