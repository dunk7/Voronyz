import type { Metadata } from "next";
import UploadsClient from "./UploadsClient";

export const metadata: Metadata = {
  title: "Upload a file | Voronyz",
  description:
    "Send us your model or scan file with your name and optional customization notes for custom Voronyz footwear.",
};

export default function UploadsPage() {
  return (
    <div className="bg-texture-white">
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="relative container py-16 text-center md:py-20">
          <h1 className="mb-4 text-4xl font-bold text-neutral-900 md:text-5xl">
            Upload a file
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-neutral-600">
            Share a scan or model (STL, OBJ, or any format) for custom Voronyz footwear. Add your
            name, optional email, and any customization notes—we&apos;ll review your file and follow
            up if needed.
          </p>
        </div>
      </div>

      <div className="container py-12 md:py-16">
        <div className="mx-auto max-w-xl">
          <UploadsClient />
        </div>
      </div>
    </div>
  );
}
