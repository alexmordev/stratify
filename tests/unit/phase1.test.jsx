import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Icon from '@/components/ui/Icon';
import Donut from '@/components/ui/Donut';
import ProgressBar from '@/components/ui/ProgressBar';
import Btn from '@/components/ui/Btn';
import { palById, PALETTE } from '@/lib/palette';

// Icon tests
describe('Icon', () => {
  const names = [
    'target', 'flag', 'check', 'calendar', 'plus', 'search',
    'sparkle', 'chev-r', 'chev-l', 'chev-d', 'x', 'more',
    'pause', 'play', 'edit', 'trash', 'clock', 'review', 'drag',
  ];

  names.forEach((name) => {
    it(`renders "${name}" without error`, () => {
      const { container } = render(<Icon name={name} />);
      expect(container.firstChild).not.toBeNull();
    });
  });

  it('returns null for unknown icon name', () => {
    const { container } = render(<Icon name="unknown-icon-xyz" />);
    expect(container.firstChild).toBeNull();
  });
});

// Donut tests
describe('Donut', () => {
  it('renders with value=75 and correct strokeDashoffset', () => {
    const size = 64;
    const stroke = 5;
    const r = (size - stroke) / 2;
    const circumference = 2 * Math.PI * r;
    const expectedOffset = circumference * (1 - 75 / 100);

    const { container } = render(<Donut value={75} size={size} stroke={stroke} />);
    const circles = container.querySelectorAll('circle');
    const arcCircle = circles[1];
    const offset = parseFloat(arcCircle.getAttribute('stroke-dashoffset'));
    expect(offset).toBeCloseTo(expectedOffset, 2);
  });

  it('clamps value above 100 to 100%', () => {
    const { container } = render(<Donut value={150} />);
    const circles = container.querySelectorAll('circle');
    const arcCircle = circles[1];
    const offset = parseFloat(arcCircle.getAttribute('stroke-dashoffset'));
    expect(offset).toBeCloseTo(0, 0);
  });

  it('shows percentage label by default', () => {
    render(<Donut value={75} />);
    expect(screen.getByText('75%')).toBeTruthy();
  });
});

// ProgressBar tests
describe('ProgressBar', () => {
  it('clamps value above 100 to 100%', () => {
    const { container } = render(<ProgressBar value={110} />);
    const fill = container.querySelector('div > div > div');
    expect(fill.style.width).toBe('100%');
  });

  it('clamps value below 0 to 0%', () => {
    const { container } = render(<ProgressBar value={-10} />);
    const fill = container.querySelector('div > div > div');
    expect(fill.style.width).toBe('0%');
  });

  it('renders correct percentage', () => {
    const { container } = render(<ProgressBar value={60} />);
    const fill = container.querySelector('div > div > div');
    expect(fill.style.width).toBe('60%');
  });
});

// Btn tests
describe('Btn', () => {
  it('primary variant has background var(--ink)', () => {
    const { container } = render(<Btn variant="primary">Click</Btn>);
    expect(container.firstChild.style.background).toBe('var(--ink)');
  });

  it('secondary variant has transparent background', () => {
    const { container } = render(<Btn variant="secondary">Click</Btn>);
    expect(container.firstChild.style.background).toBe('transparent');
  });

  it('ghost variant has transparent background', () => {
    const { container } = render(<Btn variant="ghost">Click</Btn>);
    expect(container.firstChild.style.background).toBe('transparent');
  });
});

// palette tests
describe('palById', () => {
  it('returns correct object for known id', () => {
    const result = palById('moss');
    expect(result.id).toBe('moss');
    expect(result.bg).toBe('oklch(0.93 0.05 140)');
  });

  it('returns PALETTE[0] for unknown id', () => {
    const result = palById('unknown');
    expect(result).toBe(PALETTE[0]);
  });

  it('returns PALETTE[0] for undefined', () => {
    const result = palById(undefined);
    expect(result).toBe(PALETTE[0]);
  });

  it('all 8 palette colors are defined', () => {
    const ids = ['blush', 'peach', 'sand', 'moss', 'lagoon', 'sky', 'violet', 'graphite'];
    ids.forEach((id) => {
      const p = palById(id);
      expect(p.id).toBe(id);
      expect(p.bg).toBeTruthy();
      expect(p.fg).toBeTruthy();
      expect(p.dot).toBeTruthy();
    });
  });
});
