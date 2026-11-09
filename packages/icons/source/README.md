# Icon sources

The Sureground icon set is drawn here as data and baked into `../src` by `gen.py`.

- `STYLE.md`: the drawing rules. Read it before adding an icon.
- `icons.py`: helpers and the 51 reference icons. `batch1.py`..`batch7.py`: the rest (batch7: navigation markers).
- `names.json`: exported names; names in one list share a glyph (e.g. `CheckCircle` / `CircleCheck`).

Add an icon: draw it in a batch file, add its name to `names.json`, run `python3 review.py <batch>`
to render a review sheet (macOS `qlmanage`), then `python3 gen.py ..` and commit both the source and
the generated `src/` files.
