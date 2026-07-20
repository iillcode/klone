"use client";

import { useMemo, useState } from "react";
import ComponentModal from "@/components/ComponentModal";
import type { Category, ComponentRow, SubCategory } from "@/lib/data";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Badge } from "@repo/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/table";

type Props = {
  categories: Category[];
  subCategories: SubCategory[];
  components: ComponentRow[];
};

type Row = ComponentRow & {
  categoryId: string;
  categoryName: string;
  subCategoryName: string;
};

export default function ComponentsManager({
  categories,
  subCategories,
  components,
}: Props) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ComponentRow | null>(null);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [subCategoryId, setSubCategoryId] = useState("all");

  const rows = useMemo<Row[]>(() => {
    const subCat = new Map(subCategories.map((s) => [s.id, s]));
    const cat = new Map(categories.map((c) => [c.id, c]));
    return components.map((c) => {
      const s = subCat.get(c.sub_category_id);
      const category = s ? cat.get(s.category_id) : undefined;
      return {
        ...c,
        categoryId: s?.category_id ?? "",
        categoryName: category?.name ?? "—",
        subCategoryName: s?.name ?? "—",
      };
    });
  }, [components, subCategories, categories]);

  const availableSubs = useMemo(
    () =>
      categoryId === "all"
        ? subCategories
        : subCategories.filter((s) => s.category_id === categoryId),
    [subCategories, categoryId]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesSearch = !q || r.name.toLowerCase().includes(q);
      const matchesCategory = categoryId === "all" || r.categoryId === categoryId;
      const matchesSub =
        subCategoryId === "all" || r.sub_category_id === subCategoryId;
      return matchesSearch && matchesCategory && matchesSub;
    });
  }, [rows, search, categoryId, subCategoryId]);

  return (
    <div>
      <PageHeader
        title="Components"
        description={`Showing ${filtered.length} of ${rows.length}`}
        actions={
          <>
            <div className="relative">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m21 21-4.3-4.3" strokeLinecap="round" />
              </svg>
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search components…"
                className="w-48 pl-9"
              />
            </div>

            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v ?? "");
                setSubCategoryId("all");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories">
                  {(value) =>
                    value === "all"
                      ? "All categories"
                      : categories.find((c) => c.id === value)?.name ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="All categories">All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={subCategoryId} onValueChange={(v) => setSubCategoryId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder="All sub-categories">
                  {(value) =>
                    value === "all"
                      ? "All sub-categories"
                      : availableSubs.find((s) => s.id === value)?.name ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" label="All sub-categories">All sub-categories</SelectItem>
                {availableSubs.map((s) => (
                  <SelectItem key={s.id} value={s.id} label={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={() => { setEditing(null); setOpen(true); }}>+ New component</Button>
          </>
        }
      />

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Component
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Category
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Demo
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Chain
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Created
              </TableHead>
              <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={r.image_url}
                        alt={r.name}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        ∅
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {r.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.subCategoryName}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.categoryName}
                </TableCell>
                <TableCell>
                  {r.demo_url ? (
                    <a
                      href={r.demo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Open
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {r.chain_id ? (
                    <Badge variant="secondary">Chained</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filtered.length === 0 && (
          <EmptyState title="No components match your filters." />
        )}
      </div>

      <ComponentModal
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        subCategories={subCategories}
        components={components}
        editing={editing}
      />
    </div>
  );
}
