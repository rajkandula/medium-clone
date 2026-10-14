// Zero-dependency internal cron scheduler — no external scheduler needed.
// Started once from src/instrumentation.js when the Next.js server boots.
//
// Handlers are invoked in-process (no HTTP hop), so the scheduler does not care
// which port the server happened to bind. Schedules are in UTC. Disable with
// ENABLE_INTERNAL_CRON=false — e.g. on a web-only instance when generation runs
// on another machine (one with a local model) that writes into the same MongoDB.

const JOBS = [
  { name: 'fetch-news',      when: (h) => h % 4 === 0,          load: () => import('../app/api/cron/fetch-news/route.js') },
  { name: 'fetch-research',  when: (h) => h % 6 === 0,          load: () => import('../app/api/cron/fetch-research/route.js') },
  { name: 'generate-topics', when: (h) => h === 0,              load: () => import('../app/api/cron/generate-topics/route.js') },
  { name: 'generate-posts',  when: (h) => h === 6 || h === 18,  load: () => import('../app/api/cron/generate-posts/route.js') },
  { name: 'generate-series', when: (h, d) => d === 0 && h === 3, load: () => import('../app/api/cron/generate-series/route.js') },
];

const completed = new Set(); // "name:YYYY-MM-DDTHH" keys already run this hour

async function runJob(job, secret) {
  const started = Date.now();
  try {
    console.log(`[InternalCron] ▶ ${job.name}`);
    const mod = await job.load();
    const req = new Request(`http://internal-cron/api/cron/${job.name}`, {
      headers: { authorization: `Bearer ${secret}` },
    });
    const res = await mod.GET(req);
    const body = await res.json().catch(() => ({}));
    const secs = Math.round((Date.now() - started) / 1000);
    const note = body.skipped ? ` (skipped: ${body.reason})` : '';
    console.log(`[InternalCron] ${res.ok ? '✅' : '❌'} ${job.name} → ${res.status}${note} (${secs}s)`);
  } catch (err) {
    console.error(`[InternalCron] ❌ ${job.name} failed: ${err.message || err}`);
  }
}

async function tick(secret) {
  const now = new Date();
  if (now.getUTCMinutes() !== 0) return;

  const hourKey = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  const due = JOBS.filter(
    (j) => j.when(now.getUTCHours(), now.getUTCDay()) && !completed.has(`${j.name}:${hourKey}`)
  );

  // Sequential — the local model generates one thing at a time.
  for (const job of due) {
    completed.add(`${job.name}:${hourKey}`);
    await runJob(job, secret);
  }

  if (completed.size > 500) completed.clear();
}

export function startInternalCron() {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.warn('[InternalCron] CRON_SECRET is not set — internal cron disabled.');
    return;
  }

  console.log(
    '[InternalCron] armed in-process (UTC): fetch-news every 4h · fetch-research every 6h · ' +
      'generate-topics 00:00 · generate-posts 06:00 & 18:00 · generate-series Sun 03:00'
  );

  // CRON_FORCE_TICK=<job-name> runs one job at boot — lets you exercise the
  // scheduler without waiting for the top of the hour.
  const forced = process.env.CRON_FORCE_TICK;
  if (forced) {
    const job = JOBS.find((j) => j.name === forced);
    if (job) runJob(job, secret);
    else console.warn(`[InternalCron] CRON_FORCE_TICK="${forced}" matches no job`);
  }

  const timer = setInterval(() => tick(secret), 30_000);
  timer.unref?.(); // never keep the process alive just for the scheduler
}
