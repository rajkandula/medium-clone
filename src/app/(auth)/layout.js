export default function AuthLayout({ children }) {
  return (
    <div 
      className="min-h-screen flex"
      style={{ background: 'var(--color-bg-primary)' }}
    >
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </div>
      
      {/* Right side - Branding (hidden on mobile) */}
      <div 
        className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden"
        style={{ background: 'var(--color-bg-tertiary)' }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full opacity-20 animate-float" style={{ background: 'var(--color-brand)', filter: 'blur(120px)' }} />
          <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full opacity-10 animate-float" style={{ background: 'var(--color-brand-hover)', filter: 'blur(140px)', animationDelay: '3s' }} />
        </div>
        
        <div className="relative z-10 max-w-md text-center px-8">
          <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-8">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-serif)' }}>
            Share Your Story With the World
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Join a community of passionate writers and readers. Create beautiful content, 
            grow your audience, and make your voice heard.
          </p>
        </div>
      </div>
    </div>
  );
}
