import { describe, expect, it, vi } from "vitest";

import { HttpLinearGateway, LinearProviderError } from "./gateway";

const issue = {
  assignee: { id: "user-1", name: "Ada" },
  createdAt: "2026-01-01T00:00:00.000Z",
  description: "Estimativa\n30m",
  id: "issue-1",
  identifier: "ENG-1",
  parent: { id: "parent-1" },
  project: { id: "project-1", name: "App" },
  state: { id: "state-1", name: "Started", type: "started" },
  team: { id: "team-1", name: "Engineering" },
  title: "Build",
  updatedAt: "2026-01-02T00:00:00.000Z",
  url: "https://linear.app/acme/issue/ENG-1",
};

describe("HttpLinearGateway", () => {
  it("maps the provider DTO and sends pagination and provider filters", async () => {
    const request = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.variables.after).toBe("cursor");
        expect(body.variables.filter.team.id.eq).toBe("team-1");
        expect(body.variables.filter.state.type.nin).toEqual([
          "completed",
          "canceled",
        ]);
        return new Response(
          JSON.stringify({
            data: {
              issues: {
                nodes: [issue],
                pageInfo: { endCursor: "next", hasNextPage: true },
              },
            },
          }),
          { status: 200 },
        );
      },
    );
    const page = await new HttpLinearGateway("token", request).browseIssues({
      after: "cursor",
      teamId: "team-1",
    });
    expect(page.items[0]).toMatchObject({
      id: "issue-1",
      parentId: "parent-1",
      status: { type: "started" },
    });
    expect(page.pageInfo.hasNextPage).toBe(true);
  });

  it("represents rate limiting without leaking provider payloads", async () => {
    const request = vi.fn(async () => new Response("{}", { status: 429 }));
    await expect(
      new HttpLinearGateway("token", request).browseIssues({}),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
    } satisfies Partial<LinearProviderError>);
  });
});
