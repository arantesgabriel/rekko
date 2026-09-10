import { workItem, workspaceMember } from "@rekko/db";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";

import type { DemandHierarchyNode } from "./domain";

export async function listAccessibleDemandHierarchy(
  userId: string,
  workspaceId?: string,
) {
  const nodes = await db
    .select({
      id: workItem.id,
      title: workItem.title,
      parentWorkItemId: workItem.parentWorkItemId,
      externalIdentifier: workItem.externalIdentifier,
    })
    .from(workItem)
    .innerJoin(
      workspaceMember,
      and(
        eq(workspaceMember.workspaceId, workItem.workspaceId),
        eq(workspaceMember.userId, userId),
      ),
    )
    .where(workspaceId ? eq(workItem.workspaceId, workspaceId) : undefined);

  return nodes satisfies DemandHierarchyNode[];
}
