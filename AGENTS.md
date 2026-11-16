# Working in this repo

## Comments

Write a comment only when the code cannot say it: a non-obvious reason, constraint, workaround or trap.
One line, saying why, not what. No restating the code, no section banners, no ticket or phase tags
(`AU-03`, `M4`, `#118`), no change history ("now", "previously", "added"), no commented-out code, and no
JSDoc that only repeats names and types. When in doubt, leave it out; a clearer name usually does the job.
Lint and tool directives (`eslint-disable`, `@ts-expect-error`, `prettier-ignore`, `'use client'`) are code,
not comments, and stay.
