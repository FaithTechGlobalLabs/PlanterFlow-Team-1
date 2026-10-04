import { useId } from "react";
import type { TreeStage } from "@/lib/tree-stage";

/** Botanical artwork only. Size never encodes performance or spiritual worth. */
export function ChurchTree({
  completed = 0,
  variant = 0,
  stage,
}: {
  completed?: number;
  variant?: number;
  stage?: TreeStage;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 200 230" aria-hidden="true" className="garden-tree">
      <defs>
        <radialGradient id={`${id}-leaf`} cx="30%" cy="22%" r="80%">
          <stop stopColor={variant % 2 ? "#b7c796" : "#c5d7a3"} />
          <stop offset=".5" stopColor="#658657" />
          <stop offset="1" stopColor="#304f3e" />
        </radialGradient>
        <linearGradient id={`${id}-bark`}>
          <stop stopColor="#9b8865" />
          <stop offset=".5" stopColor="#64573e" />
          <stop offset="1" stopColor="#b0a078" />
        </linearGradient>
      </defs>
      <g
        transform={
          stage === "seed"
            ? "translate(55 116) scale(.45)"
            : stage === "sprout"
              ? "translate(42 94) scale(.6)"
              : stage === "sapling"
                ? "translate(21 44) scale(.8)"
                : stage === "young"
                  ? "translate(8 17) scale(.92)"
                  : undefined
        }
      >
        <ellipse
          cx="105"
          cy="211"
          rx="65"
          ry="12"
          fill="#36573b"
          opacity=".12"
        />
        <path
          d="M58 214 Q99 206 102 184 Q108 207 148 214 Q122 213 106 208 L90 213Z"
          fill="#857b56"
          opacity=".55"
        />
        <path
          d="M95 212 Q103 177 97 130 L68 94 L74 90 L103 119 L125 86 L132 89 L107 138 Q105 180 114 211Z"
          fill={`url(#${id}-bark)`}
        />
        <g className="garden-canopy">
          <path
            d="M30 105 Q17 81 34 68 Q29 46 51 40 Q55 20 77 26 Q91 9 111 24 Q139 14 147 40 Q170 42 164 67 Q188 79 169 103 Q168 129 145 132 Q121 153 103 137 Q77 154 60 136 Q36 141 30 119Z"
            fill={`url(#${id}-leaf)`}
          />
          {Array.from({ length: 225 }, (_, i) => {
            const x = 29 + ((i * 47 + i * i * 7) % 140);
            const y = 24 + ((i * 31 + i * i * 3) % 116);
            if (((x - 100) / 73) ** 2 + ((y - 79) / 64) ** 2 > 1) return null;
            const colors = [
              "#597d4f",
              "#86a367",
              "#a3b97b",
              "#3e6245",
              "#6b9057",
              "#bccb92",
            ];
            return (
              <ellipse
                key={i}
                cx={x}
                cy={y}
                rx={5 + (i % 7)}
                ry={3 + (i % 4)}
                transform={`rotate(${i * 37} ${x} ${y})`}
                fill={colors[i % colors.length]}
                opacity={0.5 + (i % 4) * 0.1}
              />
            );
          })}
          <path
            d="M100 134 Q98 107 86 94 M103 128 Q124 112 133 97 M96 116 Q74 104 67 90"
            stroke="#6c7950"
            strokeWidth="2"
            fill="none"
            opacity=".5"
          />
        </g>
        <path
          d="M104 157 L78 131 M105 147 L129 123"
          fill="none"
          stroke="#6a6445"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {Array.from({ length: Math.min(5, completed) }, (_, i) => (
          <g key={i} className="garden-fruit">
            <circle
              cx={66 + ((i * 27) % 78)}
              cy={82 + ((i * 17) % 38)}
              r="5"
              fill="#d7ab60"
            />
            <circle
              cx={64 + ((i * 27) % 78)}
              cy={80 + ((i * 17) % 38)}
              r="1.5"
              fill="#f5e2b1"
            />
          </g>
        ))}
        <path
          d="M58 214 Q49 200 46 211 M149 212 Q157 195 163 205 M140 217 Q150 209 160 217"
          stroke="#789464"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
