// Repair vs. Replace Advisor.
//  - Three cafe settings: the currency prices are shown in, and the two shares
//    of a replacement's price that decide "repair" and "replace".
//  - The last estimate saved against a repair job, as JSON. Kept on the job so
//    backups and moves carry it without a new table.
export default `
ALTER TABLE cafes ADD COLUMN advisor_currency TEXT NOT NULL DEFAULT 'GBP';
ALTER TABLE cafes ADD COLUMN advisor_repair_share REAL NOT NULL DEFAULT 0.5;
ALTER TABLE cafes ADD COLUMN advisor_replace_share REAL NOT NULL DEFAULT 0.9;
ALTER TABLE repair_jobs ADD COLUMN advisor_estimate TEXT;
`;
