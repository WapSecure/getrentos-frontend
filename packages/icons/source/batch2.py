import math
from icons import P, C, R, dot, star, gear  # helpers

NOCUT = ()


def f(v):
    return f'{v:.2f}'.rstrip('0').rstrip('.')


def rr(x, y, w, h, r, role='line'):
    """Rounded rect as a path (no signature cut) for small parts."""
    return P(f'M{f(x+r)} {f(y)}H{f(x+w-r)}A{r} {r} 0 0 1 {f(x+w)} {f(y+r)}V{f(y+h-r)}A{r} {r} 0 0 1 {f(x+w-r)} {f(y+h)}'
             f'H{f(x+r)}A{r} {r} 0 0 1 {f(x)} {f(y+h-r)}V{f(y+r)}A{r} {r} 0 0 1 {f(x+r)} {f(y)}Z', role)


def cut_rect_d(x0, y0, x1, y1, r=3, c=3.6):
    return (f'M{f(x0+r)} {f(y0)}H{f(x1-c)}L{f(x1)} {f(y0+c)}V{f(y1-r)}A{r} {r} 0 0 1 {f(x1-r)} {f(y1)}'
            f'H{f(x0+r)}A{r} {r} 0 0 1 {f(x0)} {f(y1-r)}V{f(y0+r)}A{r} {r} 0 0 1 {f(x0+r)} {f(y0)}Z')


# ---------- clipboard: tinted board, outline broken where the clip sits ----------
def board(x0=4.75, y0=4.75, x1=19.25, y1=21.25, cl=9.5, cr=14.5, right_gap=None):
    c = 3.6
    out = [P(cut_rect_d(x0, y0, x1, y1), 'duo')]
    left = (f'H{f(x0+3)}A3 3 0 0 1 {f(x0)} {f(y1-3)}V{f(y0+3)}A3 3 0 0 1 {f(x0+3)} {f(y0)}H{f(cl)}')
    if right_gap:
        g0, g1 = right_gap
        out.append(P(f'M{f(cr)} {f(y0)}H{f(x1-c)}L{f(x1)} {f(y0+c)}V{f(g0)}'))
        out.append(P(f'M{f(x1)} {f(g1)}V{f(y1-3)}A3 3 0 0 1 {f(x1-3)} {f(y1)}' + left))
    else:
        out.append(P(f'M{f(cr)} {f(y0)}H{f(x1-c)}L{f(x1)} {f(y0+c)}V{f(y1-3)}A3 3 0 0 1 {f(x1-3)} {f(y1)}' + left))
    out.append(rr(cl, y0 - 2, cr - cl, 4, 1))
    return out


# ---------- files: same body + fold as the approved FileText ----------
X0, Y0, X1, Y1, FD = 4.75, 2.75, 19.25, 21.25, 5.5
FILE_D = (f'M6.75 2.75H13.75L19.25 8.25V19.25A2 2 0 0 1 17.25 21.25H6.75A2 2 0 0 1 4.75 19.25V4.75A2 2 0 0 1 6.75 2.75Z')
FOLD = P('M13.75 2.75V6.25A2 2 0 0 0 15.75 8.25H19.25')


def file_full():
    return [P(FILE_D, 'shape'), FOLD]


def file_open_br(gx, gy, role='line'):
    """Outline with the bottom-right corner left open for a badge."""
    return [P(f'M{f(gx)} 21.25H6.75A2 2 0 0 1 4.75 19.25V4.75A2 2 0 0 1 6.75 2.75H13.75L19.25 8.25V{f(gy)}', role), FOLD]


def file_open_bl(gx, gy):
    """Outline with the bottom-left corner left open for a mark; tint is notched cleanly."""
    o = f'M4.75 {f(gy)}V4.75A2 2 0 0 1 6.75 2.75H13.75L19.25 8.25V19.25A2 2 0 0 1 17.25 21.25H{f(gx)}'
    return [P(FILE_D, 'duo'), P(o), FOLD]


# ---------- pen (shared by Edit2 and FileEdit) ----------
def pen(tx, ty, length, w, role='shape'):
    d = (1 / math.sqrt(2), -1 / math.sqrt(2))
    n = (1 / math.sqrt(2), 1 / math.sqrt(2))
    h = w / 2
    nl = w * 0.85
    nb = (tx + d[0] * nl, ty + d[1] * nl)
    L0 = (nb[0] + n[0] * h, nb[1] + n[1] * h)
    R0 = (nb[0] - n[0] * h, nb[1] - n[1] * h)
    bl = length - nl - h
    L1 = (L0[0] + d[0] * bl, L0[1] + d[1] * bl)
    R1 = (R0[0] + d[0] * bl, R0[1] + d[1] * bl)
    p = lambda q: f'{f(q[0])} {f(q[1])}'
    return [P(f'M{p((tx, ty))}L{p(L0)}L{p(L1)}A{f(h)} {f(h)} 0 0 0 {p(R1)}L{p(R0)}Z', role),
            P(f'M{p(L0)}L{p(R0)}')]


# ---------- cloud: union of circles on a flat base ----------
def upper_ix(c1, c2):
    (x1, y1, r1), (x2, y2, r2) = c1, c2
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy)
    a = (r1 * r1 - r2 * r2 + d * d) / (2 * d)
    hh = math.sqrt(r1 * r1 - a * a)
    mx, my = x1 + a * dx / d, y1 + a * dy / d
    pts = [(mx + hh * dy / d, my - hh * dx / d), (mx - hh * dy / d, my + hh * dx / d)]
    return min(pts, key=lambda q: q[1])


def cloud_d(circles, base):
    pts = [(circles[0][0], base)]
    for a, b in zip(circles, circles[1:]):
        pts.append(upper_ix(a, b))
    pts.append((circles[-1][0], base))
    d = f'M{f(pts[0][0])} {f(pts[0][1])}'
    for (cx, cy, r), s, e in zip(circles, pts, pts[1:]):
        a0 = math.degrees(math.atan2(s[1] - cy, s[0] - cx)) % 360
        a1 = math.degrees(math.atan2(e[1] - cy, e[0] - cx)) % 360
        span = (a1 - a0) % 360
        d += f'A{f(r)} {f(r)} 0 {1 if span > 180 else 0} 1 {f(e[0])} {f(e[1])}'
    return d + 'Z'


CLOUD = [(7.25, 14.75, 4.5), (12.25, 10.25, 6), (17, 15, 4.25)]


# ---------- drop ----------
def drop_d(cx, tip, cy, r):
    dd = cy - tip
    phi = math.degrees(math.acos(r / dd))
    a1, a2 = math.radians(-90 + phi), math.radians(270 - phi)
    p1 = (cx + r * math.cos(a1), cy + r * math.sin(a1))
    p2 = (cx + r * math.cos(a2), cy + r * math.sin(a2))
    return f'M{f(cx)} {f(tip)}L{f(p1[0])} {f(p1[1])}A{f(r)} {f(r)} 0 1 1 {f(p2[0])} {f(p2[1])}Z'


def arc(cx, cy, r, a0, a1):
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    large = 1 if (a1 - a0) % 360 > 180 else 0
    return P(f'M{f(x0)} {f(y0)}A{f(r)} {f(r)} 0 {large} 1 {f(x1)} {f(y1)}')


EYE_D = 'M2.75 12C4.9 7.65 8.2 5.5 12 5.5C15.8 5.5 19.1 7.65 21.25 12C19.1 16.35 15.8 18.5 12 18.5C8.2 18.5 4.9 16.35 2.75 12Z'


# ---------- "off" icons: outline is broken where the slash crosses it ----------
def cloud_pts(circles, base):
    pts = [(circles[0][0], base)]
    for a, b in zip(circles, circles[1:]):
        pts.append(upper_ix(a, b))
    pts.append((circles[-1][0], base))
    out = []
    for (cx, cy, r), s, e in zip(circles, pts, pts[1:]):
        a0 = math.atan2(s[1] - cy, s[0] - cx)
        a1 = math.atan2(e[1] - cy, e[0] - cx)
        span = (a1 - a0) % (2 * math.pi)
        n = max(4, int(span / math.radians(3)))
        out += [(cx + r * math.cos(a0 + span * i / n), cy + r * math.sin(a0 + span * i / n)) for i in range(n)]
    x0, x1 = circles[-1][0], circles[0][0]
    out += [(x0 + (x1 - x0) * i / 20, base) for i in range(21)]
    return out


def cubic_pts(start, segs, n=24):
    out, p0 = [start], start
    for c1, c2, p3 in segs:
        for i in range(1, n + 1):
            t = i / n; u = 1 - t
            out.append((u**3*p0[0] + 3*u*u*t*c1[0] + 3*u*t*t*c2[0] + t**3*p3[0],
                        u**3*p0[1] + 3*u*u*t*c1[1] + 3*u*t*t*c2[1] + t**3*p3[1]))
        p0 = p3
    return out


def broken(pts, a, b, gap=2.1, closed=True):
    (ax, ay), (bx, by) = a, b
    L2 = (bx - ax) ** 2 + (by - ay) ** 2
    def dist(p):
        t = max(0, min(1, ((p[0] - ax) * (bx - ax) + (p[1] - ay) * (by - ay)) / L2))
        return math.hypot(p[0] - ax - t * (bx - ax), p[1] - ay - t * (by - ay))
    keep = [dist(p) > gap for p in pts]
    if closed and all(keep):
        return [P('M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in pts) + 'Z')]
    # rotate so we start at a cut
    i0 = keep.index(False) if closed else 0
    seq = list(zip(pts[i0:] + pts[:i0], keep[i0:] + keep[:i0])) if closed else list(zip(pts, keep))
    runs, cur = [], []
    for p, k in seq:
        if k:
            cur.append(p)
        elif cur:
            runs.append(cur); cur = []
    if cur:
        runs.append(cur)
    return [P('M' + 'L'.join(f'{f(x)} {f(y)}' for x, y in r)) for r in runs if len(r) > 1]


EYE_PTS = cubic_pts((2.75, 12), [((4.9, 7.65), (8.2, 5.5), (12, 5.5)), ((15.8, 5.5), (19.1, 7.65), (21.25, 12)),
                                  ((19.1, 16.35), (15.8, 18.5), (12, 18.5)), ((8.2, 18.5), (4.9, 16.35), (2.75, 12))])[:-1]
SLASH = ((3.75, 3.75), (20.25, 20.25))

ICONS = {
    'Clipboard': board(),
    'ClipboardCheck': board() + [P('M8.75 13.5L11 15.75L15.25 11.25')],
    'ClipboardList': board() + [dot(8.5, 11.25, .9), P('M11 11.25H15.5'), dot(8.5, 15.75, .9), P('M11 15.75H15.5')],
    'ClipboardPaste': board(3.75, 4.75, 16.25, 21.25, 7.5, 12.5, right_gap=(12, 18)) + [
        P('M20.25 15H20.5'), P('M18 15H9.25'), P('M12.25 12L9.25 15L12.25 18')],
    'ClipboardPlus': board() + [P('M12 10.75V17.25'), P('M8.75 14H15.25')],
    'Clock3': [C(12, 12, 9.25, 'shape'), P('M12 7.25V12H15.75')],
    'Cloud': [P(cloud_d(CLOUD, 19.25), 'shape')],
    'CloudOff': [P(cloud_d(CLOUD, 19.25), 'duo')] + broken(cloud_pts(CLOUD, 19.25), *SLASH) + [P('M3.75 3.75L20.25 20.25')],
    'Cog': [P(gear(12, 12, 9.5, 7.5, 10, 0.44), 'shape'), C(12, 12, 3)],
    'Coins': [P('M9.1 9.1A5.9 5.9 0 1 1 14.9 14.9'), C(9, 15, 5.9, 'shape'), C(9, 15, 2.9), dot(9, 15, .75)],
    'Columns3': [R(3.75, 3.75, 16.5, 16.5, 3, 'shape'), P('M9.25 3.75V20.25'), P('M14.75 3.75V20.25')],
    'Compass': [C(12, 12, 9.25, 'shape'), P('M15.75 8.25L13.25 13.25L8.25 15.75L10.75 10.75Z')],
    'Construction': [
        R(2.75, 5.5, 18.5, 8, 2, 'shape'), P('M10 5.5L7.25 13.5'), P('M15.5 5.5L12.75 13.5'),
        P('M6.5 13.5V20.25'), P('M17.5 13.5V20.25'), P('M4.5 20.25H8.5'), P('M15.5 20.25H19.5')],
    'Contact': [
        R(2.75, 5, 18.5, 14, 3, 'shape'), C(8.75, 10.5, 2.25), P('M5.5 16.25A3.25 3.25 0 0 1 12 16.25'),
        P('M14.5 10H18'), P('M14.5 13.75H16.5'), dot(18.6, 13.75, .9)],
    'Copy': [R(8.75, 8.75, 12.5, 12.5, 2.5, 'shape'),
             P('M8.75 15.25H5.25A2.5 2.5 0 0 1 2.75 12.75V5.25A2.5 2.5 0 0 1 5.25 2.75H12.75A2.5 2.5 0 0 1 15.25 5.25V8.75')],
    'CornerDownRight': [dot(4.75, 3.75, .8), P('M4.75 6.5V7'), P('M4.75 9.75V11.25A3.5 3.5 0 0 0 8.25 14.75H19.5'),
                        P('M15 10.25L19.5 14.75L15 19.25')],
    'Cpu': [R(5.25, 5.25, 13.5, 13.5, 2.5, 'shape'), rr(9, 9, 6, 6, 1),
            P('M9.5 2.75V5.25'), P('M14.5 2.75V5.25'), P('M9.5 18.75V21.25'), P('M14.5 18.75V21.25'),
            P('M2.75 9.5H5.25'), P('M2.75 14.5H5.25'), P('M18.75 9.5H21.25'), P('M18.75 14.5H21.25')],
    'CreditCard': [R(2.75, 5.25, 18.5, 13.5, 3, 'shape'), P('M2.75 10H21.25'), P('M6.25 14.75H10.25'), dot(13, 14.75, .9)],
    'Crown': [P('M3.75 7.5L8 12L12 4.75L16 12L20.25 7.5L18.6 17H5.4Z', 'shape'), P('M5.5 20.25H18.5'), dot(12, 13.5, .9)],
    'Database': [
        P('M4.75 6.25A7.25 2.75 0 0 1 19.25 6.25V17.75A7.25 2.75 0 0 1 4.75 17.75Z', 'shape'),
        P('M4.75 6.25A7.25 2.75 0 0 0 19.25 6.25'), P('M4.75 12A7.25 2.75 0 0 0 19.25 12'), dot(8, 17.5, .95)],
    'DoorClosed': [P('M5.75 20.25V6.25A3 3 0 0 1 8.75 3.25H14.65L18.25 6.85V20.25', 'shape'),
                   P('M3.25 20.25H20.75'), dot(14.75, 12.5, 1)],
    'DoorOpen': [P('M5.75 3.25L13.25 5V19L5.75 20.25Z', 'shape'), P('M13.25 3.25H15.25A3 3 0 0 1 18.25 6.25V20.25'),
                 P('M3.25 20.25H5.75'), P('M13.25 20.25H20.75'), dot(11, 12.25, .95)],
    'Droplets': [P(drop_d(7.25, 2.75, 8.5, 3.25), 'shape'), P(drop_d(15.25, 7, 16, 5), 'shape')],
    'Dumbbell': [rr(5.25, 5.75, 3.75, 12.5, 1.5, 'shape'), rr(15, 5.75, 3.75, 12.5, 1.5, 'shape'),
                 P('M9 12H15'), P('M2.75 12H5.25'), P('M18.75 12H21.25')],
    'Edit2': pen(3.75, 20.25, 21.25, 5.5),
    'Eraser': [P('M12.75 3.5L20.5 11.25L11.5 20.25L3.75 12.5Z', 'shape'), P('M7.35 8.9L15.1 16.65'), P('M11.5 20.25H20.25')],
    'ExternalLink': [
        rr(4.75, 4.75, 14.5, 14.5, 3, 'duo'),
        P('M11 4.75H7.75A3 3 0 0 0 4.75 7.75V16.25A3 3 0 0 0 7.75 19.25H16.25A3 3 0 0 0 19.25 16.25V13'),
        dot(8.75, 15.25, .8), P('M10.9 13.1L11.4 12.6'), P('M13.4 10.6L19.25 4.75'), P('M14 4.75H19.25V10')],
    'EyeOff': [P(EYE_D, 'duo')] + broken(EYE_PTS, *SLASH) + [arc(12, 12, 3, 85, 185), arc(12, 12, 3, 265, 365), P('M3.75 3.75L20.25 20.25')],
    'Facebook': [R(3.75, 3.75, 16.5, 16.5, 3, 'shape'), P('M15.25 7.75H14A2.25 2.25 0 0 0 11.75 10V20.25'), P('M9 13H15')],
    'File': file_full(),
    'FileBarChart': file_full() + [P('M8.75 17.25V15'), P('M12 17.25V12.5'), P('M15.25 17.25V11.25')],
    'FileCheck': file_full() + [P('M8.75 14.5L11 16.75L15.25 12.25')],
    'FileCheck2': file_open_bl(12, 12.25) + [P('M3.25 17L5.5 19.25L9.75 14.75')],
    'FileClock': file_open_br(10.75, 10.25) + [C(16.75, 16.75, 4.5, 'shape'), P('M16.75 14.6V16.75L18.1 18')],
    'FileDown': file_full() + [dot(12, 8.5, .8), P('M12 11V11.5'), P('M12 13.75V17.75'), P('M9 14.75L12 17.75L15 14.75')],
    'FileEdit': file_open_br(9.5, 10) + pen(10.75, 21, 13.5, 3.75),
    'FileLock2': file_open_br(10.25, 9.75) + [
        rr(12.25, 15, 9, 6.25, 1.5, 'shape'), P('M14.5 15V13.5A2.25 2.25 0 0 1 19 13.5V15'), dot(16.75, 18.1, .9)],
    'FilePlus2': file_open_bl(11.75, 12.25) + [P('M6.5 14V21'), P('M3 17.5H10')],
    'FileSearch': file_open_br(10.25, 9.75) + [C(15.5, 15.5, 3.75, 'shape'), P('M18.25 18.25L20.75 20.75')],
    'FileSignature': file_full() + [P('M8.25 13.75C9 11.5 10.25 11.25 10.75 13S12.5 14.75 13.25 12.75'), dot(15.4, 12.9, .85),
                                    P('M8.25 17H15.75')],
    'FileSpreadsheet': file_full() + [rr(8, 11.5, 8, 6.75, 1), P('M8 14.875H16'), P('M12 11.5V18.25')],
    'FileStack': [
        P('M10.25 8H15L19.75 12.75V19.25A2 2 0 0 1 17.75 21.25H10.25A2 2 0 0 1 8.25 19.25V10A2 2 0 0 1 10.25 8Z', 'shape'),
        P('M15 8V10.75A2 2 0 0 0 17 12.75H19.75'),
        P('M5.75 18.25V7.5A2 2 0 0 1 7.75 5.5H14'), P('M3.25 15.75V5A2 2 0 0 1 5.25 3H11.5')],
    'FileUp': file_full() + [dot(12, 18.25, .8), P('M12 15.75V15.25'), P('M12 13V9'), P('M9 12L12 9L15 12')],
    'FileWarning': file_full() + [P('M12 10.5V14.5'), dot(12, 17.5)],
    'FileX': file_full() + [P('M9.75 12.25L14.25 16.75'), P('M14.25 12.25L9.75 16.75')],
    'FileX2': file_open_bl(12, 12.25) + [P('M3.75 14.75L8.75 19.75'), P('M8.75 14.75L3.75 19.75')],
}
