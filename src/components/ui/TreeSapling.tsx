import { CSSProperties } from "react";

interface TreeSaplingProps {
  className?: string;
  style?: CSSProperties;
}

export function TreeSapling({ className = "", style }: TreeSaplingProps) {
  return (
    <img
      src="/globe/tree-sapling.svg"
      alt=""
      width={38}
      height={43}
      className={className}
      style={style}
    />
  );
}
