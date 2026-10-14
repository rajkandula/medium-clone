'use client';

import PublicLayout from '@/components/shared/PublicLayout';

export default function CookiesPage() {
  return (
    <PublicLayout>
      <div className="py-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-2 tracking-tight text-gray-900">Cookie Policy</h1>
        <p className="text-xs text-gray-400 mb-10">Last updated: June 3, 2026</p>
        
        <div className="space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. What are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device to store data that can be recalled by a web server. 
              They are widely used to make websites work efficiently, enable security features, and provide analytical data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. How We Use Cookies</h2>
            <p className="mb-3">
              We use both session cookies (which expire when you close your browser) and persistent cookies to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Authentication & Sessions:</strong> To keep you logged in to your BlogWrite dashboard securely as you navigate between pages.</li>
              <li><strong>User Preferences:</strong> To remember configurations such as light/dark mode settings.</li>
              <li><strong>Billing & Transactions:</strong> Stripe uses cookies to manage session checkouts and prevent fraudulent billing actions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Managing and Controlling Cookies</h2>
            <p className="mb-3">
              Most web browsers automatically accept cookies, but you can change your browser settings to block or delete them. Please note that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>If you choose to block cookies, you will not be able to log in or use dashboard features.</li>
              <li>Blocking cookies does not delete existing ones; you must clear them manually within your browser history settings.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Updates to This Policy</h2>
            <p>
              We may update our Cookie Policy occasionally to reflect technical or legal shifts. We recommend reviewing this page periodically to stay informed about how we utilize cookie data.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
