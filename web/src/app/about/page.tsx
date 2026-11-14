import TakeTheQuizPromo from "@/components/apparel/TakeTheQuizPromo";
import AboutStory from "@/components/about/AboutStory";

export default function AboutPage() {
  return (
    <div className="bg-texture-white">
      <div className="container py-20 space-y-16">
        <div className="text-center max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500 mb-6">Voronyz Engineering</p>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">About Us</h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            How founder Max Chapman started Voronyz — and why we build footwear the way we do.
          </p>
        </div>

        <AboutStory priority />

        <TakeTheQuizPromo />
      </div>
    </div>
  );
}


