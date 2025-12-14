import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="bg-texture-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-neutral-50 to-neutral-100">
        <div className="absolute inset-0 bg-[url('/hero-bg.png')] bg-cover bg-center opacity-5" />
        <div className="relative container py-24 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed">
            Ready to step into the future of footwear? We&apos;d love to hear from you.
            Whether you&apos;re interested in our products, partnership opportunities, or joining our team.
          </p>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="container py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form Section */}
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Send us a message</h2>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">First name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-neutral-500 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-neutral-900"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Last name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 border border-neutral-500 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-neutral-900"
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-neutral-500 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-neutral-900"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Subject</label>
                <select className="w-full px-4 py-3 border border-neutral-500 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-neutral-900">
                  <option>General Inquiry</option>
                  <option>Product Questions</option>
                  <option>Partnership Opportunities</option>
                  <option>Media Inquiry</option>
                  <option>Career Opportunity</option>
                  <option>Technical Support</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Message</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 border border-neutral-500 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none text-neutral-900"
                  placeholder="Tell us what's on your mind..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-3 px-6 rounded-lg hover:bg-neutral-800 transition-colors font-medium"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info & Social */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-6">Contact Information</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm">📧</span>
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">Email</div>
                    <a href="mailto:maximus.chapman.23@gmail.com" className="text-neutral-600 hover:text-black transition-colors">
                      maximus.chapman.23@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-neutral-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm">📞</span>
                  </div>
                  <div>
                    <div className="font-medium text-neutral-900">Phone</div>
                    <a href="tel:+12066788381" className="text-neutral-600 hover:text-black transition-colors">
                      206 678 8381
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h3 className="text-xl font-bold text-neutral-900 mb-4">Follow Us</h3>
              <p className="text-neutral-600 mb-6">
                Stay updated with our latest innovations, behind-the-scenes content, and footwear insights.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <SocialCard
                  platform="Instagram"
                  handle="@voronyz"
                  url="https://instagram.com/voronyz"
                  icon={
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  }
                  description="Daily updates on our 3D printing process and custom footwear designs"
                />
                <SocialCard
                  platform="X (Twitter)"
                  handle="@voronyz"
                  url="https://x.com/voronyz"
                  icon={
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  }
                  description="Industry insights, tech updates, and real-time company news"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-neutral-50 py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Quick answers to common questions about our products and services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <FAQItem
              question="How long does custom production take?"
              answer="Most orders are printed within under 7 business days before shipping worldwide."
            />
            <FAQItem
              question="Do you offer size exchanges?"
              answer="Custom products are made to order and exchanges are not available. Please use our size guide for the best fit."
            />
            <FAQItem
              question="Are your shoes waterproof?"
              answer="They're water-resistant and easy to clean. Avoid extended high-heat exposure."
            />
            <FAQItem
              question="Do you ship internationally?"
              answer="Absolutely! We ship worldwide with calculated taxes at checkout."
            />
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-black text-white py-16">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-neutral-300 mb-6 max-w-xl mx-auto">
            Join thousands of satisfied customers who&apos;ve discovered the perfect fit for their feet.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full hover:bg-neutral-100 transition-colors font-medium"
          >
            Shop Our Products
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function SocialCard({ platform, handle, url, icon, description }: {
  platform: string;
  handle: string;
  url: string;
  icon: React.ReactNode;
  description: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-white rounded-lg border border-neutral-200 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className="text-neutral-900">{icon}</div>
        <div>
          <div className="font-medium text-neutral-900">{platform}</div>
          <div className="text-sm text-neutral-600">{handle}</div>
        </div>
      </div>
      <p className="text-sm text-neutral-600">{description}</p>
    </a>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white p-6 rounded-lg border border-neutral-200">
      <h3 className="font-medium text-neutral-900 mb-2">{question}</h3>
      <p className="text-sm text-neutral-600">{answer}</p>
    </div>
  );
}
