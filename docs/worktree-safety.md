# Worktree safety gate

Run this before starting any feature or audit work:

```bash
pnpm preflight:feature
```

The command stops unless the target is a clean, isolated linked worktree whose `HEAD` exactly
matches `origin/dev`. Create or refresh the worktree before editing if it fails.

After pushing to `origin/dev` and fast-forwarding the primary local `dev` checkout, run:

```bash
pnpm validate:dev-sync
```

This second command stops unless local `dev` is clean and exactly matches `origin/dev`, then runs
the web TypeScript check again from the synchronized primary checkout. A feature is not considered
fully integrated until this command passes.

Do not perform feature edits directly in the primary checkout. If unexpected changes appear there,
back them up with `git diff --binary --output=<patch>` before restoring or investigating them.
