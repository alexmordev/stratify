export const PALETTE = [
  {
    id: 'blush',
    bg: 'oklch(0.93 0.04 25)',
    fg: 'oklch(0.42 0.09 25)',
    dot: 'oklch(0.72 0.13 25)',
  },
  {
    id: 'peach',
    bg: 'oklch(0.94 0.05 60)',
    fg: 'oklch(0.45 0.1 60)',
    dot: 'oklch(0.75 0.14 60)',
  },
  {
    id: 'sand',
    bg: 'oklch(0.94 0.04 95)',
    fg: 'oklch(0.45 0.08 95)',
    dot: 'oklch(0.77 0.1 95)',
  },
  {
    id: 'moss',
    bg: 'oklch(0.93 0.05 140)',
    fg: 'oklch(0.42 0.09 140)',
    dot: 'oklch(0.7 0.13 140)',
  },
  {
    id: 'lagoon',
    bg: 'oklch(0.93 0.04 200)',
    fg: 'oklch(0.42 0.09 220)',
    dot: 'oklch(0.7 0.12 210)',
  },
  {
    id: 'sky',
    bg: 'oklch(0.94 0.04 245)',
    fg: 'oklch(0.42 0.1 255)',
    dot: 'oklch(0.7 0.13 250)',
  },
  {
    id: 'violet',
    bg: 'oklch(0.93 0.05 295)',
    fg: 'oklch(0.42 0.1 295)',
    dot: 'oklch(0.7 0.13 295)',
  },
  {
    id: 'graphite',
    bg: 'oklch(0.93 0.004 90)',
    fg: 'oklch(0.35 0.005 90)',
    dot: 'oklch(0.55 0.005 90)',
  },
];

export function palById(id) {
  return PALETTE.find((p) => p.id === id) ?? PALETTE[0];
}
