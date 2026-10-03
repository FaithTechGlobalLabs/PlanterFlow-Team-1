"use client";

import { TreeSapling } from "./ui/TreeSapling";

export function GlobeCard() {
  const treePositions = [
    { left: "18%", top: "22%" },
    { left: "39%", top: "22%" },
    { left: "60%", top: "22%" },
    { left: "18%", top: "49%" },
    { left: "39%", top: "49%" },
    { left: "60%", top: "49%" },
  ];

  return (
    <div className="relative w-full md:w-[650px] h-[450px] md:h-[520px] bg-[var(--color-navy)] rounded-[var(--radius-card)] overflow-hidden p-6">
      <img
        src="/globe/outline.svg"
        alt="Globe outline"
        className="absolute inset-0 w-full h-full"
      />
      <img
        src="/globe/meridian-wide.svg"
        alt="Meridian"
        className="absolute"
        style={{ inset: "1.78% 22.22% auto 1.78%" }}
      />
      <img
        src="/globe/meridian-narrow.svg"
        alt="Meridian narrow"
        className="absolute"
        style={{ inset: "1.78% 36% auto auto" }}
      />
      <img
        src="/globe/parallel-low.svg"
        alt="Parallel"
        className="absolute"
        style={{ inset: "34% 1.78% auto auto" }}
      />
      <img
        src="/globe/parallel-high.svg"
        alt="Parallel high"
        className="absolute"
        style={{ inset: "18.22% 1.78% auto auto" }}
      />
      <img
        src="/globe/continents.svg"
        alt="Continents"
        className="absolute"
        style={{
          inset: "14.89% 11.56% 24.44% 13.33%",
        }}
      />

      {treePositions.map((pos, idx) => (
        <TreeSapling
          key={idx}
          className="absolute w-[8%] h-auto"
          style={{
            left: pos.left,
            top: pos.top,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </div>
  );
}
