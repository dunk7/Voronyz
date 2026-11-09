import TakeTheQuizPromo from "@/components/apparel/TakeTheQuizPromo";
import AboutStory from "@/components/about/AboutStory";

export default function AboutPage() {
  return (
    <div className="bg-texture-white">
      <div className="container py-20 space-y-16">
        <div className="text-center max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500 mb-6">Voronyz Engineering</p>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-8">About Us</h1>
        </div>

        <AboutStory priority />

        <TakeTheQuizPromo />
      </div>
    </div>
  );
}


