import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed bg-white/50 h-dvh flex flex-col items-center justify-center gap-4 z-60 w-full">
      <div className="flex flex-col gap-1 items-center justify-center">
        <Image
          src="/dmw_logo.png"
          alt="DMW Logo"
          width={100}
          height={100}
          className="animate-pulse"
        />
      </div>
      <p className="text-blue-500 font-semibold">LOADING...</p>
    </div>
  );
}
