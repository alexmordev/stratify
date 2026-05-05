// Dark-mode palette: bg = subtle tinted dark surface, fg = bright tinted text, dot = vibrant accent
export const PALETTE = [
  {
    id: 'blush',
    bg:  'oklch(0.30 0.06 25)',
    fg:  'oklch(0.88 0.10 25)',
    dot: 'oklch(0.72 0.16 25)',
  },
  {
    id: 'peach',
    bg:  'oklch(0.32 0.06 60)',
    fg:  'oklch(0.88 0.11 60)',
    dot: 'oklch(0.78 0.15 60)',
  },
  {
    id: 'sand',
    bg:  'oklch(0.32 0.05 95)',
    fg:  'oklch(0.90 0.10 95)',
    dot: 'oklch(0.80 0.13 95)',
  },
  {
    id: 'moss',
    bg:  'oklch(0.30 0.06 140)',
    fg:  'oklch(0.88 0.11 140)',
    dot: 'oklch(0.74 0.15 140)',
  },
  {
    id: 'lagoon',
    bg:  'oklch(0.30 0.06 200)',
    fg:  'oklch(0.86 0.10 220)',
    dot: 'oklch(0.74 0.13 210)',
  },
  {
    id: 'sky',
    bg:  'oklch(0.30 0.07 245)',
    fg:  'oklch(0.86 0.11 255)',
    dot: 'oklch(0.74 0.15 250)',
  },
  {
    id: 'violet',
    bg:  'oklch(0.30 0.07 295)',
    fg:  'oklch(0.86 0.11 295)',
    dot: 'oklch(0.74 0.15 295)',
  },
  {
    id: 'graphite',
    bg:  'oklch(0.28 0.005 260)',
    fg:  'oklch(0.85 0.005 260)',
    dot: 'oklch(0.65 0.008 260)',
  },
];

export function palById(id) {
  return PALETTE.find((p) => p.id === id) ?? PALETTE[0];
}
