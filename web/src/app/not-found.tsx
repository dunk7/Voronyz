import Link from "next/link";

export default function NotFound() {
  return (
    <div className="bg-white">
      <div className="container py-24 text-center">
        <div className="text-7xl font-semibold">404</div>
        <p className="mt-3 text-neutral-700">This page could not be found.</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-black text-white px-6 py-3 text-sm font-medium hover:bg-neutral-800">Go home</Link>
      </div>
    </div>
  );
}


