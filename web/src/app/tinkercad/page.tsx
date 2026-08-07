const TINKERCAD_URL = "https://voronyz.com/tinkercad/v4.stl";
const CDN_URL =
  "https://cdn.jsdelivr.net/gh/dunk7/Voronyz@main/web/public/downloads/v4/v4.04t.stl";

export const metadata = {
  title: "Tinkercad — Voronyz V4 STL",
  description: "Direct links to import the Voronyz V4 top STL in Tinkercad.",
};

export default function TinkercadDownloadPage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 bg-texture-white min-h-[70vh]">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Tinkercad import</h1>
      <p className="mt-3 text-neutral-600">
        In Tinkercad choose <strong>Import</strong> → <strong>URL</strong>, then paste the
        link below. The path must end in <code className="rounded bg-neutral-100 px-1">.stl</code>{" "}
        or Tinkercad shows &quot;not a supported file type&quot;.
      </p>
      <ul className="mt-8 space-y-6 text-sm">
        <li>
          <p className="font-medium text-neutral-800">Voronyz (for Tinkercad URL import)</p>
          <code className="mt-1 block break-all rounded bg-neutral-100 px-2 py-2 text-neutral-900">
            {TINKERCAD_URL}
          </code>
        </li>
        <li>
          <p className="font-medium text-neutral-800">CDN mirror (backup)</p>
          <code className="mt-1 block break-all rounded bg-neutral-100 px-2 py-2 text-neutral-900">
            {CDN_URL}
          </code>
        </li>
      </ul>
      <p className="mt-8 text-sm text-neutral-500">
        You can also use <strong>Choose a local file</strong> after downloading the STL from
        either link in your browser.
      </p>
    </main>
  );
}
