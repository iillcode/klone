import Link from "next/link";
import { verifySession } from "@/lib/auth";
import { getTemplates } from "@/lib/data";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@repo/ui/button";
import { Badge } from "@repo/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";

export default async function TemplatesPage() {
  await verifySession();
  const templates = await getTemplates();

  return (
    <div className="mx-auto w-full lg:w-3/4">
      <PageHeader
        title="Templates"
        description={`${templates.length} template${templates.length === 1 ? "" : "s"} in the library`}
        actions={
          <Link className={buttonVariants()} href="/dashboard/templates/new">
            + New template
          </Link>
        }
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Template
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Blocks
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Updated
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => {
              const legacySections = (
                t.blueprint as unknown as { sections?: unknown[] }
              )?.sections;
              const blocks =
                Array.isArray(t.blueprint?.components) &&
                t.blueprint.components.length
                  ? t.blueprint.components.length
                  : Array.isArray(legacySections)
                    ? legacySections.length
                    : 0;
              return (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {t.name}
                      </p>
                      <p className="truncate font-mono text-xs text-muted-foreground">
                        {t.slug}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {t.category ? (
                      <Badge variant="secondary">{t.category}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {blocks}
                  </TableCell>
                  <TableCell>
                    {t.is_active ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/dashboard/templates/${t.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                    >
                      Edit
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {templates.length === 0 && (
          <EmptyState
            title="No templates yet."
            description="Create your first template to get started."
          />
        )}
      </div>
    </div>
  );
}