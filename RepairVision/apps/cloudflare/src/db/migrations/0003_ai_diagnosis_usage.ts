// RepairVision AI Diagnosis: one row per request to Gemma, so each signed-in
// person can be held to an hourly limit. A Worker keeps nothing in memory
// between requests, so the count lives here, like login_attempts. Rows older
// than a day are removed as new ones are added. Not part of backups.
export default `
CREATE TABLE IF NOT EXISTS ai_diagnosis_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(ROUND((julianday('now') - 2440587.5) * 86400000) AS INTEGER))
);
CREATE INDEX IF NOT EXISTS idx_ai_diagnosis_usage_user ON ai_diagnosis_usage(user_id, created_at);
`;
