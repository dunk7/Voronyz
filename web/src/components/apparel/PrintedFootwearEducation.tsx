type PrintedFootwearEducationProps = {
  className?: string;
};

const TOPICS = [
  {
    title: "Foamed TPU",
    body: "The cushion isn't a slab of foam glued in later. We print with foamed TPU — a material that holds air in the structure itself — so the shoe stays light, springy, and comfortable from the first wear. Soft where you want it. Solid where you need it.",
  },
  {
    title: "A sole that actually moves",
    body: "That give underfoot comes from a lattice we designed for walking, not for a lab notebook. It's in the V3 Slides, the Dragonfly's, the Slip Ons, and our Lattice Insoles. You feel it the moment you put them on: rebound, flex, and a shoe that doesn't fight your foot.",
  },
  {
    title: "Finished like footwear",
    body: "A print isn't a pair of shoes until it's been finished. Every Voronyz pair is taken through the process we've spent years getting right — cleaned up, treated, and checked so it looks and feels like something you wear out, not a prototype on a shelf.",
  },
  {
    title: "Years to this point",
    body: "We've spent years perfecting the materials, the fit, and the way these shoes hold up — to get to this. Lattice soles and uppers wash on a gentle cycle. We ship free across the United States.",
  },
] as const;

export default function PrintedFootwearEducation({
  className = "",
}: PrintedFootwearEducationProps) {
  return (
    <section
      aria-labelledby="printed-footwear-education-heading"
      className={`rounded-2xl bg-white ring-1 ring-black/5 px-6 py-8 sm:px-10 sm:py-10 ${className}`}
    >
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 text-center">
        Why it feels different
      </p>
      <h2
        id="printed-footwear-education-heading"
        className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 text-center"
      >
        Footwear, done properly
      </h2>
      <p className="mt-3 mx-auto max-w-2xl text-sm leading-6 text-neutral-600 text-center">
        Voronyz builds shoes people actually wear — light, cushioned, and
        finished with the care of a company that has spent years getting every
        step of this right.
      </p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
        {TOPICS.map((topic) => (
          <article key={topic.title} className="text-left">
            <h3 className="text-sm font-medium text-neutral-900">{topic.title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{topic.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
