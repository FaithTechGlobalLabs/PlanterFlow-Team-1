import Image from "next/image";

export function SendNetworkLogo({
  className = "h-5 w-auto",
}: {
  className?: string;
}) {
  return (
    <Image
      src="/brand/send-network-logo.png"
      alt="Send Network Logo"
      width={138}
      height={24}
      className={`object-contain ${className}`}
      priority
    />
  );
}
