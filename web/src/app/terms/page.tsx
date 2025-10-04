export default function TermsPage() {
  return (
    <div className="bg-white">
      <div className="container py-12 space-y-8">
        {/* Header */}
        <div>
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500">Voronyz Engineering</p>
          <h1 className="text-3xl font-bold mt-2 text-neutral-900">Terms of Service</h1>
          <p className="text-sm text-neutral-500 mt-1">Last updated: September 21, 2025</p>
        </div>

        {/* Introduction */}
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-700 leading-relaxed">
            Welcome to Voronyz Engineering. These Terms of Service (&quot;Terms&quot;) govern your use of our website,
            products, and services. By accessing or using our services, you agree to be bound by these Terms.
            If you do not agree to these Terms, please do not use our services.
          </p>
        </div>

        {/* Acceptance of Terms */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Acceptance of Terms</h2>
          <p className="text-neutral-700">
            By accessing and using Voronyz Engineering&apos;s website, purchasing our products, or engaging with our services,
            you accept and agree to be bound by the terms and provision of this agreement. These Terms apply to all
            visitors, users, and others who access or use our services.
          </p>
        </section>

        {/* Description of Service */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Description of Service</h2>
          <p className="text-neutral-700 mb-4">
            Voronyz Engineering provides:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Custom Footwear</h3>
              <p className="text-neutral-700 text-sm">
                Precision 3D-printed footwear using advanced TPU lattice midsoles and modern uppers,
                customized to your exact foot measurements.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Online Platform</h3>
              <p className="text-neutral-700 text-sm">
                Website and digital tools for product browsing, customization, ordering, and account management.
              </p>
            </div>
          </div>
        </section>

        {/* User Accounts */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">User Accounts</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Account Creation</h3>
              <p className="text-neutral-700">
                To access certain features, you may need to create an account. You are responsible for maintaining
                the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Account Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1 text-neutral-700 ml-4">
                <li>Provide accurate and complete information</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized use</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Orders and Payment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Orders and Payment</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Product Orders</h3>
              <p className="text-neutral-700">
                All orders are subject to acceptance and availability. We reserve the right to refuse or cancel
                any order for any reason, including but not limited to product availability, errors in product
                information, or payment issues.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Pricing and Payment</h3>
              <ul className="list-disc list-inside space-y-1 text-neutral-700 ml-4">
                <li>All prices are in USD unless otherwise specified</li>
                <li>Payment is due at the time of order placement</li>
                <li>We accept major credit cards and other payment methods as displayed</li>
                <li>Taxes and shipping charges will be added to your order total</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Custom Products</h3>
              <p className="text-neutral-700">
                Custom footwear orders are final and non-refundable once production begins. Please ensure all
                measurements and specifications are accurate before placing your order.
              </p>
            </div>
          </div>
        </section>

        {/* Shipping and Delivery */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Shipping and Delivery</h2>
          <div className="space-y-4">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Production Timeline</h3>
              <p className="text-blue-800">
                Most custom orders take under 7 business days for production before shipping. Standard shipping
                typically takes 3-5 business days within the US, with international shipping taking 7-14 days.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Shipping Policy</h3>
              <ul className="list-disc list-inside space-y-1 text-neutral-700 ml-4">
                <li>Shipping costs are calculated at checkout</li>
                <li>We ship worldwide with applicable customs fees</li>
                <li>Risk of loss passes to buyer upon delivery to carrier</li>
                <li>We are not responsible for delays caused by carriers</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Returns and Refunds */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Returns and Refunds</h2>
          <div className="space-y-4">
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-medium text-green-900 mb-3">Size Exchanges</h3>
              <p className="text-green-800">
                Custom products are made to order and exchanges are not available. Please consult our size guide before purchasing to ensure the perfect fit.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Refund Policy</h3>
              <ul className="list-disc list-inside space-y-1 text-neutral-700 ml-4">
                <li>Custom products are not eligible for refunds once production begins</li>
                <li>Standard products may be refunded within 30 days if defective</li>
                <li>Refunds are processed within 5-7 business days of approval</li>
                <li>Original shipping costs are not refunded</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Intellectual Property</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Our Intellectual Property</h3>
              <p className="text-neutral-700 mb-3">
                The Voronyz Engineering website and services contain material which is owned by or licensed to us.
                This material includes, but is not limited to, the design, layout, look, appearance, and graphics.
                You may not reproduce, distribute, display, or create derivative works of our intellectual property
                without our prior written consent.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">User-Generated Content</h3>
              <p className="text-neutral-700">
                By submitting content to our website or services, you grant us a non-exclusive, royalty-free,
                perpetual, and worldwide license to use, reproduce, modify, and distribute such content in
                connection with our business.
              </p>
            </div>
          </div>
        </section>

        {/* Prohibited Uses */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Prohibited Uses</h2>
          <p className="text-neutral-700 mb-4">You may not use our services:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-medium text-red-900 mb-3">Illegal Activities</h3>
              <ul className="space-y-1 text-red-800 text-sm">
                <li>• For any unlawful purpose</li>
                <li>• To violate any law or regulation</li>
                <li>• To infringe intellectual property rights</li>
                <li>• To distribute malware or harmful code</li>
              </ul>
            </div>

            <div className="bg-red-50 p-6 rounded-lg border border-red-200">
              <h3 className="text-lg font-medium text-red-900 mb-3">Disruptive Behavior</h3>
              <ul className="space-y-1 text-red-800 text-sm">
                <li>• To interfere with our services</li>
                <li>• To attempt unauthorized access</li>
                <li>• To spam or harass other users</li>
                <li>• To submit false information</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Disclaimer of Warranties */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Disclaimer of Warranties</h2>
          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <p className="text-yellow-800">
              Our services and products are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
              either express or implied, including but not limited to implied warranties of merchantability,
              fitness for a particular purpose, and non-infringement. We do not warrant that our services will
              be uninterrupted, error-free, or secure.
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Limitation of Liability</h2>
          <p className="text-neutral-700 mb-4">
            In no event shall Voronyz Engineering, its directors, employees, or agents be liable for any indirect,
            incidental, special, consequential, or punitive damages, including without limitation, loss of profits,
            data, use, goodwill, or other intangible losses, resulting from:
          </p>

          <div className="space-y-2 text-neutral-700 ml-4">
            <div>• Your use of or inability to use our services</div>
            <div>• Any unauthorized access to or use of our servers</div>
            <div>• Any interruption or cessation of transmission to or from our services</div>
            <div>• Any bugs, viruses, trojan horses, or the like</div>
            <div>• Any errors or omissions in any content</div>
          </div>
        </section>

        {/* Indemnification */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Indemnification</h2>
          <p className="text-neutral-700">
            You agree to defend, indemnify, and hold harmless Voronyz Engineering and its licensee and licensors,
            and their employees, contractors, agents, officers and directors, from and against any and all claims,
            damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to
            attorney&apos;s fees), resulting from or arising out of your use and access of our services, your violation
            of any term of these Terms, or your violation of any third-party right.
          </p>
        </section>

        {/* Termination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Termination</h2>
          <p className="text-neutral-700">
            We may terminate or suspend your account and bar access to our services immediately, without prior
            notice or liability, under our sole discretion, for any reason whatsoever and without limitation,
            including but not limited to a breach of the Terms. Upon termination, your right to use our services
            will cease immediately.
          </p>
        </section>

        {/* Governing Law */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Governing Law</h2>
          <p className="text-neutral-700">
            These Terms shall be interpreted and governed by the laws of the State of Texas, United States,
            without regard to its conflict of law provisions. Our failure to enforce any right or provision of
            these Terms will not be considered a waiver of those rights.
          </p>
        </section>

        {/* Changes to Terms */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Changes to Terms</h2>
          <p className="text-neutral-700">
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a
            revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
            What constitutes a material change will be determined at our sole discretion.
          </p>
        </section>

        {/* Severability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Severability</h2>
          <p className="text-neutral-700">
            If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining
            provisions of these Terms will remain in effect. These Terms constitute the entire agreement between
            us regarding our services, and supersede and replace any prior agreements.
          </p>
        </section>

        {/* Contact Information */}
        <section className="bg-neutral-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
          <p className="text-neutral-700 mb-4">
            If you have any questions about these Terms of Service, please contact us:
          </p>
          <div className="space-y-2 text-neutral-700">
            <p><strong>Email:</strong> <a href="mailto:maximus.chapman.23@gmail.com" className="text-black hover:underline">maximus.chapman.23@gmail.com</a></p>
            <p><strong>Phone:</strong> <a href="tel:+12066788381" className="text-black hover:underline">206 678 8381</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}

