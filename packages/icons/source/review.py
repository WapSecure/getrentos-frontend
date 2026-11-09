"""Usage: python3 review.py N   -> renders batchN.py to batchN.svg.png (blue, 3x) and batchN-small.svg.png (real 20/24px, dark)."""
import sys, importlib, subprocess
import icons
from render2 import sheet, render
n = sys.argv[1]
mod = importlib.import_module(f'batch{n}')
icons.ICONS.update(mod.ICONS)
names = list(mod.ICONS)
OPT = dict(pixel=True, ring=True, chamfer=True, nocut=getattr(mod, 'NOCUT', ()))
ref = ['ArrowRight', 'CheckCircle2', 'Lock', 'Bell']  # approved references, first row
sheet(ref + names, OPT, 3, f'batch{n}.svg')
# real-size strip
cols = 16; rows = (len(names) + cols - 1) // cols
o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{cols*44+20}" height="{rows*44+20}"><rect width="100%" height="100%" fill="#1c1c1e"/>']
for i, nm in enumerate(names):
    x, y = (i % cols) * 44 + 20, (i // cols) * 44 + 20
    o.append(f'<g transform="translate({x} {y})" color="#f5f5f7">{render(nm, OPT)}</g>')
o.append('</svg>'); open(f'batch{n}-small.svg', 'w').write(''.join(o))
subprocess.run(['qlmanage', '-t', '-s', '1800', '-o', '.', f'batch{n}.svg', f'batch{n}-small.svg'], capture_output=True)
print('drawn', len(names))
