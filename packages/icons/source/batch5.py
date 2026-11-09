import math
from icons import P, C, R, dot, star, gear  # helpers

NOCUT = ()


def rr(x, y, w, h, r):
    """Plain rounded-rect path (no signature cut) for small parts."""
    return (f'M{x+r} {y}H{x+w-r}A{r} {r} 0 0 1 {x+w} {y+r}V{y+h-r}A{r} {r} 0 0 1 {x+w-r} {y+h}'
            f'H{x+r}A{r} {r} 0 0 1 {x} {y+h-r}V{y+r}A{r} {r} 0 0 1 {x+r} {y}Z')


def _pt(cx, cy, r, a):
    t = math.radians(a)
    return cx + r * math.cos(t), cy + r * math.sin(t)


def _arc(cx, cy, r, a0, a1):
    x0, y0 = _pt(cx, cy, r, a0)
    x1, y1 = _pt(cx, cy, r, a1)
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 1 if a1 > a0 else 0
    return f'M{x0:.2f} {y0:.2f}A{r} {r} 0 {large} {sweep} {x1:.2f} {y1:.2f}'


def arc_arrow(cx, cy, r, a0, a1, head=3.5, trail='full'):
    """Circular arrow from angle a0 to a1 (degrees, SVG coords) with the data-stream trail at its start."""
    sgn = 1 if a1 > a0 else -1
    deg = lambda s: math.degrees(s / r) * sgn
    out = []
    if trail == 'full':
        out.append(dot(*[round(v, 2) for v in _pt(cx, cy, r, a0)], .8))
        out.append(P(_arc(cx, cy, r, a0 + deg(2.75), a0 + deg(3.5))))
        start = a0 + deg(6.25)
    elif trail == 'dot':
        out.append(dot(*[round(v, 2) for v in _pt(cx, cy, r, a0)], .8))
        start = a0 + deg(3.25)
    else:
        start = a0
    out.append(P(_arc(cx, cy, r, start, a1)))
    ex, ey = _pt(cx, cy, r, a1)
    phi = math.radians(a1 + 90 * sgn)  # direction of travel at the tip
    pts = []
    for s in (1, -1):
        b = phi + math.pi + s * math.radians(45)
        pts.append((ex + head * math.cos(b), ey + head * math.sin(b)))
    out.append(P(f'M{pts[0][0]:.2f} {pts[0][1]:.2f}L{ex:.2f} {ey:.2f}L{pts[1][0]:.2f} {pts[1][1]:.2f}'))
    return out


def brackets(a=3.75, b=20.25, n=4.5, r=2.5):
    return [
        P(f'M{a} {a+n}V{a+r}A{r} {r} 0 0 1 {a+r} {a}H{a+n}'),
        P(f'M{b-n} {a}H{b-r}A{r} {r} 0 0 1 {b} {a+r}V{a+n}'),
        P(f'M{b} {b-n}V{b-r}A{r} {r} 0 0 1 {b-r} {b}H{b-n}'),
        P(f'M{a+n} {b}H{a+r}A{r} {r} 0 0 1 {a} {b-r}V{b-n}'),
    ]


def rot(x, y, a=45, cx=12, cy=12):
    t = math.radians(a)
    dx, dy = x - cx, y - cy
    return round(cx + dx * math.cos(t) - dy * math.sin(t), 2), round(cy + dx * math.sin(t) + dy * math.cos(t), 2)


SHIELD = 'M12 2.75L19.25 5.6V11.4C19.25 15.9 16.2 19.55 12 21.25C7.8 19.55 4.75 15.9 4.75 11.4V5.6Z'
POWER_ARC = 'M7.7 6.36A7.5 7.5 0 1 0 16.3 6.36'
ROCKET_T = 'translate(.75 -.75) rotate(45 12 12)'


def rot2(x, y):
    a, b = rot(x, y)
    return round(a + .75, 2), round(b - .75, 2)


def rp(d, role='line'):
    return ('path', {'d': d, 'transform': ROCKET_T}, role)


ICONS = {
    'PinOff': [
        P('M9.5 3.25H14.5L13.75 9L16.75 12.25V14H7.25V12.25L10.25 9Z', 'shape'),
        P('M12 14V20.75'), P('M3.75 3.75L20.25 20.25'),
    ],
    'Play': [P('M8 5C8 4.2 8.85 3.75 9.5 4.15L19.35 11.15C19.95 11.55 19.95 12.45 19.35 12.85L9.5 19.85C8.85 20.25 8 19.8 8 19Z', 'shape')],
    'PlayCircle': [C(12, 12, 9.25, 'shape'), P('M10.25 8.75L15.25 12L10.25 15.25Z')],
    'Power': [P('M12 3.25V11'), P(POWER_ARC)],
    'PowerOff': [
        P('M12 3.25V8.5'), P(_arc(12, 12.5, 7.5, -118, -300)), P(_arc(12, 12.5, 7.5, 26, -62)),
        P('M3.75 3.75L20.25 20.25'),
    ],
    'Printer': [
        P('M7.25 8.5V4.75A1 1 0 0 1 8.25 3.75H15.75A1 1 0 0 1 16.75 4.75V8.5'),
        R(3.75, 8.5, 16.5, 8.75, 2, 'shape'),
        P('M7.25 14H16.75V19.25A1 1 0 0 1 15.75 20.25H8.25A1 1 0 0 1 7.25 19.25Z'),
        dot(7, 11.5, .9),
    ],
    'QrCode': [
        P(rr(3.75, 3.75, 6.5, 6.5, 1.5)), dot(7, 7, 1),
        P(rr(13.75, 3.75, 6.5, 6.5, 1.5)), dot(17, 7, 1),
        P(rr(3.75, 13.75, 6.5, 6.5, 1.5)), dot(7, 17, 1),
        dot(14.5, 14.5, 1.1), dot(19.5, 14.5, 1.1), dot(17, 17, 1.1), dot(14.5, 19.5, 1.1), dot(19.5, 19.5, 1.1),
    ],
    'ReceiptText': [
        P('M5.25 21.25V4.75A2 2 0 0 1 7.25 2.75H15.15L18.75 6.35V21.25L16.5 19.75L14.25 21.25L12 19.75L9.75 21.25L7.5 19.75Z', 'shape'),
        P('M8.5 8.25H15.5'), P('M8.5 11.75H15.5'), P('M8.5 15.25H12.25'), dot(15.1, 15.25, .95),
    ],
    'RefreshCw': arc_arrow(12, 12, 7.75, 170, 325) + arc_arrow(12, 12, 7.75, 350, 505),
    'RefreshCcw': arc_arrow(12, 12, 7.75, 10, -145) + arc_arrow(12, 12, 7.75, 190, 35),
    'Repeat': [
        dot(4.25, 12.25, .8), P('M4.25 9.75A3 3 0 0 1 7.25 6.75H19.75'), P('M16.5 3.5L19.75 6.75L16.5 10'),
        dot(19.75, 11.75, .8), P('M19.75 14.25A3 3 0 0 1 16.75 17.25H4.25'), P('M7.5 14L4.25 17.25L7.5 20.5'),
    ],
    'Repeat2': [
        dot(12.75, 18, .8), P('M10.25 18H8A2 2 0 0 1 6 16V4.75'), P('M3 7.75L6 4.75L9 7.75'),
        dot(11.25, 6, .8), P('M13.75 6H16A2 2 0 0 1 18 8V19.25'), P('M15 16.25L18 19.25L21 16.25'),
    ],
    'Rocket': [
        rp('M12 1.75C15.5 4.4 16.25 8.1 16.25 12V16.75H7.75V12C7.75 8.1 8.5 4.4 12 1.75Z', 'shape'),
        rp('M7.75 12.25L5.5 14.5V18L7.75 16.75'), rp('M16.25 12.25L18.5 14.5V18L16.25 16.75'),
        dot(*rot2(12, 9), 1.15), dot(*rot2(12, 19.75), .85),
    ],
    'RotateCw': arc_arrow(12, 12, 8, 50, 320, head=3.75),
    'RotateCcw': arc_arrow(12, 12, 8, 130, -140, head=3.75),
    'Route': [
        C(6, 18, 2.5), C(18, 6, 2.5, 'shape'),
        P('M8.5 18H15.5A3 3 0 0 0 15.5 12H8.5A3 3 0 0 1 8.5 6H15.5'),
    ],
    'Ruler': [
        R(2.75, 7.5, 18.5, 9, 2, 'shape'),
        P('M6.5 16.5V13'), P('M10 16.5V14.25'), P('M13.5 16.5V13'), P('M17 16.5V14.25'),
    ],
    'Save': [
        R(3.75, 3.75, 16.5, 16.5, 3, 'shape'),
        P('M8 3.75V7.25A1 1 0 0 0 9 8.25H14A1 1 0 0 0 15 7.25V3.75'),
        P('M7.75 20.25V14.75A1 1 0 0 1 8.75 13.75H15.25A1 1 0 0 1 16.25 14.75V20.25'),
    ],
    'Scale': [
        dot(12, 3.75, .95), P('M5.25 6.75H18.75'), P('M12 6.75V20.25'), P('M8 20.25H16'),
        P('M3 14.5L5.25 6.75L7.5 14.5'), P('M3 14.5A2.25 2.25 0 0 0 7.5 14.5Z', 'shape'),
        P('M16.5 14.5L18.75 6.75L21 14.5'), P('M16.5 14.5A2.25 2.25 0 0 0 21 14.5Z', 'shape'),
    ],
    'ScanFace': brackets() + [
        P(rr(7, 7, 10, 10, 3), 'duo'),
        dot(9.75, 10.25, .9), dot(14.25, 10.25, .9), P('M9.5 13.75A3.25 3.25 0 0 0 14.5 13.75'),
    ],
    'ScanLine': brackets() + [P('M7.25 12H16.75')],
    'ScanSearch': brackets() + [C(11.25, 11.25, 3.25, 'shape'), P('M13.75 13.75L16.5 16.5')],
    'School': [
        P('M12 3.5L18 7.5V20.25H6V7.5Z', 'shape'),
        P('M6 11.25H4.25A1 1 0 0 0 3.25 12.25V20.25'), P('M18 11.25H19.75A1 1 0 0 1 20.75 12.25V20.25'),
        P('M2.75 20.25H21.25'), P('M10.25 20.25V17A1.75 1.75 0 0 1 13.75 17V20.25'), dot(12, 10.5, 1.1),
    ],
    'Scissors': [
        C(6.5, 6.5, 2.75, 'shape'), C(6.5, 17.5, 2.75, 'shape'),
        P('M8.9 8.1L20.25 17'), P('M8.9 15.9L20.25 7'),
    ],
    'Scroll': [
        P('M5.25 3.75H16.75A2 2 0 0 1 18.75 5.75V17H12.25A1 1 0 0 0 11.25 18V18.25A2 2 0 0 1 7.25 18.25V5.75A2 2 0 0 0 5.25 3.75Z', 'shape'),
        P('M5.25 3.75A2 2 0 0 0 3.25 5.75V7.25A1 1 0 0 0 4.25 8.25H7.25'),
        P('M9.25 20.25H18.75A2 2 0 0 0 20.75 18.25V18A1 1 0 0 0 19.75 17H18.75'),
    ],
    'ScrollText': [
        P('M5.25 3.75H16.75A2 2 0 0 1 18.75 5.75V17H12.25A1 1 0 0 0 11.25 18V18.25A2 2 0 0 1 7.25 18.25V5.75A2 2 0 0 0 5.25 3.75Z', 'shape'),
        P('M5.25 3.75A2 2 0 0 0 3.25 5.75V7.25A1 1 0 0 0 4.25 8.25H7.25'),
        P('M9.25 20.25H18.75A2 2 0 0 0 20.75 18.25V18A1 1 0 0 0 19.75 17H18.75'),
        P('M10.5 8.5H15.5'), P('M10.5 12H12.75'), dot(15.25, 12, .9),
    ],
    'SearchCheck': [C(10.75, 10.75, 6.75, 'shape'), P('M15.75 15.75L20.25 20.25'), P('M8.1 10.9L10 12.8L13.4 9.1')],
    'SearchX': [C(10.75, 10.75, 6.75, 'shape'), P('M15.75 15.75L20.25 20.25'), P('M8.75 8.75L12.75 12.75'), P('M12.75 8.75L8.75 12.75')],
    'SendHorizontal': [P('M4.25 4.25L20.25 12L4.25 19.75L6.75 12Z', 'shape'), P('M6.75 12H12')],
    'Settings2': [
        C(7, 7, 2.75, 'shape'), P('M10.75 7H20.25'),
        C(17, 17, 2.75, 'shape'), P('M3.75 17H13.25'),
    ],
    'Share2': [
        C(17.5, 5.75, 2.75, 'shape'), C(6.25, 12, 2.75, 'shape'), C(17.5, 18.25, 2.75, 'shape'),
        P('M9.95 9.95L13.8 7.8'), P('M9.95 14.05L13.8 16.2'),
    ],
    'Shield': [P(SHIELD, 'shape')],
    'ShieldBan': [P(SHIELD, 'shape'), C(12, 11.75, 3.5), P('M9.6 9.35L14.4 14.15')],
    'ShieldEllipsis': [P(SHIELD, 'shape'), dot(8.75, 11.75, 1), dot(12, 11.75, 1), dot(15.25, 11.75, 1)],
    'ShieldOff': [P(SHIELD, 'shape'), P('M3.75 3.75L20.25 20.25')],
    'ShieldPlus': [P(SHIELD, 'shape'), P('M12 8.75V14.75'), P('M9 11.75H15')],
    'ShieldQuestion': [P(SHIELD, 'shape'), P('M9.6 9.6A2.4 2.4 0 1 1 13 11.8C12.35 12.1 12 12.6 12 13.25V13.5'), dot(12, 16.1, .95)],
    'ShieldX': [P(SHIELD, 'shape'), P('M9.5 9.25L14.5 14.25'), P('M14.5 9.25L9.5 14.25')],
    'ShoppingBag': [
        R(4.25, 7.25, 15.5, 14, 3, 'shape'),
        P('M8.75 10.25V6A3.25 3.25 0 0 1 15.25 6V10.25'),
    ],
    'ShoppingCart': [
        P('M2.75 3.75H4.1A1 1 0 0 1 5.07 4.5L7.6 15.25'),
        P('M5.6 6.75H20.25L18.35 15.25H7.6Z', 'shape'),
        C(9, 19.25, 1.4), C(17, 19.25, 1.4),
    ],
    'ShowerHead': [
        P('M5.25 20.25V7.75A4 4 0 0 1 9.25 3.75H10.75A3.5 3.5 0 0 1 14.25 7.25V8.25'),
        P('M9.75 12.75A4.5 4.5 0 0 1 18.75 12.75Z', 'shape'),
        dot(11.25, 16, .9), dot(14.25, 16, .9), dot(17.25, 16, .9), dot(12.75, 19.25, .9), dot(15.75, 19.25, .9),
    ],
    'Siren': [
        P('M6.75 17.25V12.5A5.25 5.25 0 0 1 17.25 12.5V17.25Z', 'shape'),
        P('M5.25 20.25V19.25A2 2 0 0 1 7.25 17.25H16.75A2 2 0 0 1 18.75 19.25V20.25Z'),
        P('M12 2.75V4.25'), P('M5.25 5.25L6.25 6.25'), P('M18.75 5.25L17.75 6.25'),
        dot(12, 13, 1.1),
    ],
    'SlidersHorizontal': [
        P('M3.75 6H13'), P('M17.5 6H20.25'), P(rr(13.5, 3.5, 3.5, 5, 1.25), 'shape'),
        P('M3.75 12H6.75'), P('M11.25 12H20.25'), P(rr(7.25, 9.5, 3.5, 5, 1.25), 'shape'),
        P('M3.75 18H10.5'), P('M15 18H20.25'), P(rr(11, 15.5, 3.5, 5, 1.25), 'shape'),
    ],
    'Smartphone': [R(6.25, 2.75, 11.5, 18.5, 2.5, 'shape'), P('M10.75 18H13.25'), dot(12, 5.9, .8)],
    'Sofa': [
        P('M5.5 11.25V8.75A3 3 0 0 1 8.5 5.75H15.5A3 3 0 0 1 18.5 8.75V11.25'),
        P('M3.5 13.25A2 2 0 0 1 7.5 13.25V14.25H16.5V13.25A2 2 0 0 1 20.5 13.25V17.25A2 2 0 0 1 18.5 19.25H5.5A2 2 0 0 1 3.5 17.25Z', 'shape'),
        P('M6.25 19.25V20.75'), P('M17.75 19.25V20.75'),
    ],
    'Square': [R(3.75, 3.75, 16.5, 16.5, 3, 'shape')],
}
