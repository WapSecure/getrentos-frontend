import math, sys, copy
from icons import ICONS, ORDER
SW = 1.75
STROKE = f'fill="none" stroke="currentColor" stroke-width="{SW}" stroke-linecap="round" stroke-linejoin="round"'

def chamfer_rect(x, y, w, h, r, c):
    """Rounded rect whose top-right corner is cut at 45 degrees (the set's signature corner)."""
    return (f'M{x+r} {y}H{x+w-c}L{x+w} {y+c}V{y+h-r}A{r} {r} 0 0 1 {x+w-r} {y+h}'
            f'H{x+r}A{r} {r} 0 0 1 {x} {y+h-r}V{y+r}A{r} {r} 0 0 1 {x+r} {y}Z')

def gap_ring(cx, cy, r, start=-62, end=-28):
    """Circle outline with a break at the upper right, like a live progress ring."""
    a0, a1 = math.radians(end), math.radians(start + 360)
    x0, y0 = cx + r*math.cos(a0), cy + r*math.sin(a0)
    x1, y1 = cx + r*math.cos(a1), cy + r*math.sin(a1)
    return f'M{x0:.2f} {y0:.2f}A{r} {r} 0 1 1 {x1:.2f} {y1:.2f}', (cx + r*math.cos(math.radians((start+end)/2)), cy + r*math.sin(math.radians((start+end)/2)))

def attrs(a): return ' '.join(f'{k}="{v}"' for k, v in a.items())

def render(name, opt):
    out = []
    tint_off = opt.get('offset', 0)
    tint = f'fill="currentColor" fill-opacity="{opt.get("duo", .16)}"' + (f' transform="translate({tint_off} {tint_off})"' if tint_off else '')
    for tag, a, role in ICONS[name]:
        if role == 'dot':
            if opt.get('pixel'):
                s = a['r'] * 1.9
                out.append(f'<rect x="{a["cx"]-s/2:.2f}" y="{a["cy"]-s/2:.2f}" width="{s:.2f}" height="{s:.2f}" rx="{s*0.18:.2f}" fill="currentColor"/>')
            else:
                out.append(f'<circle {attrs(a)} fill="currentColor"/>')
            continue
        geo = f'<{tag} {attrs(a)}'
        if tag == 'rect' and opt.get('chamfer') and name not in opt.get('nocut', ()):
            geo = f'<path d="{chamfer_rect(a["x"], a["y"], a["width"], a["height"], a["rx"], 3.6)}"'
        if role in ('duo', 'shape'):
            out.append(f'{geo} {tint}/>')
        if role in ('line', 'shape'):
            if tag == 'circle' and role == 'shape' and a['r'] >= 6 and opt.get('ring'):
                d, (px, py) = gap_ring(a['cx'], a['cy'], a['r'])
                out.append(f'<path d="{d}" {STROKE}/>')
                s = 1.9
                out.append(f'<rect x="{px-s/2:.2f}" y="{py-s/2:.2f}" width="{s}" height="{s}" rx=".35" fill="currentColor" transform="rotate(45 {px:.2f} {py:.2f})"/>')
            else:
                out.append(f'{geo} {STROKE}/>')
    return ''.join(out)

ARROWS2 = {
    'ArrowRight': "pix(3.6,12) P('M6.25 12H7.25') P('M10 12H19.75') P('M14.25 6.5L19.75 12L14.25 17.5')",
}
def sheet(names, opt, scale, fn, cols=8):
    cell = 24*scale + 40; rows = (len(names)+cols-1)//cols
    W, H = cols*cell, rows*(cell+16)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}"><rect width="100%" height="100%" fill="#fff"/>']
    for i, n in enumerate(names):
        x, y = (i%cols)*cell+20, (i//cols)*(cell+16)+14
        o.append(f'<g transform="translate({x} {y}) scale({scale})" color="#0057d9">{render(n, opt)}</g>')
        o.append(f'<text x="{x}" y="{y+24*scale+16}" font-family="Helvetica" font-size="12" fill="#555">{n}</text>')
    o.append('</svg>'); open(fn, 'w').write(''.join(o))
