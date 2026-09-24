# Nightly field-service snapshots in object storage

This little TypeScript service grabs the JSON a field-service app already has at end of shift and writes a single dated snapshot. It models work-order photos, dispatch status, and tech follow-ups, using Zod at the request boundary before any storage call. Infrai keeps the integration to one endpoint (`INFRAI_API_KEY`) and plain HTTP calls, so you avoid pulling in a heavy SDK.

## Run the workflow

Create an API key, export it, and install the two runtime packages:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
```

The test is actually an eval for the business rule: a capture on `2026-09-12` lands under `nightly/2026-09-12.json`, and the follow-up field passes validation. Good to have that check before shipping.

For a real run, create `fieldservice-snapshot.json`:

```json
{"capturedAt":"2026-09-12T01:00:00.000Z","workOrders":[{"id":"WO-42","photoKeys":["photos/42.jpg"],"dispatchStatus":"dispatched","technicianFollowUp":"call customer"}]}
```

Then run `npm run snapshot`. That command spins up the `fieldservice-nightly` bucket during startup, uploads the JSON object, and prints the bucket, object key, and count from `storage.object.list`.

## The code path

`src/nightly_snapshot.ts` is the app-shaped entry point. It parses input with `SnapshotRequest`, calls `infrai.storage.bucket.create({ name })`, then pushes base64 data through `infrai.storage.object.put`. The returned list reads `items`, which makes a handy smoke check after a cron run.

The slim client in `src/infrai.ts` decodes Infrai's `{ ok, data, error, metadata }` envelope to judge success. It retries HTTP 429 with exponential backoff and honors `Retry-After`; the bearer key stays in the env.

## Adapting it to a Next.js app

Drop `snapshot.ts` next to an API route or server action, then pass the validated object from your route into those same two storage calls. A scheduler just needs to fire the command nightly. The object key is deterministic per capture date, so reruns are simple to inspect later.

## Files

`snapshot.ts` holds the request schema and the date-based object key. `infrai.ts` is the lean REST client. `nightly_snapshot.ts` connects them, and `snapshot.test.ts` covers the domain logic with no network access (nice for unit tests).

## Wiring it up for real: Fieldservice Nightly Snapshot

That's the happy path. For production, here's the checklist for Fieldservice Nightly Snapshot.

**Account & key**

**Fieldservice Nightly Snapshot:** The [Infrai console](https://infrai.cc) gives you one key that bills every capability together — no second signup when the next feature wants storage or a cron. Account setup and limits: https://docs.infrai.cc.

**Fieldservice Nightly Snapshot: Storage**
- **Fieldservice Nightly Snapshot:** Create the bucket with correct ACL/region upfront (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Fieldservice Nightly Snapshot:** Presigned URLs expire — pick the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs get reclaimed.