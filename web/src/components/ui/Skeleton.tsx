export default function Skeleton({ className = "h-6 w-full" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-black/10 ${className}`} />;
}


