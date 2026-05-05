---
name: Obsidian Flow
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#918fa0'
  outline-variant: '#464554'
  surface-tint: '#c2c1ff'
  primary: '#c2c1ff'
  on-primary: '#1800a7'
  primary-container: '#5e5ce6'
  on-primary-container: '#f4f1ff'
  inverse-primary: '#4d4ad5'
  secondary: '#68d3ff'
  on-secondary: '#003546'
  secondary-container: '#139cc7'
  on-secondary-container: '#002e3d'
  tertiary: '#ffb3b0'
  on-tertiary: '#68000f'
  tertiary-container: '#c44043'
  on-tertiary-container: '#fff0ee'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c2c1ff'
  on-primary-fixed: '#0c006b'
  on-primary-fixed-variant: '#332dbc'
  secondary-fixed: '#bee9ff'
  secondary-fixed-dim: '#68d3ff'
  on-secondary-fixed: '#001f2a'
  on-secondary-fixed-variant: '#004d64'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b0'
  on-tertiary-fixed: '#410006'
  on-tertiary-fixed-variant: '#8c1520'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: 0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.08em
  button:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style

This design system is engineered for peak cognitive performance and high-tech efficiency. The brand personality is professional, focused, and sophisticated, catering to power users who require a distraction-free environment that still feels cutting-edge. 

The aesthetic is rooted in **Glassmorphism** and **Modern Minimalism**. By utilizing semi-transparent layers and background blurs, the UI creates a sense of spatial depth that mimics a high-end physical workspace. Visual noise is minimized through the use of subtle borders and deep, monochromatic backgrounds, allowing vibrant functional accents to guide the user's attention to the most critical tasks.

## Colors

The color palette is anchored in deep charcoal and slate to reduce eye strain during long-focus sessions. 

- **Primary (Electric Indigo):** Used for primary actions, active states, and brand presence. It signifies progress and energy.
- **Secondary (Soft Teal):** Used for informational elements, toggles, and successful completion states. It provides a calming contrast to the indigo.
- **Urgency (Coral):** Reserved strictly for high-priority tasks, deadlines, and destructive actions. 
- **Surfaces:** The base layer is the darkest (#121212), while elevated cards and containers use #1E1E1E to create natural depth without relying on heavy shadows.

## Typography

This design system utilizes **Inter** for its exceptional readability and utilitarian precision. To lean into the "high-tech" personality, generous tracking (letter-spacing) is applied to all labels and headlines, creating an airy, sophisticated feel even in a dense task environment.

Contrast is maintained not just through color, but through weight hierarchy. Headlines are bold and tight, while body text uses a slightly larger line-height to ensure that long descriptions remain legible. Tracking for uppercase labels is set at 8% to ensure character distinction at small sizes.

## Layout & Spacing

The system employs a **Fluid Grid** model with a base unit of 4px. Layouts should be structured on an 8px rhythm to maintain mathematical harmony. 

- **Desktop:** 12-column grid with 24px gutters.
- **Margins:** Standard 24px margins for mobile and 40px for desktop views.
- **Rhythm:** Use "md" (16px) for internal component padding and "lg" (24px) for spacing between distinct functional blocks. This generous spacing reinforces the "focused" personality of the design system, preventing the UI from feeling cluttered.

## Elevation & Depth

Visual hierarchy is achieved through a combination of **Tonal Layering** and **Glassmorphism**:

1.  **Level 0 (Base):** #121212. The canvas on which all elements sit.
2.  **Level 1 (Surface):** #1E1E1E. Secondary containers like sidebars or content areas.
3.  **Level 2 (Glass):** Semi-transparent cards with a `backdrop-filter: blur(20px)` and a subtle 1px border of `white @ 10%`. This is the primary container style for tasks and modules.
4.  **Shadows:** Shadows are rarely used. When necessary, use long, soft ambient shadows with a 0% offset and a deep blue-tinted hex (#000000 @ 40%) to suggest the object is floating on a dark plane.

## Shapes

The shape language is consistently **Rounded**, utilizing a 12px to 16px radius to soften the technical nature of the app and make it feel approachable and modern. 

- **Standard Cards/Modals:** 16px (rounded-lg)
- **Buttons and Inputs:** 12px (rounded-md)
- **Chips/Status Tags:** Fully rounded (pill-shaped) to distinguish them from interactive containers.

## Components

- **Buttons:** Primary buttons use a solid Electric Indigo fill with white text. Secondary buttons use a "ghost" style with a 1px Indigo border. All hover states should include a subtle glow effect (box-shadow: 0 0 15px indigo @ 30%).
- **Cards:** The hallmark of the system. Use the Glassmorphism style (blur + subtle border). Headers within cards should be separated by a 1px hairline divider.
- **Inputs:** Darker than the surface (#121212) with a 12px corner radius. On focus, the border transitions to Electric Indigo with a subtle outer glow.
- **Chips:** Small, pill-shaped indicators. For "Urgent," use a Coral background with 15% opacity and solid Coral text. For "In Progress," use Teal.
- **Lists:** Clean rows with 16px vertical padding. Use "Chevron" icons for navigation. Interactive list items should have a hover state that lightens the background to #252525.
- **Task Toggles:** Custom-designed checkboxes. When checked, the box fills with a gradient from Indigo to Teal, signifying task completion with high-tech flair.