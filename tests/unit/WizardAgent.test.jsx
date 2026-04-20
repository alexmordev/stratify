import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/metas',
}));

// Mock createFromWizard server action
vi.mock('@/lib/actions/wizard', () => ({
  createFromWizard: vi.fn(() =>
    Promise.resolve({ meta: { id: 'meta-new' }, objetivos: [] })
  ),
}));

// Mock fetch for API calls (streaming Claude endpoint)
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    body: {
      getReader: () => ({
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('Hola, cuéntame sobre tu meta.'),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
        releaseLock: vi.fn(),
      }),
    },
  })
);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

import WizardAgent from '@/components/modals/WizardAgent';
import { createFromWizard } from '@/lib/actions/wizard';

function renderWizard(props = {}) {
  return render(<WizardAgent onClose={props.onClose ?? vi.fn()} />);
}

describe('WizardAgent', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    mockPush.mockClear();
    // Reset fetch mock to default streaming response
    global.fetch.mockResolvedValue({
      ok: true,
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode('Hola, cuéntame sobre tu meta.'),
            })
            .mockResolvedValueOnce({ done: true, value: undefined }),
          releaseLock: vi.fn(),
        }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Cannot advance to Step 3 without approving in Step 2
  it('cannot advance to step 3 without approving in step 2', async () => {
    renderWizard();

    // Wizard starts at step 1 (Definir)
    expect(screen.getByTestId('wizard-step-1')).toBeTruthy();

    // Find and click "Aprobar meta" or look for step 3 trigger
    // Step 2 "Acordar" button should not be accessible without going through step 1 first
    // The "Objetivos" step should not be reachable by clicking the stepper directly
    const stepperItems = screen.getAllByTestId(/^stepper-step-/);
    // Step 3 (index 2) should be disabled/not-clickable
    const step3 = screen.getByTestId('stepper-step-2'); // 0-indexed: 0=Definir,1=Acordar,2=Objetivos,3=Listo
    expect(step3.getAttribute('aria-disabled')).toBe('true');
  });

  // Test 2: Step 3 (Objetivos, index 2) requires at least 1 objective to create
  it('step 3 create button is disabled when objetivos list is empty', async () => {
    // _testStep={2} = "Objetivos" step (0-indexed: 0=Definir,1=Acordar,2=Objetivos,3=Listo)
    render(<WizardAgent onClose={vi.fn()} _testStep={2} _testObjetivos={[]} />);

    const createBtn = screen.getByTestId('wizard-create-btn');
    expect(createBtn.disabled).toBe(true);
  });

  // Test 3: Color picker updates ColorDot of the objetivo in real time
  it('color picker updates ColorDot of objetivo in real time', async () => {
    render(<WizardAgent onClose={vi.fn()} _testStep={2} _testObjetivos={[
      { id: 'obj-temp-1', title: 'Objetivo de prueba', color: 'blush', weeklyLoad: 3 },
    ]} />);

    // Find the color dot for the first objetivo — should show blush color initially
    const colorDot = screen.getByTestId('obj-color-dot-obj-temp-1');
    // blush dot color from PALETTE
    expect(colorDot.style.background).toContain('oklch(0.72 0.13 25)');

    // Click the "moss" color swatch
    const mossSwatch = screen.getByTestId('color-swatch-moss-obj-temp-1');
    fireEvent.click(mossSwatch);

    // ColorDot should update to moss color
    await waitFor(() => {
      const updatedDot = screen.getByTestId('obj-color-dot-obj-temp-1');
      expect(updatedDot.style.background).toContain('oklch(0.7 0.13 140)');
    });
  });

  // Test 4: createFromWizard persists meta + objetivos in DB
  it('createFromWizard is called with correct meta and objetivos data', async () => {
    const mockMeta = {
      title: 'Meta de prueba',
      title_en: 'Test goal',
      why: 'Por crecimiento',
      why_en: 'For growth',
      success: 'Lograr X',
      success_en: 'Achieve X',
      horizon: 'Q4 2026',
      horizon_en: 'Q4 2026',
    };
    const mockObjetivos = [
      { id: 'obj-temp-1', title: 'Objetivo 1', color: 'moss', weeklyLoad: 3 },
    ];

    render(
      <WizardAgent
        onClose={vi.fn()}
        _testStep={2}
        _testMeta={mockMeta}
        _testObjetivos={mockObjetivos}
      />
    );

    const createBtn = screen.getByTestId('wizard-create-btn');
    expect(createBtn.disabled).toBe(false);

    await act(async () => {
      fireEvent.click(createBtn);
    });

    await waitFor(() => {
      expect(createFromWizard).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Meta de prueba' }),
        expect.arrayContaining([
          expect.objectContaining({ title: 'Objetivo 1', color: 'moss', weeklyLoad: 3 }),
        ])
      );
    });
  });

  // Test 5: weeklyLoad only accepts positive integers
  it('weeklyLoad input rejects non-positive values', async () => {
    render(<WizardAgent onClose={vi.fn()} _testStep={2} _testObjetivos={[
      { id: 'obj-temp-1', title: 'Objetivo 1', color: 'blush', weeklyLoad: 3 },
    ]} />);

    const weeklyLoadInput = screen.getByTestId('weeklyload-input-obj-temp-1');

    // Try setting to 0 — should be rejected (stays at minimum 1)
    fireEvent.change(weeklyLoadInput, { target: { value: '0' } });
    await waitFor(() => {
      expect(Number(weeklyLoadInput.value)).toBeGreaterThanOrEqual(1);
    });

    // Try setting to -5 — should be rejected
    fireEvent.change(weeklyLoadInput, { target: { value: '-5' } });
    await waitFor(() => {
      expect(Number(weeklyLoadInput.value)).toBeGreaterThanOrEqual(1);
    });

    // Try setting to 5 — should be accepted
    fireEvent.change(weeklyLoadInput, { target: { value: '5' } });
    await waitFor(() => {
      expect(Number(weeklyLoadInput.value)).toBe(5);
    });
  });
});
