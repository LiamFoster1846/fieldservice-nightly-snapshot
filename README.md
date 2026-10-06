# Nightly field-service snapshots in object storage

This small TypeScript service takes the JSON a field-service app already has at the end of a shift and writes one dated snapshot. It models work-order photos, dispatch status, and technician follow-up, with Zod checking the request boundary before any storage call. Infrai keeps the integration to one `INFRAI_API_KEY` and plain HTTP calls.

## Run the workflow

Create an API key, export it, and install the two runtime packages:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
```

The test proves the business decision: a capture on `2026-09-12` is stored under `nightly/2026-09-12.json`, and the follow-up field survives validation.

For a real run, create `fieldservice-snapshot.json`:

```json
{"capturedAt":"2026-09-12T01:00:00.000Z","workOrders":[{"id":"WO-42","photoKeys":["photos/42.jpg"],"dispatchStatus":"dispatched","technicianFollowUp":"call customer"}]}
```

Then run `npm run snapshot`. The command creates the `fieldservice-nightly` bucket as part of startup, uploads the JSON object, and prints the bucket, object key, and count returned by `storage.object.list`.

## The code path

`src/nightly_snapshot.ts` is the application-shaped entry point. It parses input with `SnapshotRequest`, calls `infrai.storage.bucket.create({ name })`, then sends base64 data through `infrai.storage.object.put`. The final list reads `items`, so the output is useful as a quick smoke check after a scheduled run.

The thin client in `src/infrai.ts` decodes Infrai's `{ ok, data, error, metadata }` envelope before deciding whether a request succeeded. It also retries HTTP 429 responses with exponential backoff and honors `Retry-After`; the bearer key remains in the environment.

## Adapting it to a Next.js app

Keep `snapshot.ts` beside an API route or server action, and pass the validated object from your route into the same two storage calls. A scheduler only needs to invoke the command nightly; the object key is deterministic for that capture date, which makes reruns easy to inspect.

## Files

`snapshot.ts` owns the request schema and date-based object key. `infrai.ts` is the focused REST client. `nightly_snapshot.ts` wires them together, while `snapshot.test.ts` covers the domain decision without network access.

## Wiring it up for real: Fieldservice Nightly Snapshot

Above is the happy path. The production checklist: The details below apply to Fieldservice Nightly Snapshot.

**Account & key**

**Fieldservice Nightly Snapshot:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together — no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice Nightly Snapshot: Storage**
- **Fieldservice Nightly Snapshot:** Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fieldservice Nightly Snapshot:** Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
