export default function AboutPage() {
  return (
    <div className="bg-white">
      <div className="container py-20 space-y-12">
        <div className="text-center max-w-4xl mx-auto">
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500 mb-6">Voronyz Engineering</p>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-8">About Us</h1>
          
          <div className="prose prose-lg text-neutral-700 max-w-3xl mx-auto leading-relaxed">
            <p>Hey, I'm Max, and I've been diving deep into 3D printed footwear for the past two years. It's been an incredible journey experimenting with materials, designs, and manufacturing techniques to create something truly innovative.</p>
            
            <p>Now, my brother Alex and I are thrilled to launch our first product: the V3 slides. We poured everything we've learned into these, and we hope you'll love them as much as we do. But this is just the beginning. Get ready for our upcoming footwear line, featuring custom fits derived from 3D scans of your feet for that perfect, personalized comfort.</p>
            
            <p>We aim to revolutionize the footwear industry through decentralized manufacturing, full recyclability, and shoes that adapt to every individual's unique foot shape. We're committed to sustainability and precision, redefining what footwear can be.</p>
            
            <p>Join us on this exciting adventure! Follow our progress on <a href="https://instagram.com/voronyz" target="_blank" rel="noopener noreferrer" className="text-black hover:underline font-medium">Instagram @voronyz</a> to stay updated on new designs, behind-the-scenes insights, and more.</p>
          </div>
        </div>

        {/* Optional: Add a section for team or mission if needed, but keeping it simple for now */}
      </div>
    </div>
  );
}


