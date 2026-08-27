import type {
  LinearBrowseFilters,
  LinearGateway,
  LinearIssue,
} from "./gateway";

const now = "2026-08-27T12:00:00.000Z";
export const fakeLinearIssues: LinearIssue[] = [
  issue({
    id: "lin-parent",
    identifier: "LIN-100",
    title: "Authentication epic",
  }),
  issue({
    description: "Implementar login.\n\nEstimativa\n30m",
    id: "lin-child-a",
    identifier: "LIN-101",
    parentId: "lin-parent",
    title: "Login frontend",
  }),
  issue({
    description: "Estimativa\n1h 30m",
    id: "lin-child-b",
    identifier: "LIN-102",
    parentId: "lin-parent",
    title: "Login backend",
  }),
  issue({
    id: "lin-standalone",
    identifier: "LIN-200",
    title: "Documentation",
  }),
  issue({
    id: "lin-done",
    identifier: "LIN-099",
    status: { id: "done", name: "Done", type: "completed" },
    title: "Completed issue",
  }),
];

export class FakeLinearGateway implements LinearGateway {
  async getOrganization() {
    return { id: "linear-test", name: "Linear Test Workspace" };
  }

  async getIssue(id: string) {
    return fakeLinearIssues.find((item) => item.id === id) ?? null;
  }

  async browseIssues(filters: LinearBrowseFilters) {
    const items = fakeLinearIssues.filter((item) => {
      if (!filters.includeDone && item.status.type === "completed")
        return false;
      if (filters.query) {
        const query = filters.query.toLowerCase();
        if (!`${item.identifier} ${item.title}`.toLowerCase().includes(query))
          return false;
      }
      return true;
    });
    return { items, pageInfo: { endCursor: null, hasNextPage: false } };
  }
}

function issue(
  input: Pick<LinearIssue, "id" | "identifier" | "title"> &
    Partial<LinearIssue>,
): LinearIssue {
  return {
    assignee: { id: "user-1", name: "Ana" },
    createdAt: now,
    description: null,
    parentId: null,
    project: { id: "project-1", name: "Rekko" },
    status: { id: "started", name: "In Progress", type: "started" },
    team: { id: "team-1", name: "Product" },
    updatedAt: now,
    url: `https://linear.app/test/issue/${input.identifier}`,
    ...input,
  };
}
