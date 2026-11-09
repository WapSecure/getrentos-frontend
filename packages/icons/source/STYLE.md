# Sureground icon style (approved 2026-11-09)

Reference implementation: `icons.py` (51 approved icons, helper functions) and `render2.py` (how roles render).
Render `python3 review.py <n>` to compare against the reference icons.

## Grid

- viewBox 0 0 24 24. Live area 2..22 (keep strokes inside 2.75..21.25 so 1.75 stroke stays inside 2..22).
- Stroke 1.75, round caps, round joins. Optical centre: balance visual weight around (12,12).
- Coordinates on a 0.25 grid where possible.

## Roles (4th tuple member) - use the helpers from icons.py: P(d, role), C(cx, cy, r, role), R(x, y, w, h, rx, role), dot(cx, cy, r)

- `line` : stroke only. Details, lines, handles, strokes inside shapes.
- `shape` : the main body/container: stroke + 16% tint fill. Most icons have exactly ONE shape (sometimes two for two-object icons). Never tint thin details.
- `duo` : tint only, no stroke (rare; when the outline is drawn as separate open paths, see Home).
- `dot` : rendered as a small SQUARE PIXEL (side = 1.9\*r). Use r 0.8-1.2. Use for live/data details: indicator lights, data points, status, typing dots, keyholes, sensor points.

## Signature details (these make the set ours; apply consistently)

1. **Data-stream arrows**: any arrow that moves (arrow icons, arrows inside download/upload/refresh/send/export/log-in/log-out/redo/undo etc.) gets a trailing pixel + short dash + gap before the shaft, like ArrowRight: `dot(3.5,12,.8), P('M6.25 12H7'), P('M9.75 12H19.75')` + head. When space is tight, the trail may be just one short dash. Arrowheads are right-angle open heads (each side 5.5 long in a full arrow, ~4 in small ones). Chevrons stay plain (no trail).
2. **Live rings**: a circle used as a container (role shape, r >= 6) is automatically drawn with a gap + diamond at upper right by the renderer. So keep container circles as C(..., 'shape') with r >= 6 and keep the upper-right area (around -45 degrees) free of other strokes.
3. **Signature corner**: R(..., 'shape') rectangles are automatically cut at 45 degrees on the TOP-RIGHT corner (3.6 cut). Keep the top-right corner of container rects free of details. If a rect's top-right must stay round (something attaches there), list the icon name in `NOCUT = (...)` in your batch file.
4. Corner radii: 3 on large containers (>=14 wide), 2 on medium, 1 on small parts. Never sharp corners except the signature cut and arrowheads.
5. Keep it clean: 2-6 elements typically. Prefer fewer, bolder parts. No tiny details under ~1.5 units apart (they blur at 16px).

## Originality

Draw your own geometry. Use the approved icons as the family resemblance.

## Output

Write `batchN.py`:

```python
from icons import P, C, R, dot, star, gear  # helpers
NOCUT = ()
ICONS = {
    'Name': [ ... ],
}
```

Keys = the exact names in `batchN.todo` (first column). Second column is the Lucide glyph name, for meaning only.
