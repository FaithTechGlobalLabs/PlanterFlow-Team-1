import Image from "next/image";

export function Brand() {
  return <span className="brand-lockup"><Image src="/brand/first-fruits-mark.svg" loading="eager" width={34} height={34} alt="" /><span>first fruits</span></span>;
}
