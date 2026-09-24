import { z } from "zod";

export const SnapshotRequest = z.object({
  capturedAt: z.string().datetime(),
  workOrders: z.array(z.object({ id: z.string(), photoKeys: z.array(z.string()), dispatchStatus: z.string(), technicianFollowUp: z.string().nullable() })),
});
export type SnapshotRequest = z.infer<typeof SnapshotRequest>;

export function snapshotObjectKey(capturedAt: string): string {
  return `nightly/${capturedAt.slice(0, 10)}.json`;
}

export function encodeSnapshot(input: SnapshotRequest): string {
  return Buffer.from(JSON.stringify({ capturedAt: input.capturedAt, workOrders: input.workOrders })).toString("base64");
}
