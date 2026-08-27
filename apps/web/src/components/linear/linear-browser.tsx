import { LinearImportTree } from "./linear-import-tree";
import { browseLinearIssues } from "@/modules/integrations/linear/service";

export async function LinearBrowser({
  action,
  existingProjectId,
  query,
  slug,
  userId,
}: {
  action: (formData: FormData) => void | Promise<void>;
  existingProjectId?: string;
  query: Record<string, string | string[] | undefined>;
  slug: string;
  userId: string;
}) {
  const value = (key: string) =>
    typeof query[key] === "string" ? query[key] : undefined;
  const filters = Object.fromEntries(
    [
      ["after", value("after")],
      ["assigneeId", value("assignee")],
      ["projectId", value("linearProject")],
      ["query", value("q")],
      ["statusId", value("status")],
      ["teamId", value("team")],
    ].filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
  const page = await browseLinearIssues({
    filters,
    slug,
    userId,
  });
  const unique = <T extends { id: string; name: string }>(
    items: (T | null)[],
  ) => [
    ...new Map(
      items
        .filter((item): item is T => Boolean(item))
        .map((item) => [item.id, item]),
    ).values(),
  ];
  const teams = unique(page.items.map((item) => item.team));
  const projects = unique(page.items.map((item) => item.project));
  const statuses = unique(page.items.map((item) => item.status));
  const assignees = unique(page.items.map((item) => item.assignee));
  return (
    <>
      <form className="linear-filters">
        <input
          defaultValue={value("q")}
          name="q"
          placeholder="Buscar no Linear…"
        />
        <Filter
          name="team"
          label="Time"
          options={teams}
          value={value("team")}
        />
        <Filter
          name="linearProject"
          label="Projeto"
          options={projects}
          value={value("linearProject")}
        />
        <Filter
          name="status"
          label="Status"
          options={statuses}
          value={value("status")}
        />
        <Filter
          name="assignee"
          label="Responsável"
          options={assignees}
          value={value("assignee")}
        />
        <button className="button button--secondary" type="submit">
          Filtrar
        </button>
      </form>
      <LinearImportTree
        action={action}
        {...(existingProjectId ? { existingProjectId } : {})}
        issues={page.items}
        projectNameRequired={!existingProjectId}
      />
      {page.pageInfo.hasNextPage && page.pageInfo.endCursor ? (
        <a
          className="button button--secondary"
          href={`?source=linear&after=${encodeURIComponent(page.pageInfo.endCursor)}`}
        >
          Carregar mais
        </a>
      ) : null}
    </>
  );
}

function Filter({
  label,
  name,
  options,
  value,
}: {
  label: string;
  name: string;
  options: { id: string; name: string }[];
  value?: string | undefined;
}) {
  return (
    <label className="field field--compact">
      <span>{label}</span>
      <select defaultValue={value ?? ""} name={name}>
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
