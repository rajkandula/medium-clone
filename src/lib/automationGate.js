import dbConnect from '@/lib/db';
import AutomationState from '@/models/AutomationState';

const GLOBAL_KEY = 'global';

/**
 * Read the global automation state (singleton). Returns a plain object even
 * when no document exists yet (defaults to not-paused).
 */
export async function getAutomationState() {
  await dbConnect();
  const state = await AutomationState.findOne({ key: GLOBAL_KEY }).lean();
  return state || { key: GLOBAL_KEY, paused: false, pausedAt: null, pausedBy: null };
}

/** True when the master switch is engaged — all pipelines must halt. */
export async function isAutomationPaused() {
  const state = await getAutomationState();
  return !!state.paused;
}

/** Engage or release the master switch. Records who/when for the audit trail. */
export async function setAutomationPaused(paused, adminId = null) {
  await dbConnect();
  return AutomationState.findOneAndUpdate(
    { key: GLOBAL_KEY },
    {
      paused: !!paused,
      pausedAt: paused ? new Date() : null,
      pausedBy: paused ? adminId : null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();
}
