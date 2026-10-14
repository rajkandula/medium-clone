'use client';

import PublicLayout from '@/components/shared/PublicLayout';

export default function TermsPage() {
  return (
    <PublicLayout>
      <div className="py-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-2 tracking-tight text-gray-900">Terms of Service</h1>
        <p className="text-xs text-gray-400 mb-10">Last updated: June 3, 2026</p>
        
        <div className="space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BlogWrite, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not access or use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. User Accounts & Responsibilities</h2>
            <p className="mb-3">
              When creating an account, you agree to provide accurate registration info. You are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Maintaining the confidentiality of your session password and API keys.</li>
              <li>All activities and content posted under your username.</li>
              <li>Ensuring your integration setups (including local MCP servers running on Claude Desktop) do not breach security practices.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Acceptable Use and Content Standards</h2>
            <p className="mb-3">
              You retain copyright over any content you write and publish on BlogWrite. However, you agree not to submit or broadcast any content that:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Is unlawful, threatening, abusive, defamatory, or invasive of another's privacy.</li>
              <li>Contains malicious code, scripts, or aims to overwhelm our database endpoints (spamming API requests).</li>
              <li>Infringes on patents, trademarks, or copyrights of any third party.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Intellectual Property</h2>
            <p>
              The BlogWrite name, logos, and custom codebases are the exclusive property of BlogWrite and its owners. You may not copy, scrape, or replicate the branding assets or platform interfaces without our prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Disclaimer of Warranties</h2>
            <p>
              The platform is provided "as is" without warranty of any kind. We do not guarantee that the service will be uninterrupted, error-free, or completely secure. We reserve the right to suspend accounts violating these terms.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
