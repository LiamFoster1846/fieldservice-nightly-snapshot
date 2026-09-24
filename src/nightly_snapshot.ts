import { readFile } from "node:fs/promises";
import { infrai } from "./infrai.js";
import { SnapshotRequest, encodeSnapshot, snapshotObjectKey } from "./snapshot.js";

const BUCKET = process.env.INFRAI_BUCKET ?? "fieldservice-nightly";

async function main(): Promise<void> {
  const inputPath = process.argv[2] ?? "./fieldservice-snapshot.json";
  const input = SnapshotRequest.parse(JSON.parse(await readFile(inputPath, "utf8")));
  await infrai.storage.bucket.create({ name: BUCKET });
  const key = snapshotObjectKey(input.capturedAt);
  await infrai.storage.object.put(BUCKET, key, { data_base64: encodeSnapshot(input) });
  const listing = await infrai.storage.object.list(BUCKET);
  console.log(JSON.stringify({ bucket: BUCKET, key, objectCount: listing.items.length }));
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
