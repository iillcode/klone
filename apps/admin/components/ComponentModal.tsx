"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createComponent,
  updateComponent,
  type ComponentState,
} from "@/app/actions/components";
import type { Category, ComponentRow, SubCategory } from "@/lib/data";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Textarea } from "@repo/ui/textarea";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/dialog";

type Props = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  subCategories: SubCategory[];
  components: ComponentRow[];
  editing?: ComponentRow | null;
};

export default function ComponentModal({
  open,
  onClose,
  categories,
  subCategories,
  components,
  editing,
}: Props) {
  const router = useRouter();
  const action = editing ? updateComponent : createComponent;
  const [state, formAction, pending] = useActionState<ComponentState, FormData>(
    action,
    {}
  );
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [chainId, setChainId] = useState("none");
  const lastStateRef = useRef(state);

  useEffect(() => {
    if (state.ok && state !== lastStateRef.current) {
      lastStateRef.current = state;
      router.refresh();
      onClose();
    }
  }, [state, router, onClose]);

  useEffect(() => {
    if (open) {
      const sub = subCategories.find((s) => s.id === editing?.sub_category_id);
      setCategoryId(sub?.category_id ?? "");
      setSubCategoryId(editing?.sub_category_id ?? "");
      setChainId(editing?.chain_id ? editing.chain_id : "none");
    } else {
      setCategoryId("");
      setSubCategoryId("");
      setChainId("none");
    }
  }, [open, editing, subCategories]);

  const filteredSubs = subCategories.filter((s) => s.category_id === categoryId);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto p-6 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Component" : "New Component"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the component details."
              : "Add a component to the library."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} key={editing?.id ?? "new"} className="space-y-6">
          <input type="hidden" name="id" value={editing?.id ?? ""} />
          <input type="hidden" name="sub_category_id" value={subCategoryId} />
          <input type="hidden" name="chain_id" value={chainId === "none" ? "" : chainId} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={categoryId}
                onValueChange={(v) => {
                  setCategoryId(v ?? "");
                  setSubCategoryId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category…">
                    {(value) => categories.find((c) => c.id === value)?.name ?? ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id} label={c.name}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sub-category</Label>
              <Select value={subCategoryId} onValueChange={(v) => setSubCategoryId(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a sub-category…">
                    {(value) => filteredSubs.find((s) => s.id === value)?.name ?? ""}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {filteredSubs.map((s) => (
                    <SelectItem key={s.id} value={s.id} label={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Component name</Label>
            <Input id="name" name="name" defaultValue={editing?.name ?? ""} placeholder="Gradient Button" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" name="image_url" type="url" defaultValue={editing?.image_url ?? ""} placeholder="https://…" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="demo_url">Demo URL</Label>
              <Input id="demo_url" name="demo_url" type="url" defaultValue={editing?.demo_url ?? ""} placeholder="https://…" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="component_code">Component code</Label>
            <Textarea
              id="component_code"
              name="component_code"
              rows={6}
              className="font-mono"
              defaultValue={editing?.component_code ?? ""}
              placeholder="<button>…</button>"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              name="prompt"
              rows={3}
              defaultValue={editing?.prompt ?? ""}
              placeholder="Describe how this component should be used…"
            />
          </div>

          <div className="space-y-2">
            <Label>Chain (linked component)</Label>
            <Select
              value={chainId}
              onValueChange={(v) => setChainId(v ?? "none")}
            >
              <SelectTrigger>
                <SelectValue placeholder="None">
                  {(value) =>
                    value === "none"
                      ? "None"
                      : components.find((c) => c.id === value)?.name ?? ""
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" label="None">None</SelectItem>
                {components.map((c) => (
                  <SelectItem key={c.id} value={c.id} label={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {state.error && (
            <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Save component"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
