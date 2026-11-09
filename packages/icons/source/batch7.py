from icons import P, C, R, dot, star, gear  # helpers

NOCUT = ()

# Expand/collapse marker for navigation groups. Drawn pointing down (open); rotate -90deg for closed.
ICONS = {
    # Naira: the two stems and diagonal of the N, two crossbars. No tint: a currency mark stays a clean glyph.
    'NairaSign': [
        P('M7.25 19.25V4.75L16.75 19.25V4.75'),
        P('M4.25 9.75H19.75'), P('M4.25 14.25H19.75'),
    ],
    'DisclosureCaret': [
        P('M6.6 9.1H17.4A.9.9 0 0 1 18.05 10.6L12.7 16.25A.95.95 0 0 1 11.3 16.25L5.95 10.6A.9.9 0 0 1 6.6 9.1Z', 'shape'),
    ],
}
