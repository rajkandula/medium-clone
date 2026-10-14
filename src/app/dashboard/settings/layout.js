'use client';

export default function SettingsLayout({ children }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-primary)' }}>Settings</h1>
      
      {/* Tab Content */}
      {children}
    </div>
  );
}
