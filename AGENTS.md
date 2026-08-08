# Klone — Agent Instructions

## Git policy (MANDATORY)

- **Never commit changes to git.**
- **Never push anything to a remote git repository.**
- Do not run `git commit`, `git push`, `git add && git commit`, or any
  equivalent that stages/commits/pushes changes — unless the user explicitly
  asks for it in the current request.
- Leave all work as uncommitted working-tree changes so the user can review
  and commit themselves.
- If a workflow step says "commit" (e.g. design docs or plans), skip that
  step and note it instead.

## Workspace layout

- pnpm + Turborepo monorepo: `apps/web`, `apps/admin`, `apps/mcp`,
  `packages/ui`, `docs/`, `scripts/`.
- Editor code lives in `apps/web/components/editor/` (React parent +
  `editor-iframe.ts` vanilla-JS script injected into a sandboxed preview
  iframe; message-protocol based, see the spec in
  `docs/superpowers/specs/2026-08-07-multipage-editor-design.md`).
