import type { WorkItem } from "../domain/phase1/index.js";
import { evaluateHardBlockers } from "./hardBlockers.js";

export function isHardBlocked(workItem: WorkItem, byPageId: Map<string, WorkItem>): boolean {
  return evaluateHardBlockers({
    status: workItem.status ?? "Backlog",
    blockedState: workItem.blockedState,
    dependencies: workItem.dependsOnPageIds.map((pageId) => {
      const dependency = byPageId.get(pageId);

      return {
        id: pageId,
        status: dependency?.status ?? undefined,
        blockedState: dependency?.blockedState ?? undefined,
      };
    }),
  }).isHardBlocked;
}
