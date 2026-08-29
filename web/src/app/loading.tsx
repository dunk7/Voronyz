import LogoLoader from "@/components/ui/LogoLoader";

/** Full-screen black splash while the route segment loads (cold open / navigation). */
export default function Loading() {
  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-black"
      style={{ background: "#000000" }}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <LogoLoader size="lg" tone="light" />
    </div>
  );
}
