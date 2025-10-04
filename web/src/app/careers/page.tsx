import Link from "next/link";

export default function CareersPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center opacity-5" />
        <div className="relative container py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            Join the Future of<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-600 to-neutral-800">Footwear Innovation</span>
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            We&apos;re pioneering the next generation of custom footwear through cutting-edge 3D printing technology.
            Help us revolutionize how the world thinks about comfort, performance, and sustainability.
          </p>
        </div>
      </div>


      {/* Open Positions */}
      <div className="bg-neutral-50 py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Open Positions</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              We&apos;re always looking for talented individuals who share our passion for innovation and design.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JobCard
              title="Senior 3D Printing Engineer"
              department="Engineering"
              location="Dallas, Texas"
              type="Full-time"
              description="Lead the development of our 3D printing processes and optimize material formulations for footwear applications."
            />
            <JobCard
              title="Product Designer"
              department="Design"
              location="Dallas, Texas"
              type="Full-time"
              description="Design the next generation of custom footwear, working at the intersection of fashion, technology, and biomechanics."
            />
            <JobCard
              title="Marketing Engineer"
              department="Marketing"
              location="Dallas, Texas"
              type="Full-time"
              description="Build the platform that powers our custom footwear scanning, design, and manufacturing pipeline."
            />
            <JobCard
              title="Operations Manager"
              department="Operations"
              location="Dallas, Texas"
              type="Full-time"
              description="Scale our manufacturing operations while maintaining our commitment to quality and sustainability."
            />
          </div>

          <div className="text-center mt-12">
            <p className="text-neutral-600 mb-4">
              Don&apos;t see your role? We&apos;re always interested in meeting talented people.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-full hover:bg-neutral-800 transition-colors"
            >
              Get In Touch
              <span className="text-sm">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Culture Section */}
      <div className="container py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Our Culture</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            We believe in fostering a collaborative environment where creativity thrives and innovation is celebrated.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-12">
          <div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Work-Life Balance</h3>
            <p className="text-neutral-600 leading-relaxed mb-6">
              We understand that great work comes from happy, well-rested people. That&apos;s why we offer flexible hours
              and the ability to work from anywhere in the world.
            </p>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neutral-400 rounded-full"></span>
                Flexible remote work options
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neutral-400 rounded-full"></span>
                Health and wellness benefits
              </li>
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-12 mt-20">
          <div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-4">Continuous Learning</h3>
            <p className="text-neutral-600 leading-relaxed mb-6">
              Technology moves fast, and so do we. We provide ongoing training, conference attendance,
              and resources to keep our team at the forefront of 3D printing and footwear innovation.
            </p>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neutral-400 rounded-full"></span>
                Professional development budget
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neutral-400 rounded-full"></span>
                Conference and workshop attendance
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neutral-400 rounded-full"></span>
                Access to latest tools and software
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black text-white py-20">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make an Impact?</h2>
          <p className="text-neutral-300 mb-8 max-w-2xl mx-auto">
            Join us in shaping the future of footwear. We&apos;re looking for passionate individuals
            who want to push boundaries and create something extraordinary.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-full hover:bg-neutral-100 transition-colors font-medium"
            >
              Apply Now
              <span>→</span>
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 text-white rounded-full hover:bg-white/10 transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


function JobCard({ title, department, location, type, description }: {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-neutral-200 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-neutral-900 mb-1">{title}</h3>
          <p className="text-neutral-600">{department}</p>
        </div>
        <span className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm font-medium">
          {type}
        </span>
      </div>
      <p className="text-neutral-600 mb-4 leading-relaxed">{description}</p>
      <div className="flex items-center justify-between">
        <span className="text-sm text-neutral-500">{location}</span>
        <Link
          href="/contact"
          className="text-sm font-medium text-black hover:text-neutral-600 transition-colors"
        >
          Apply →
        </Link>
      </div>
    </div>
  );
}
