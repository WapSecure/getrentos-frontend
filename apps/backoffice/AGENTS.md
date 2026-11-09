<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## Icons

Use `@sureground/icons` (web) or `@sureground/icons/native` (mobile): our own icon set,
same names as Lucide. Never import `lucide-react` / `lucide-react-native` (lint fails).
After rebasing a branch that still imports Lucide, run `pnpm icons:migrate`. Need a new
icon? Add it to the set in the same style (see docs/product-design-system.md, Icons).
