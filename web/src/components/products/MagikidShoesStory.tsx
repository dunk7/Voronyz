import Image from "next/image";
import { MAGIKID_PROGRAM_PHOTOS } from "@/lib/magikidShoesThumbnail";

export default function MagikidShoesStory() {
  return (
    <div className="mt-10 overflow-hidden rounded-3xl ring-1 ring-black/5 bg-white">
      <div className="bg-black text-white px-6 py-4 text-sm font-medium">
        Magikid Robotics Lab
      </div>
      <div className="px-6 py-6 space-y-5 text-neutral-700 leading-relaxed">
        <p>
          We only run this with{" "}
          <a
            href="https://magikidlab.com/"
            className="underline hover:no-underline font-medium text-neutral-900"
            target="_blank"
            rel="noreferrer"
          >
            Magikid Robotics Lab
          </a>
          . Magikid teaches kids robotics, coding, and making. Together we added
          footwear design camps — how to 3D-model a shoe, how the print process
          works, and how to turn a sketch into a pair they can actually wear.
        </p>
        <p>
          Students do not pick a stock Voronyz slip-on and check out. They start
          from our base model and design their own holes, cutouts, and graphics
          in class. That file is what we print. If a family uses this page, it
          is to complete the student&apos;s pair (name at checkout, Magikid Lab
          pickup or ship) — not to buy a public colorway off the shelf.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {MAGIKID_PROGRAM_PHOTOS.map((photo) => (
            <figure key={photo.src} className="space-y-2">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5">
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
              </div>
              <figcaption className="text-xs text-neutral-500 leading-snug">
                {photo.caption}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="text-xs text-neutral-500">
          Photos from Magikid Robotics Lab —{" "}
          <a
            href="https://magikidlab.com/"
            className="underline hover:no-underline"
            target="_blank"
            rel="noreferrer"
          >
            magikidlab.com
          </a>
          .
        </p>
      </div>
    </div>
  );
}
