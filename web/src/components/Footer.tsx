import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="container py-10 grid gap-8 md:grid-cols-3 text-sm text-neutral-600">
        <div className="space-y-3">
          <div className="text-black font-semibold">Voronyz</div>
          <p>Nothing compares to Voronyz—built for unmatched comfort, durability, and fit.</p>
        </div>
        <div className="grid gap-2">
          <div className="text-neutral-900 font-medium">Company</div>
          <Link className="hover:text-black" href="/about">About</Link>
          <Link className="hover:text-black" href="/careers">Careers</Link>
          <Link className="hover:text-black" href="/contact">Contact</Link>
        </div>
        <div className="grid gap-2">
          <div className="text-neutral-900 font-medium">Legal</div>
          <Link className="hover:text-black" href="/terms">Terms</Link>
          <Link className="hover:text-black" href="/privacy">Privacy</Link>
        </div>
      </div>
      <div className="border-t border-black/5 py-4 text-center text-xs text-neutral-500 bg-texture-white">© {new Date().getFullYear()} Voronyz. All rights reserved.</div>
    </footer>
  );
}


