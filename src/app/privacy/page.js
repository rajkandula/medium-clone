'use client';

import PublicLayout from '@/components/shared/PublicLayout';

export default function PrivacyPage() {
  return (
    <PublicLayout>
      <div className="py-20 px-6 max-w-3xl mx-auto">
        <h1 className="text-3xl font-black mb-2 tracking-tight text-gray-900">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mb-10">Last updated: June 3, 2026</p>
        
        <div className="space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p className="mb-3">
              We collect information you provide directly to us when creating an account, writing blog posts, submitting contact forms, or configuring API key integrations. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account Details:</strong> Your name, username, email address, password, profile picture, and bio.</li>
              <li><strong>Writing Content:</strong> Drafts, published blog articles, comments, bookmarks, and categories.</li>
              <li><strong>Integration Tokens:</strong> Hash records of API keys generated for Claude Desktop/Web MCP connector setups.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">
              Your information is utilized solely to operate, improve, and secure the BlogWrite platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To present your public profile and articles to readers.</li>
              <li>To run AI text expansions and suggestions via our secure API endpoints (your private drafts are not used to train public models).</li>
              <li>To authenticate local/remote Model Context Protocol (MCP) clients calling your account workspace.</li>
              <li>To process premium checkout plans securely through Stripe.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">3. Data Sharing and Third Parties</h2>
            <p>
              We do not sell or lease your personal data. We share credentials only with trusted sub-processors required to host and run the application (such as database storage, application hosting, and Stripe billing processing).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">4. Security</h2>
            <p>
              We store your API keys in secure cryptographic hashes (SHA-256) and use transport layer security (HTTPS) across all API routes. However, no internet transmission is 100% secure; please protect your session credentials and API keys appropriately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-3">5. Your Rights and Choices</h2>
            <p>
              You have the right to edit, publish, or delete your posts at any time. You can revoke any API Key immediately from your dashboard settings to terminate integration sessions. You may also contact us to request full deletion of your account.
            </p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
