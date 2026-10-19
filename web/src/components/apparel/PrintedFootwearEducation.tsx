type PrintedFootwearEducationProps = {
  className?: string;
};

const TOPICS = [
  {
    title: "TPU-90A",
    body: "Voronyz prints footwear in a proprietary TPU blend from the same material family as TPU-90A: a soft, flexible thermoplastic polyurethane at 90 Shore A. That is the filament Voronyz sells for makers — 1.75 mm, 1 kg spools, print temperature 220°C, no heated bed — chosen because it stays soft, durable, and able to bend without breaking.",
  },
  {
    title: "Lattice construction",
    body: "The cushion comes from an open TPU lattice, FDM-printed as part of the shoe. V3 Slides use lattice lowers with breathable uppers. The Dragonfly's use a custom lattice sole, a breathable upper, and interchangeable laces. Slip Ons are printed in one piece per colorway with a flexible lattice sole. Lattice Insoles put the same springy structure into everyday sneakers or Voronyz footwear.",
  },
  {
    title: "Printed to order",
    body: "Each pair is 3D-printed to order. A V3 pair takes about a full day on the printer, then heat-treated post-processing for quality, comfort, and durability. Most other footwear prints in about 1–2 days and ships the next business day. Custom orders are typically printed within under seven business days. You can also send a scan or model (STL, OBJ, or similar) for custom Voronyz footwear.",
  },
  {
    title: "Fit, care, and manufacturing",
    body: "Voronyz Engineering has spent two years on 3D-printed footwear, with a focus on decentralized manufacturing, full recyclability, and shoes that adapt to an individual's foot shape. Lattice soles and uppers are fully washable on a gentle cycle. Orders currently ship within the United States only, with free domestic shipping.",
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
        How it&apos;s made
      </p>
      <h2
        id="printed-footwear-education-heading"
        className="mt-2 text-xl sm:text-2xl font-semibold tracking-tight text-neutral-900 text-center"
      >
        3D-printed footwear at Voronyz
      </h2>
      <p className="mt-3 mx-auto max-w-2xl text-sm leading-6 text-neutral-600 text-center">
        Voronyz Engineering prints footwear on FDM machines with TPU lattices and
        performance uppers — including the V3 Slides. Pairs are built to order,
        then finished for comfort, durability, and everyday fit.
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
