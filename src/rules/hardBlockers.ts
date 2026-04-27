import type { Phase1WorkItem, WorkItemDependency } from "./types.js";

export type HardBlockReason = "status_blocked" | "blocked_state" | "dependency_blocked";

export interface HardBlockEvaluation {
  isHardBlocked: boolean;
  reasons: HardBlockReason[];
  blockingDependencyIds: string[];
}

export function evaluateHardBlockers(
  workItem: Pick<
    Phase1WorkItem,
    "status" | "blockedState" | "dependencies" | "hasExplicitBlockedDependency"
  >,
): HardBlockEvaluation {
  const reasons: HardBlockReason[] = [];
  const blockingDependencyIds = collectBlockingDependencyIds(workItem.dependencies);

  if (workItem.status === "Blocked") {
    reasons.push("status_blocked");
  }

  if (workItem.blockedState != null && workItem.blockedState !== "Not Blocked") {
    reasons.push("blocked_state");
  }

  if (workItem.hasExplicitBlockedDependency === true || blockingDependencyIds.length > 0) {
    reasons.push("dependency_blocked");
  }

  return {
    isHardBlocked: reasons.length > 0,
    reasons,
    blockingDependencyIds,
  };
}

function collectBlockingDependencyIds(
  dependencies: readonly WorkItemDependency[] | undefined,
): string[] {
  if (dependencies == null) {
    return [];
  }

  return dependencies
    .filter((dependency) => {
      if (dependency.isBlocking === true) {
        return true;
      }

      if (dependency.status === "Blocked") {
        return true;
      }

      return dependency.blockedState != null && dependency.blockedState !== "Not Blocked";
    })
    .map((dependency) => dependency.id);
}
