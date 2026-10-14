'use client';

export default function NotificationsPage() {
  return (
    <div className="p-6 rounded-xl" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border-primary)' }}>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--color-text-primary)' }}>Notification Preferences</h3>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Configure how you receive notifications.</p>
    </div>
  );
}
