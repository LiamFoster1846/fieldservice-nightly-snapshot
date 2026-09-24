import assert from "node:assert/strict";
import { SnapshotRequest, snapshotObjectKey } from "./snapshot.js";

const parsed = SnapshotRequest.parse({ capturedAt: "2026-09-12T01:00:00.000Z", workOrders: [{ id: "WO-42", photoKeys: ["photos/42.jpg"], dispatchStatus: "dispatched", technicianFollowUp: "call customer" }] });
assert.equal(snapshotObjectKey(parsed.capturedAt), "nightly/2026-09-12.json");
assert.equal(parsed.workOrders[0].technicianFollowUp, "call customer");
console.log("snapshot decision test passed");
