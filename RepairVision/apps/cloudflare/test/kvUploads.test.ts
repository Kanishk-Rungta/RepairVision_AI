// Uploads kept in Workers KV, for an account without R2 (src/lib/kvUploads.ts).
// The adapter on its own, then the real upload and /uploads/* routes running
// with no bucket bound, only a KV namespace.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { env } from 'cloudflare:workers';
import { KvUploadStore } from '../src/lib/kvUploads.js';
import { call, freshHub, photoForm, setUpHub, worker } from './helpers.js';
import { bytes, JPEG_WITH_GPS } from './fixtures.js';

const bindings = env as unknown as Record<string, unknown> & { TEST_UPLOADS_KV: KVNamespace };

describe('KvUploadStore', () => {
  // Used exactly as the hub uses it: as an R2 bucket.
  const store = new KvUploadStore(bindings.TEST_UPLOADS_KV) as unknown as R2Bucket;

  it('keeps bytes with their metadata and reads them back', async () => {
    await store.put('cache/net.json', '{"a":1}', {
      httpMetadata: { contentType: 'application/json' },
      customMetadata: { version: '3' },
    });
    const object = (await store.get('cache/net.json')) as R2ObjectBody | null;
    expect(object).not.toBeNull();
    expect(await object!.text()).toBe('{"a":1}');
    expect(object!.customMetadata).toEqual({ version: '3' });
    expect(object!.size).toBe(7);
    const headers = new Headers();
    object!.writeHttpMetadata(headers);
    expect(headers.get('content-type')).toBe('application/json');
    expect(await store.get('missing')).toBeNull();
  });

  it('answers conditional and ranged reads the way R2 does', async () => {
    const saved = await store.put('repairs/x/a.bin', new Uint8Array([1, 2, 3, 4, 5]));
    const cached = await store.get('repairs/x/a.bin', { onlyIf: new Headers({ 'if-none-match': saved!.httpEtag }) });
    expect(cached && 'body' in cached).toBe(false);
    const part = (await store.get('repairs/x/a.bin', { range: new Headers({ range: 'bytes=1-2' }) })) as R2ObjectBody | null;
    expect(part!.range).toEqual({ offset: 1, length: 2 });
    expect([...new Uint8Array(await part!.arrayBuffer())]).toEqual([2, 3]);
  });

  it('lists with sizes and deletes one or many', async () => {
    await store.put('list/a', 'aa');
    await store.put('list/b', 'bbb');
    const page = await store.list({ prefix: 'list/' });
    expect(page.objects.map((o) => [o.key, o.size])).toEqual([['list/a', 2], ['list/b', 3]]);
    expect(page.truncated).toBe(false);
    await store.delete(['list/a', 'list/b']);
    expect((await store.list({ prefix: 'list/' })).objects).toEqual([]);
  });
});

describe('the hub with uploads in KV instead of R2', () => {
  let bucket: unknown;
  let token = '';

  beforeAll(async () => {
    await freshHub();
    token = (await setUpHub()).token;
    bucket = bindings.UPLOADS;
    delete bindings.UPLOADS;
    bindings.UPLOADS_KV = bindings.TEST_UPLOADS_KV;
  });

  afterAll(() => {
    bindings.UPLOADS = bucket;
    delete bindings.UPLOADS_KV;
  });

  it('stores an uploaded photo and serves it back, without camera metadata', async () => {
    const upload = await call('/api/repairer/me/avatar', { token, body: photoForm(bytes(JPEG_WITH_GPS)) });
    expect(upload.status).toBe(200);
    const url: string = upload.body.url;
    const key = url.replace(/^\/uploads\//, '');
    expect(await bindings.TEST_UPLOADS_KV.get(key)).not.toBeNull();

    const served = await worker.fetch(`https://hub.test${url}`);
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/jpeg');
    expect(new TextDecoder().decode(await served.arrayBuffer())).not.toContain('GPSSECRET');

    const again = await worker.fetch(`https://hub.test${url}`, { headers: { 'If-None-Match': served.headers.get('etag')! } });
    expect(again.status).toBe(304);
  });

  it('reports itself healthy', async () => {
    expect((await call('/api/health')).status).toBe(200);
  });
});
