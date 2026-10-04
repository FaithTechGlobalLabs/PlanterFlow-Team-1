import { useId } from "react";
import type { TreeStage } from "@/lib/tree-stage";
import { GROWTH_LIMITS } from "@/lib/church-growth";
import "./tree.css";

/** Age shapes the structure. Progress and outcomes add details; attention never removes them. */
export function ChurchTree({
  completed = 0,
  progress = 0,
  branches = 0,
  stage,
  variant = 0,
}: {
  completed?: number;
  progress?: number;
  branches?: number;
  stage?: TreeStage;
  variant?: number;
}) {
  const id = useId().replace(/:/g, "");
  const early = stage === "seed" || stage === "sprout";
  const size =
    stage === "seed"
      ? 0.36
      : stage === "sprout"
        ? 0.52
        : stage === "sapling"
          ? 0.72
          : stage === "young"
            ? 0.88
            : stage === "established"
              ? 1
              : 0.8;
  const count = (value: number, cap: number) =>
    Math.min(cap, Math.max(0, Number.isFinite(value) ? Math.floor(value) : 0));
  return (
    <svg
      viewBox="0 0 200 230"
      aria-hidden="true"
      className={`garden-tree church-tree church-tree--${stage ?? "unknown"}`}
      data-stage={stage ?? "unknown"}
    >
      <defs>
        <radialGradient id={`${id}-leaf`} cx="30%" cy="22%" r="80%">
          <stop stopColor="var(--tree-leaf-light)" />
          <stop offset=".5" stopColor="var(--tree-leaf)" />
          <stop offset="1" stopColor="var(--tree-leaf-dark)" />
        </radialGradient>
        <linearGradient id={`${id}-bark`}>
          <stop stopColor="var(--tree-bark-light)" />
          <stop offset=".5" stopColor="var(--tree-bark)" />
          <stop offset="1" stopColor="var(--tree-bark-light)" />
        </linearGradient>
      </defs>
      <ellipse
        cx="100"
        cy="213"
        rx={early ? 36 : 65}
        ry="9"
        fill="var(--tree-shadow)"
        opacity=".14"
      />
      <g
        className="church-tree__structure"
        transform={`translate(100 210) scale(${size}) translate(-100 -210)`}
      >
        {early ? (
          <>
            <path
              className="church-tree__roots"
              d="M100 206 Q87 216 82 220 M100 206 Q110 218 119 220"
              stroke="var(--tree-bark)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
            />
            {stage === "seed" && (
              <ellipse
                cx="100"
                cy="198"
                rx="15"
                ry="10"
                fill="var(--tree-bark-light)"
                stroke="var(--tree-bark)"
                strokeWidth="3"
              />
            )}
            <path
              d={`M100 207 Q89 165 102 ${stage === "seed" ? 130 : 70}`}
              fill="none"
              stroke="var(--tree-bark)"
              strokeWidth={stage === "seed" ? 5 : 7}
              strokeLinecap="round"
            />
            <g
              className="church-tree__canopy"
              stroke="var(--tree-leaf-dark)"
              strokeWidth="1.5"
              fill={`url(#${id}-leaf)`}
            >
              <path d="M98 162 Q62 160 62 124 Q96 125 98 162 M100 140 Q138 133 137 103 Q105 106 100 140" />
              {stage === "sprout" && (
                <path d="M101 108 Q63 106 66 74 Q98 77 101 108 M104 83 Q130 79 132 52 Q108 54 104 83" />
              )}
            </g>
          </>
        ) : (
          <>
            <path
              className="church-tree__roots"
              d="M59 213 Q91 207 101 189 Q109 207 143 213"
              fill="none"
              stroke="var(--tree-bark)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M95 212 Q103 177 97 130 L68 94 L74 90 L103 119 L125 86 L132 89 L107 138 Q105 180 114 211Z"
              fill={`url(#${id}-bark)`}
            />
            <g
              className="church-tree__canopy"
              stroke="var(--tree-leaf-dark)"
              strokeWidth="1.5"
              fill={`url(#${id}-leaf)`}
            >
              {stage === "sapling" ? (
                <>
                  <ellipse cx="96" cy="60" rx="26" ry="38" />
                  <ellipse cx="73" cy="97" rx="30" ry="28" />
                  <ellipse cx="126" cy="93" rx="27" ry="29" />
                </>
              ) : (
                <path d="M30 105 Q17 81 34 68 Q29 46 51 40 Q55 20 77 26 Q91 9 111 24 Q139 14 147 40 Q170 42 164 67 Q188 79 169 103 Q168 129 145 132 Q121 153 103 137 Q77 154 60 136 Q36 141 30 119Z" />
              )}
              {Array.from({ length: stage === "sapling" ? 48 : 90 }, (_, i) => {
                const x = 41 + ((i * 47 + i * i * 7 + variant * 3) % 118);
                const y = 30 + ((i * 31 + i * i * 3) % 103);
                if (
                  ((x - 100) / (stage === "sapling" ? 50 : 66)) ** 2 +
                    ((y - 80) / 53) ** 2 >
                  1
                )
                  return null;
                return (
                  <ellipse
                    key={i}
                    cx={x}
                    cy={y}
                    rx={5 + (i % 5)}
                    ry={3 + (i % 3)}
                    transform={`rotate(${i * 37} ${x} ${y})`}
                    fill={i % 3 ? "var(--tree-leaf)" : "var(--tree-leaf-light)"}
                    opacity=".65"
                  />
                );
              })}
            </g>
          </>
        )}
        {Array.from(
          { length: count(branches, GROWTH_LIMITS.branches) },
          (_, i) => (
            <path
              key={i}
              className="church-tree__objective-branch"
              d={`M100 ${185 - i * 10} Q${i % 2 ? 122 : 78} ${166 - i * 10} ${i % 2 ? 134 : 66} ${158 - i * 10}`}
              stroke="var(--tree-bark)"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          ),
        )}
      </g>
      {/* Markers keep a readable size even on the youngest stages. */}
      {Array.from({ length: count(progress, GROWTH_LIMITS.leaves) }, (_, i) => (
        <ellipse
          key={i}
          className="church-tree__progress-leaf"
          cx={100 + (i % 2 ? 1 : -1) * (15 + (i % 5) * 7) * size}
          cy={210 - (60 + (i % 9) * 13) * size}
          rx="5"
          ry="3"
          transform={`rotate(${i % 2 ? -35 : 35} ${100 + (i % 2 ? 1 : -1) * (15 + (i % 5) * 7) * size} ${210 - (60 + (i % 9) * 13) * size})`}
          fill="var(--tree-progress-leaf)"
          stroke="var(--tree-leaf-dark)"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: count(completed, GROWTH_LIMITS.fruit) }, (_, i) => (
        <g key={i} className="church-tree__fruit">
          <circle
            cx={100 + (i % 2 ? 1 : -1) * (18 + (i % 3) * 14) * size}
            cy={210 - (105 + (i % 3) * 24) * size}
            r="7"
            fill="var(--tree-fruit)"
            stroke="var(--tree-fruit-outline)"
            strokeWidth="2"
          />
          <circle
            cx={98 + (i % 2 ? 1 : -1) * (18 + (i % 3) * 14) * size}
            cy={208 - (105 + (i % 3) * 24) * size}
            r="2"
            fill="var(--tree-fruit-light)"
          />
        </g>
      ))}
    </svg>
  );
}
