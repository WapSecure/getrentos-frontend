# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Icons

Use `@sureground/icons` (web) or `@sureground/icons/native` (mobile): our own icon set,
same names as Lucide. Never import `lucide-react` / `lucide-react-native` (lint fails).
After rebasing a branch that still imports Lucide, run `pnpm icons:migrate`. Need a new
icon? Add it to the set in the same style (see docs/product-design-system.md, Icons).
