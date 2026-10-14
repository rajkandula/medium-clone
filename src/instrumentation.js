export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.ENABLE_INTERNAL_CRON === 'false') return;

  // Guard against duplicate registration (dev restarts, HMR).
  if (globalThis.__blogwriteCronStarted) return;
  globalThis.__blogwriteCronStarted = true;

  const { startInternalCron } = await import('./lib/internalCron');
  startInternalCron();
}
