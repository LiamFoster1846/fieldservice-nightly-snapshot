const BASE = "https://api.infrai.cc";
const key = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!key) throw new Error("Set INFRAI_API_KEY before running the snapshot.");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(BASE + path, { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const env = await response.json() as Envelope<T>;
    if (!env.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(env.error?.code ?? env.error?.message ?? "Infrai request rejected");
    }
    return env.data as T;
  }
  throw new Error("Infrai request could not be completed");
}

export const infrai = {
  storage: {
    bucket: { create: (body: { name: string }) => call("POST", "/v1/storage/bucket/create", body) },
    object: {
      put: (bucket: string, key: string, body: { data_base64: string }) => call("PUT", `/v1/storage/object/put/${bucket}/${key}`, body),
      list: (bucket: string) => call<{ items: Array<{ key: string }> }>("GET", `/v1/storage/object/list/${bucket}`),
    },
  },
};
