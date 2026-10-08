// =============================================================================
//  Uploads in Workers KV, for an account without R2
//  ---------------------------------------------------------------------------
//  The hub keeps photos, logos, QR codes and cached files in an R2 bucket. R2
//  has a free tier, but Cloudflare asks for a payment method before switching
//  it on. Workers KV needs none, so an account without R2 can bind a KV
//  namespace as UPLOADS_KV instead (wrangler.jsonc), and env.ts hands the rest
//  of the hub this class in place of the bucket.
//
//  It answers the part of R2's interface the hub uses: put, get (with the
//  conditional and range options /uploads/* passes on), delete and list. The
//  bytes are the KV value; content type, cache rules, custom metadata, size
//  and ETag ride along as KV metadata, which list() also returns.
//
//  Limits to know (Workers KV free plan): 1 GB stored, values up to 25 MiB,
//  1,000 writes a day, and a write can take up to a minute to be seen from
//  other Cloudflare locations. Plenty for a demo or a small cafe. With a
//  payment method on file, R2 is the better home: bind it as UPLOADS and this
//  class is no longer used.
// =============================================================================

interface StoredMeta {
  /** Content type, cache rules and the like, as R2's httpMetadata. */
  h?: R2HTTPMetadata;
  /** The caller's own key/value pairs, as R2's customMetadata. */
  c?: Record<string, string>;
  /** Size in bytes, so list() can report it without reading the value. */
  s: number;
  /** SHA-256 of the bytes, used as the ETag. */
  e: string;
  /** Upload time, milliseconds. */
  u: number;
}

const HEADER_FOR: Array<[keyof R2HTTPMetadata, string]> = [
  ['contentType', 'Content-Type'],
  ['contentLanguage', 'Content-Language'],
  ['contentDisposition', 'Content-Disposition'],
  ['contentEncoding', 'Content-Encoding'],
  ['cacheControl', 'Cache-Control'],
];

async function toBytes(value: unknown): Promise<Uint8Array> {
  if (value === null || value === undefined) return new Uint8Array();
  if (typeof value === 'string') return new TextEncoder().encode(value);
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  return new Uint8Array(await new Response(value as BodyInit).arrayBuffer());
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** The object R2 would describe, without a body. */
function describe(key: string, meta: StoredMeta) {
  const httpMetadata = meta.h ?? {};
  return {
    key,
    size: meta.s,
    etag: meta.e,
    httpEtag: `"${meta.e}"`,
    version: meta.e,
    uploaded: new Date(meta.u),
    httpMetadata,
    customMetadata: meta.c ?? {},
    checksums: {},
    storageClass: 'Standard',
    writeHttpMetadata(headers: Headers) {
      for (const [field, header] of HEADER_FOR) {
        const value = httpMetadata[field];
        if (typeof value === 'string' && value) headers.set(header, value);
      }
    },
  };
}

/** True when the browser already has this version (If-None-Match / If-Modified-Since). */
function notModified(conditions: Headers, meta: StoredMeta): boolean {
  const match = conditions.get('if-none-match');
  if (match) {
    return match === '*' || match.split(',').some((v) => v.trim().replace(/^W\//, '') === `"${meta.e}"`);
  }
  const since = conditions.get('if-modified-since');
  return Boolean(since) && Math.floor(meta.u / 1000) <= Math.floor(Date.parse(since!) / 1000);
}

/** The slice a "Range: bytes=a-b" header asks for, or null for the whole file. */
function rangeFor(header: string | null, size: number): { offset: number; length: number } | null {
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;
  if (!m || (!m[1] && !m[2])) return null;
  const offset = m[1] ? Number(m[1]) : Math.max(0, size - Number(m[2]));
  const end = m[1] && m[2] ? Math.min(Number(m[2]) + 1, size) : size;
  if (offset >= size || end <= offset) return null;
  return { offset, length: end - offset };
}

export class KvUploadStore {
  constructor(private readonly kv: KVNamespace) {}

  async put(key: string, value: unknown, options: R2PutOptions = {}) {
    const bytes = await toBytes(value);
    const meta: StoredMeta = {
      h: options.httpMetadata instanceof Headers ? undefined : (options.httpMetadata as R2HTTPMetadata | undefined),
      c: options.customMetadata,
      s: bytes.length,
      e: await sha256Hex(bytes),
      u: Date.now(),
    };
    await this.kv.put(key, bytes, { metadata: meta });
    return describe(key, meta);
  }

  async get(key: string, options: R2GetOptions = {}) {
    const { value, metadata } = await this.kv.getWithMetadata<StoredMeta>(key, 'arrayBuffer');
    if (value === null || !metadata) return null;
    const object = describe(key, metadata);
    // R2 answers a satisfied condition with the description and no body.
    if (options.onlyIf instanceof Headers && notModified(options.onlyIf, metadata)) return object;

    let bytes = new Uint8Array(value);
    let range: { offset: number; length: number } | undefined;
    if (options.range instanceof Headers) {
      const wanted = rangeFor(options.range.get('range'), bytes.length);
      if (wanted) {
        range = wanted;
        bytes = bytes.slice(wanted.offset, wanted.offset + wanted.length);
      }
    }
    return {
      ...object,
      range,
      body: new Response(bytes).body!,
      bodyUsed: false,
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      bytes: async () => bytes,
      text: async () => new TextDecoder().decode(bytes),
      json: async <T>() => JSON.parse(new TextDecoder().decode(bytes)) as T,
      blob: async () => new Blob([bytes]),
    };
  }

  async delete(keys: string | string[]): Promise<void> {
    for (const key of Array.isArray(keys) ? keys : [keys]) await this.kv.delete(key);
  }

  async list(options: R2ListOptions = {}) {
    const page = await this.kv.list<StoredMeta>({
      prefix: options.prefix,
      cursor: options.cursor,
      limit: Math.min(Math.max(options.limit ?? 1000, 1), 1000),
    });
    const objects = page.keys.map((k) => describe(k.name, k.metadata ?? { s: 0, e: '', u: 0 }));
    return page.list_complete
      ? { objects, truncated: false as const, delimitedPrefixes: [] }
      : { objects, truncated: true as const, cursor: page.cursor, delimitedPrefixes: [] };
  }
}
