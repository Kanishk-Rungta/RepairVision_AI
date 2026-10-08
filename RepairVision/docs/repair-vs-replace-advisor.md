# Repair vs. Replace Advisor

Status: **built.** The sums, the page, the links into it from AI Diagnosis and repair jobs, the parts finder, cafe settings, saving to a repair and a public version are all done. Live prices need a price service, which a cafe sets up (see below).

The advisor tells someone whether it is worth repairing a broken item or buying a replacement. It compares the money, allows for a repair that does not work, and shows the waste a repair avoids.

## What it does today

`POST /api/advisor/estimate` (anyone, signed in or not) takes the figures a person supplies and returns a verdict with the working shown. The sums are in `apps/cloudflare/src/services/advisor/calculate.ts`, the request and answer shapes are in `packages/shared/src/advisor.ts`, and `apps/cloudflare/test/advisor.test.ts` covers both.

### What the person supplies

| Field | Meaning |
| --- | --- |
| `item` | What is broken, in their words. |
| `factorId` | Optional item type from the CO2 reference list (`GET /api/public/co2-factors`). Needed for the waste figures. |
| `replacementCost`, `replacementExtras` | The price of a replacement they would really buy, and delivery or disposal on top. |
| `parts[]` | Each part's name, unit price, quantity, and an optional link to where the price was read. |
| `labourCost`, `toolsCost` | Paid labour (zero at a repair cafe) and tools they would need to buy. |
| `professionalQuote` | Optional quote from a repair shop, shown as a third option. |
| `successChance` | How likely the repair is to work, 0.05 to 1. Defaults to 0.8. Should come from the AI diagnosis when there is one. |
| `deviceAgeYears`, `expectedLifeYears` | Optional. Give a cost per year of life. |

### The rules

1. **Repair cost** = parts + labour + tools, added in pence.
2. **Replace cost** = new price + extras.
3. **Expected repair cost** = repair + (1 - success chance) x replace, because a failed repair still ends in a purchase.
4. **Verdict.** *Repair* when the repair is at most the cafe's repair share of the replacement (50% by default) and the expected cost is no more than replacing. *Replace* when it is over the replace share (90% by default), or the expected cost is higher than replacing. *Close* in between, where waste avoided is the tie-breaker. The defaults are a rule of thumb, not a law, which is why a cafe can change them (see Settings below).
5. **Waste avoided** reuses the hub's own CO2 data: CO2e of a new one x the cafe's displacement rate (default 0.5, see `services/co2.ts`), plus the item's weight. No figure is shown, rather than zero, when the item type is unknown or the cafe has CO2 reporting off.

## Parts and prices

Nothing in the advisor invents a price. Every price is typed in by the person, ideally with a link to the listing they read it from. A part price typed without a link raises a caveat in the answer.

`GET /api/advisor/parts?q=<part>` helps them find the right part:

- **iFixit (always on, no key).** Returns the replacement parts iFixit lists for the search, each with its part number and store link. iFixit's open API does not publish prices, so this only fills in a name and a link; the page tells the person to open the link and read the price.
- **A price service (optional, off by default).** Set `PARTS_PRICE_API_URL` (https only) and, if it needs one, `PARTS_PRICE_API_KEY` as a Worker secret. The hub then asks it for the part and fills in any price that comes back with a link and the currency asked for. Prices from it are marked as looked up and the page asks the person to check them. The contract is documented at the top of `apps/cloudflare/src/services/advisor/parts.ts`, so any service can sit behind a small adapter. Answers are cached for 30 minutes.

No price service is chosen or bundled. Check a provider's terms before using its prices, and note that price data goes stale quickly.

## Where it is used

- **Public page:** `/repair-or-replace`, in the public site's own frame and menu, open to anyone. No sign-in, no save button.
- **Staff page:** `/advisor`, in the sidebar for staff and device owners. The same form, and the one that can keep an answer on a repair.
- **From AI Diagnosis:** the report ends with "Compare costs", which opens the advisor with the device name and a starting chance of success taken from how likely the top fault is (high 85%, medium 65%, low 40%). The person can change it.
- **From a repair job:** "Repair or replace?" next to "Analyze with RepairVision AI", which opens `/advisor?job=<id>` with the item and its item type filled in.

## Keeping an estimate on a repair

`PUT /api/advisor/jobs/:id` (staff) saves the comparison on the repair job; `GET` reads it and `DELETE` removes it. The server works the answer out again from the figures sent and ignores any result the browser includes, so a saved answer is always one the server stands behind. One estimate is kept per repair, and saving again replaces it. It is stored as JSON on the job (`repair_jobs.advisor_estimate`, migration 0004), so backups and moves carry it without a new table. The repair page shows a summary card, saving and removing are written to the audit log, and opening the saved comparison fills the form back in.

## Cafe settings

An admin sets three things under **Settings, Repair or replace** (`GET`/`PATCH /api/admin/settings/advisor`): the currency prices are shown in, the repair share and the replace share. The replace share must be higher than the repair share, the repair share can be 10% to 95% and the replace share 20% to 150%. Bad values in the database fall back to the defaults. The public `GET /api/advisor/config` tells the page the currency and the two points, and every answer says which points it was judged against.

## Use without signing in

The advisor and the part finder are open to everyone, so each is rate-limited per hour in `services/advisor/rateLimit.ts`, using the same table as failed sign-ins (cleared daily). The sums are cheap, so the limit is generous (200 an hour per address, 300 for a signed-in person); a repair cafe's wifi puts many visitors behind one address. The part finder calls iFixit, so it is stricter: 40 an hour per address, 120 for a signed-in person. Saving to a repair stays staff-only.

## Not built

- A report over all saved estimates (money and waste avoided across the cafe).
- A cafe-set default for how likely a repair is to work.
