import type { HTMLAttributes } from "react";

export enum IconName {
  Home = "home",
  Leaf = "leaf",
  Heart = "heart",
  Prayer = "prayer",
  Objective = "objective",
  Journey = "journey",
  Chat = "chat",
  Arrow = "arrow",
  Plus = "plus",
  Check = "check",
  Globe = "globe",
  Close = "close",
}

export type IconNameType = `${IconName}` | IconName;

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  name: IconNameType;
  size?: number;
  className?: string;
}

export function Icon({ name, size = 20, className = "", style, ...props }: IconProps) {
  return (
    <span
      className={`ff-icon inline-block shrink-0 align-middle ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "currentColor",
        maskImage: `url(/icons/${name}.svg)`,
        WebkitMaskImage: `url(/icons/${name}.svg)`,
        maskRepeat: "no-repeat",
        WebkitMaskRepeat: "no-repeat",
        maskPosition: "center",
        WebkitMaskPosition: "center",
        maskSize: "contain",
        WebkitMaskSize: "contain",
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}
