/**
 * Finding the part you would need to buy.
 *
 * Two sources, and the line between them matters:
 *
 *  1. iFixit's open API (the same one services/ifixit.ts uses). It names the
 *     replacement part, gives its part number and links to the store page. It
 *     does NOT publish prices, so this source only ever fills in a name and a
 *     link. The person reads the price off that page and types it in.
 *  2. An optional price provider, off unless PARTS_PRICE_API_URL is set. It is
 *     whatever price service the cafe has a key for. We ask it for a part by
 *     name and trust only a price that comes back with a link and the
 *     currency that was asked for. Its answers are marked `source: 'lookup'`.
 *
 * No price is ever made up. When nothing returns a price, the field stays
 * empty and the page asks the person for one.
 *
 * The provider contract, so any service can sit behind a small adapter:
 *
 *   GET {PARTS_PRICE_API_URL}?q=<part name>&currency=GBP
 *   Authorization: Bearer {PARTS_PRICE_API_KEY}      (only if a key is set)
 *   ->  { "results": [ { "name": "...", "price": 24.99, "currency": "GBP",
 *                        "url": "https://shop.example/part" } ] }
 */
import { bindings } from '../../env.js';
import { readCached, writeCached } from '../../lib/cache.js';

const IFIXIT = 'https://www.ifixit.com/api/2.0';
const USER_AGENT = 'CircularityRepairCafeHub/1.0';
const TIMEOUT_MS = 10_000;
/** Part names change slowly; prices drift, so a provider answer is kept for less. */
const NAME_TTL_MS = 6 * 60 * 60 * 1000;
const PRICE_TTL_MS = 30 * 60 * 1000;
const MAX_PARTS = 5;

export interface PartMatch {
  name: string;
  /** The page to read the price from, or the shop's own page for a looked-up price. */
  url: string;
  partNumber: string | null;
  supplier: string;
  /** Null unless a price provider supplied one. */
  price: number | null;
  currency: string | null;
  source: 'link' | 'lookup';
}

export interface PartsAnswer {
  parts: PartMatch[];
  /** True when a price provider is configured, so the page can say prices may be filled in. */
  priceProvider: boolean;
}

/** One provider result, checked by hand: anything that is not exactly right is dropped. */
function validResult(r: unknown): { name: string; price: number; currency: string; url: string } | null {
  if (!r || typeof r !== 'object') return null;
  const { name, price, currency, url } = r as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim() || name.length > 200) return null;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0 || price > 100_000) return null;
  if (typeof currency !== 'string' || !/^[A-Za-z]{3}$/.test(currency)) return null;
  if (typeof url !== 'string' || url.length > 500) return null;
  try {
    if (new URL(url).protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return { name: name.trim(), price, currency, url };
}

/** The configured provider, or null. Only https is accepted, so a key is never sent in the clear. */
function providerConfig(): { url: string; key: string | null } | null {
  const b = bindings();
  const raw = (b.PARTS_PRICE_API_URL ?? '').trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return null;
    return { url: u.toString(), key: (b.PARTS_PRICE_API_KEY ?? '').trim() || null };
  } catch {
    return null;
  }
}

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': USER_AGENT, ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return (await res.json()) as T;
}

/** Replacement parts iFixit lists for a search, each with its store link when it has one. */
async function ifixitParts(query: string): Promise<PartMatch[]> {
  const key = `parts:ifixit:${query.toLowerCase()}`;
  const hit = await readCached<PartMatch[]>(key);
  if (hit) return hit;

  const found = await getJson<{ results?: Array<Record<string, unknown>> }>(
    `${IFIXIT}/search/${encodeURIComponent(query)}?filter=product&limit=10`,
  );
  const items = (found.results ?? [])
    .filter((r) => r.dataType === 'wiki' && r.namespace === 'ITEM' && typeof r.title === 'string' && typeof r.url === 'string')
    .slice(0, MAX_PARTS);

  const parts = await Promise.all(
    items.map(async (item): Promise<PartMatch> => {
      const title = item.title as string;
      const pageUrl = item.url as string;
      let partNumber: string | null = null;
      let storeUrl = pageUrl;
      try {
        const detail = await getJson<{ suppliers?: Array<Record<string, unknown>> }>(
          `${IFIXIT}/wikis/ITEM/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        );
        const supplier = (detail.suppliers ?? []).find((s) => typeof s.url === 'string');
        if (supplier) {
          storeUrl = supplier.url as string;
          const num = supplier['part_#'];
          partNumber = typeof num === 'string' && num ? num : null;
        }
      } catch {
        /* the search result's own page is a fine link */
      }
      return { name: title, url: storeUrl, partNumber, supplier: 'iFixit', price: null, currency: null, source: 'link' };
    }),
  );
  await writeCached(key, parts, NAME_TTL_MS);
  return parts;
}

/** Priced parts from the configured provider. Any failure just means no prices. */
async function providerParts(query: string, currency: string): Promise<PartMatch[]> {
  const cfg = providerConfig();
  if (!cfg) return [];
  const key = `parts:provider:${currency}:${query.toLowerCase()}`;
  const hit = await readCached<PartMatch[]>(key);
  if (hit) return hit;
  try {
    const url = new URL(cfg.url);
    url.searchParams.set('q', query);
    url.searchParams.set('currency', currency);
    const body = await getJson<{ results?: unknown }>(url.toString(), cfg.key ? { Authorization: `Bearer ${cfg.key}` } : {});
    const parts = (Array.isArray(body.results) ? body.results : [])
      .map(validResult)
      .filter((r): r is NonNullable<typeof r> => r !== null)
      // A price in another currency would be wrong, not just unhelpful.
      .filter((r) => r.currency.toUpperCase() === currency)
      .slice(0, MAX_PARTS)
      .map((r): PartMatch => ({
        name: r.name,
        url: r.url,
        partNumber: null,
        supplier: new URL(r.url).host,
        price: r.price,
        currency,
        source: 'lookup',
      }));
    await writeCached(key, parts, PRICE_TTL_MS);
    return parts;
  } catch {
    return [];
  }
}

export async function findParts(query: string, currency = 'GBP'): Promise<PartsAnswer> {
  const q = query.trim();
  const cur = currency.toUpperCase();
  // Each source can fail on its own without losing the other's answer.
  const [links, priced] = await Promise.all([ifixitParts(q).catch(() => []), providerParts(q, cur)]);
  // Priced results first: they are the ones a person can use as they stand.
  return { parts: [...priced, ...links].slice(0, MAX_PARTS * 2), priceProvider: providerConfig() !== null };
}
