import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="bg-texture-white">
      <div className="container py-20 space-y-16">
        <div className="text-center max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500 mb-6">Voronyz Engineering</p>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-8">About Us</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center max-w-6xl mx-auto">
          <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl ring-1 ring-neutral-200 shadow-lg">
            <Image
              src="/349.png"
              alt="Voronyz — behind the scenes"
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="prose prose-lg text-neutral-700 leading-relaxed space-y-5">
            <p>We&apos;ve been diving deep into 3D printed footwear for the past two years. It&apos;s been an incredible journey experimenting with materials, designs, and manufacturing techniques to create something truly innovative.</p>

            <p>We aim to revolutionize the footwear industry through decentralized manufacturing, full recyclability, and shoes that adapt to every individual&apos;s unique foot shape. We&apos;re committed to sustainability and precision, redefining what footwear can be.</p>

            <p>Join us on this exciting adventure! Follow our progress on <a href="https://instagram.com/voronyz" target="_blank" rel="noopener noreferrer" className="text-black hover:underline font-medium">Instagram @voronyz</a> to stay updated on new designs, behind-the-scenes insights, and more.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


