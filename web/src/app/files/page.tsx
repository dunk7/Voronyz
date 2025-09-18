import Link from "next/link";

export default function FilesPage() {
  const downloads = [
    { name: "V3 Slides STL", href: "/assets/v3/voronyz_v3.stl", size: "~12MB" },
  ];
  return (
    <div className="bg-white">
      <div className="container py-12 space-y-6">
        <div>
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500">Voronyz Engineering</p>
          <h1 className="text-2xl font-semibold mt-2">Files</h1>
        </div>
        <div className="grid gap-3">
          {downloads.map((d) => (
            <Link key={d.href} href={d.href} className="rounded-xl ring-1 ring-black/10 p-4 hover:bg-black/5 transition flex items-center justify-between">
              <span className="text-sm">{d.name}</span>
              <span className="text-xs text-neutral-600">{d.size}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}


