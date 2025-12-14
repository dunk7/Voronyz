export default function PrivacyPage() {
  return (
    <div className="bg-texture-white">
      <div className="container py-12 space-y-8">
        {/* Header */}
        <div>
          <p className="uppercase tracking-[0.25em] text-xs text-neutral-500">Voronyz Engineering</p>
          <h1 className="text-3xl font-bold mt-2 text-neutral-900">Privacy Policy</h1>
          <p className="text-sm text-neutral-500 mt-1">Last updated: September 21, 2025</p>
        </div>

        {/* Introduction */}
        <div className="prose prose-neutral max-w-none">
          <p className="text-neutral-700 leading-relaxed">
            At Voronyz Engineering, we are committed to protecting your privacy and personal information.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you visit our website, purchase our products, or interact with our services.
          </p>
        </div>

        {/* Information We Collect */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Information We Collect</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Personal Information</h3>
              <p className="text-neutral-700 mb-3">We collect personal information that you provide to us, including:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-700 ml-4">
                <li>Name, email address, and contact information</li>
                <li>Billing and shipping addresses</li>
                <li>Payment information (processed securely through third-party providers)</li>
                <li>Account credentials and preferences</li>
                <li>Foot measurements and custom specifications for product customization</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Technical Information</h3>
              <p className="text-neutral-700 mb-3">We automatically collect certain information when you visit our website:</p>
              <ul className="list-disc list-inside space-y-1 text-neutral-700 ml-4">
                <li>IP address and location data</li>
                <li>Browser type, version, and settings</li>
                <li>Device information and screen resolution</li>
                <li>Pages visited and time spent on our site</li>
                <li>Referral sources and click-through data</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Cookies and Tracking Technologies</h3>
              <p className="text-neutral-700">
                We use cookies and similar technologies to enhance your browsing experience, analyze site traffic,
                and personalize content. You can control cookie preferences through your browser settings.
              </p>
            </div>
          </div>
        </section>

        {/* How We Use Your Information */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">How We Use Your Information</h2>
          <p className="text-neutral-700 mb-4">We use the information we collect for the following purposes:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Service Delivery</h3>
              <ul className="space-y-2 text-neutral-700">
                <li>• Process and fulfill orders</li>
                <li>• Create custom footwear products</li>
                <li>• Provide customer support</li>
                <li>• Send order confirmations and updates</li>
              </ul>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Improvement & Analytics</h3>
              <ul className="space-y-2 text-neutral-700">
                <li>• Analyze website performance</li>
                <li>• Improve our products and services</li>
                <li>• Develop new features</li>
                <li>• Monitor security and prevent fraud</li>
              </ul>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Communication</h3>
              <ul className="space-y-2 text-neutral-700">
                <li>• Send marketing communications (with consent)</li>
                <li>• Respond to inquiries and feedback</li>
                <li>• Provide product updates and news</li>
                <li>• Send important account notifications</li>
              </ul>
            </div>

            <div className="bg-neutral-50 p-6 rounded-lg">
              <h3 className="text-lg font-medium text-neutral-900 mb-3">Legal Compliance</h3>
              <ul className="space-y-2 text-neutral-700">
                <li>• Comply with legal obligations</li>
                <li>• Protect our rights and property</li>
                <li>• Prevent fraud and abuse</li>
                <li>• Enforce our terms of service</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Information Sharing */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Information Sharing and Disclosure</h2>
          <p className="text-neutral-700 mb-4">We do not sell, trade, or rent your personal information to third parties. We may share your information in the following circumstances:</p>

          <div className="space-y-4">
            <div className="border-l-4 border-neutral-300 pl-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Service Providers</h3>
              <p className="text-neutral-700">
                We share information with trusted third-party service providers who help us operate our business,
                such as payment processors, shipping companies, and analytics providers. These providers are
                contractually obligated to protect your information.
              </p>
            </div>

            <div className="border-l-4 border-neutral-300 pl-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Legal Requirements</h3>
              <p className="text-neutral-700">
                We may disclose information if required by law, court order, or government request, or to protect
                our rights, property, or safety, or that of our customers or the public.
              </p>
            </div>

            <div className="border-l-4 border-neutral-300 pl-6">
              <h3 className="text-lg font-medium text-neutral-900 mb-2">Business Transfers</h3>
              <p className="text-neutral-700">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as
                part of the transaction. We will notify you before your information is transferred.
              </p>
            </div>
          </div>
        </section>

        {/* Data Security */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Data Security</h2>
          <p className="text-neutral-700 mb-4">
            We implement appropriate technical and organizational security measures to protect your personal
            information against unauthorized access, alteration, disclosure, or destruction. These measures include:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">Encryption</h3>
              <p className="text-sm text-green-800">SSL/TLS encryption for data transmission</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">Access Controls</h3>
              <p className="text-sm text-green-800">Limited access to personal data</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-900 mb-2">Regular Audits</h3>
              <p className="text-sm text-green-800">Security monitoring and testing</p>
            </div>
          </div>
        </section>

        {/* Your Rights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Your Rights and Choices</h2>
          <p className="text-neutral-700 mb-4">You have the following rights regarding your personal information:</p>

          <div className="space-y-4">
            <div className="bg-neutral-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">Access & Portability</h3>
                  <p className="text-sm text-neutral-700">Request a copy of your personal data in a portable format</p>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">Correction</h3>
                  <p className="text-sm text-neutral-700">Update or correct inaccurate information</p>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">Deletion</h3>
                  <p className="text-sm text-neutral-700">Request deletion of your personal information</p>
                </div>
                <div>
                  <h3 className="font-medium text-neutral-900 mb-2">Marketing Opt-out</h3>
                  <p className="text-sm text-neutral-700">Unsubscribe from promotional communications</p>
                </div>
              </div>
            </div>

            <p className="text-neutral-700">
              To exercise these rights, please contact us at{" "}
              <a href="mailto:maximus.chapman.23@gmail.com" className="text-black hover:underline">
                maximus.chapman.23@gmail.com
              </a>
              . We will respond to your request within 30 days.
            </p>
          </div>
        </section>

        {/* International Data Transfers */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">International Data Transfers</h2>
          <p className="text-neutral-700">
            Your information may be transferred to and processed in countries other than your own. We ensure
            that such transfers comply with applicable data protection laws and implement appropriate safeguards
            to protect your information.
          </p>
        </section>

        {/* Children's Privacy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Children&apos;s Privacy</h2>
          <p className="text-neutral-700">
            Our services are not intended for children under 13. We do not knowingly collect personal information
            from children under 13. If we become aware that we have collected personal information from a child
            under 13, we will take steps to delete such information.
          </p>
        </section>

        {/* Changes to Privacy Policy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">Changes to This Privacy Policy</h2>
          <p className="text-neutral-700">
            We may update this Privacy Policy from time to time. We will notify you of any material changes by
            posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. Your continued
            use of our services after such changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        {/* Contact Information */}
        <section className="bg-neutral-50 p-8 rounded-lg">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-4">Contact Us</h2>
          <p className="text-neutral-700 mb-4">
            If you have any questions about this Privacy Policy or our data practices, please contact us:
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

