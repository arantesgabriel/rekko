export type LinearIssue = {
  assignee: { id: string; name: string } | null;
  createdAt: string;
  description: string | null;
  id: string;
  identifier: string;
  parentId: string | null;
  project: { id: string; name: string } | null;
  status: { id: string; name: string; type: string };
  team: { id: string; name: string };
  title: string;
  updatedAt: string;
  url: string;
};

export type LinearPage<T> = {
  items: T[];
  pageInfo: { endCursor: string | null; hasNextPage: boolean };
};

export type LinearBrowseFilters = {
  after?: string;
  assigneeId?: string;
  includeDone?: boolean;
  projectId?: string;
  query?: string;
  statusId?: string;
  teamId?: string;
};

export interface LinearGateway {
  browseIssues(filters: LinearBrowseFilters): Promise<LinearPage<LinearIssue>>;
  getIssue(id: string): Promise<LinearIssue | null>;
  getOrganization(): Promise<{ id: string; name: string }>;
}

export type LinearProviderErrorCode =
  | "AUTH_REVOKED"
  | "RATE_LIMITED"
  | "NOT_FOUND"
  | "PERMISSION_DENIED"
  | "NETWORK_ERROR"
  | "GRAPHQL_ERROR"
  | "INVALID_PAYLOAD";

export class LinearProviderError extends Error {
  constructor(readonly code: LinearProviderErrorCode) {
    super(code);
  }
}

const issueFields = `
  id identifier title description url createdAt updatedAt
  parent { id }
  team { id name }
  project { id name }
  state { id name type }
  assignee { id name }
`;

export class HttpLinearGateway implements LinearGateway {
  constructor(
    private readonly accessToken: string,
    private readonly request: typeof fetch = fetch,
  ) {}

  async getOrganization() {
    const data = await this.graphql<{
      organization: { id: string; name: string };
    }>(`query Organization { organization { id name } }`, {});
    return data.organization;
  }

  async browseIssues(filters: LinearBrowseFilters) {
    const filter: Record<string, unknown> = {};
    if (filters.query)
      filter.or = [
        { title: { containsIgnoreCase: filters.query } },
        { identifier: { containsIgnoreCase: filters.query } },
      ];
    if (filters.teamId) filter.team = { id: { eq: filters.teamId } };
    if (filters.projectId) filter.project = { id: { eq: filters.projectId } };
    if (filters.statusId) filter.state = { id: { eq: filters.statusId } };
    if (filters.assigneeId)
      filter.assignee = { id: { eq: filters.assigneeId } };
    if (!filters.includeDone)
      filter.state = {
        ...(filter.state as object | undefined),
        type: { nin: ["completed", "canceled"] },
      };
    const data = await this.graphql<{
      issues: {
        nodes: LinearIssueResponse[];
        pageInfo: { endCursor: string | null; hasNextPage: boolean };
      };
    }>(
      `query BrowseIssues($after: String, $filter: IssueFilter) {
        issues(first: 30, after: $after, filter: $filter, orderBy: updatedAt) {
          nodes { ${issueFields} }
          pageInfo { endCursor hasNextPage }
        }
      }`,
      { after: filters.after, filter },
    );
    return {
      items: data.issues.nodes.map(mapIssue),
      pageInfo: data.issues.pageInfo,
    };
  }

  async getIssue(id: string) {
    try {
      const data = await this.graphql<{ issue: LinearIssueResponse }>(
        `query Issue($id: String!) { issue(id: $id) { ${issueFields} } }`,
        { id },
      );
      return mapIssue(data.issue);
    } catch (error) {
      if (error instanceof LinearProviderError && error.code === "NOT_FOUND")
        return null;
      throw error;
    }
  }

  private async graphql<T>(query: string, variables: object): Promise<T> {
    let response: Response;
    try {
      response = await this.request("https://api.linear.app/graphql", {
        body: JSON.stringify({ query, variables }),
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      });
    } catch {
      throw new LinearProviderError("NETWORK_ERROR");
    }
    if (response.status === 401) throw new LinearProviderError("AUTH_REVOKED");
    if (response.status === 403)
      throw new LinearProviderError("PERMISSION_DENIED");
    const body = (await response.json().catch(() => null)) as {
      data?: T;
      errors?: { extensions?: { code?: string } }[];
    } | null;
    const code = body?.errors?.[0]?.extensions?.code;
    if (response.status === 429 || code === "RATELIMITED")
      throw new LinearProviderError("RATE_LIMITED");
    if (code === "ENTITY_NOT_FOUND") throw new LinearProviderError("NOT_FOUND");
    if (!response.ok || body?.errors?.length)
      throw new LinearProviderError("GRAPHQL_ERROR");
    if (!body?.data) throw new LinearProviderError("INVALID_PAYLOAD");
    return body.data;
  }
}

type LinearIssueResponse = Omit<LinearIssue, "parentId" | "status"> & {
  parent: { id: string } | null;
  state: LinearIssue["status"];
};

function mapIssue(issue: LinearIssueResponse): LinearIssue {
  return {
    ...issue,
    parentId: issue.parent?.id ?? null,
    status: issue.state,
  };
}
