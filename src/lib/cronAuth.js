// Shared CRON secret handling. There is intentionally NO hardcoded fallback:
// a missing/weak CRON_SECRET must fail loudly rather than silently accepting a
// publicly-known development value.

export function getCronSecret() {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'CRON_SECRET environment variable is missing or too short (must be at least 16 characters).'
    );
  }
  return secret;
}
