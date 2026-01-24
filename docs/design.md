# Docs Jays Design System

> Minimal, clean aesthetic inspired by luxury automotive brands (JLR)

## Design Philosophy

**Core Principles:**
- Monochromatic palette (black, white, grays only)
- Generous whitespace (2-4x standard spacing)
- Typography hierarchy through weight, not color
- Minimal visual elements (no gradients, subtle shadows)
- Clean borders over decorative styling
- Large, impactful typography
- Restrained, smooth animations

## Color Palette

### Light Mode
```
Background:
- Primary: #FFFFFF (pure white)
- Secondary: #FAFAFA (off-white)
- Elevated: #F5F5F5 (subtle gray)

Text:
- Primary: #000000 (pure black)
- Secondary: #525252 (medium gray)
- Tertiary: #737373 (light gray)

Borders:
- Default: #E5E5E5
- Subtle: #F5F5F5
```

### Dark Mode
```
Background:
- Primary: #0A0A0A (near black)
- Secondary: #141414 (dark gray)
- Elevated: #1A1A1A (elevated gray)

Text:
- Primary: #FFFFFF (pure white)
- Secondary: #A3A3A3 (medium gray)
- Tertiary: #737373 (muted gray)

Borders:
- Default: #262626
- Subtle: #171717
```

### Semantic Colors
```
Success: #22C55E
Danger: #EF4444
Warning: #F59E0B
Info: #3B82F6
```

## Typography

### Font Families
```css
Primary: Inter (sans-serif)
Monospace: JetBrains Mono
```

### Type Scale
```
9xl: 8rem (128px) - Hero headlines
8xl: 6rem (96px) - Large headlines
7xl: 4.5rem (72px) - Section headlines
6xl: 3.75rem (60px) - Page titles
5xl: 3rem (48px) - Major headings
4xl: 2.25rem (36px) - Section headings
3xl: 1.875rem (30px) - Subsection headings
2xl: 1.5rem (24px) - Card titles
xl: 1.25rem (20px) - Large body
base: 1rem (16px) - Body text
sm: 0.875rem (14px) - Small text
xs: 0.75rem (12px) - Captions
```

### Font Weights
```
Light: 300 - Headlines, emphasis
Normal: 400 - Body text, UI
Medium: 500 - Labels, buttons
Semibold: 600 - Strong emphasis (use sparingly)
```

### Line Heights
```
Tight: 1.16 - Large headlines (5xl+)
Normal: 1.5 - Body text
Relaxed: 1.75 - Comfortable reading
```

## Spacing System

### Base Unit: 4px (0.25rem)

```
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
6: 1.5rem (24px)
8: 2rem (32px)
12: 3rem (48px)
16: 4rem (64px)
20: 5rem (80px)
24: 6rem (96px)
32: 8rem (128px)
```

### Section Spacing
```
Mobile: py-16 (64px)
Desktop: py-24 or py-32 (96px or 128px)
Between sections: border-t with py-32
```

### Container Max Widths
```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
7xl: 1536px (default)
8xl: 1408px (88rem)
9xl: 1536px (96rem)
```

## Components

### Buttons

**Primary Button**
```tsx
bg-black text-white
dark:bg-white dark:text-black
hover:bg-neutral-800 dark:hover:bg-neutral-200
h-10 px-6 rounded-md text-sm font-medium
```

**Secondary Button**
```tsx
bg-neutral-100 text-black border border-neutral-200
dark:bg-neutral-900 dark:text-white dark:border-neutral-800
hover:bg-neutral-200 dark:hover:bg-neutral-800
```

**Ghost Button**
```tsx
text-neutral-700 dark:text-neutral-400
hover:text-black dark:hover:text-white
hover:bg-neutral-100 dark:hover:bg-neutral-900
```

**Sizes**
- Small: h-8 px-4 text-sm
- Medium: h-10 px-6 text-sm (default)
- Large: h-12 px-8 text-base

### Cards

**Default Card**
```tsx
bg-white dark:bg-neutral-950
border border-neutral-200 dark:border-neutral-800
rounded-lg p-6
```

**Elevated Card**
```tsx
bg-white dark:bg-neutral-950
shadow-md
rounded-lg p-6
```

**Interactive Card**
```tsx
hover:border-neutral-300 dark:hover:border-neutral-700
hover:shadow-lg
cursor-pointer
transition-all duration-200
```

### Navigation

**Fixed Top Nav**
```tsx
fixed top-0 left-0 right-0 z-50
bg-white/80 dark:bg-black/80
backdrop-blur-md
border-b border-neutral-100 dark:border-neutral-900
h-20
```

### Forms

**Input Fields**
```tsx
bg-white dark:bg-neutral-950
border border-neutral-200 dark:border-neutral-800
rounded-md px-4 py-2
text-black dark:text-white
focus:ring-2 focus:ring-black dark:focus:ring-white
focus:border-transparent
```

**Labels**
```tsx
text-sm font-medium text-black dark:text-white mb-2
```

### Badges

**Default Badge**
```tsx
bg-neutral-100 dark:bg-neutral-900
text-neutral-900 dark:text-neutral-100
px-3 py-1 text-sm rounded-full
```

## Layout Patterns

### Landing Page Sections

**Hero Section**
```tsx
pt-32 pb-24 px-6 lg:px-12
max-w-7xl mx-auto
```

**Content Sections**
```tsx
py-32 px-6 lg:px-12
border-t border-neutral-100 dark:border-neutral-900
max-w-7xl mx-auto
```

**Feature Grid**
```tsx
grid grid-cols-1 md:grid-cols-3 gap-16
```

**Two Column Layout**
```tsx
grid grid-cols-1 md:grid-cols-2 gap-20
```

### Dashboard Layout

**Page Container**
```tsx
min-h-screen bg-neutral-50 dark:bg-neutral-950
```

**Content Wrapper**
```tsx
max-w-7xl mx-auto px-6 lg:px-12 py-8
```

**Header**
```tsx
mb-8 space-y-2
```

**Content Grid**
```tsx
grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
```

## Shadows

```css
xs: 0 1px 2px rgba(0, 0, 0, 0.05)
sm: 0 1px 3px rgba(0, 0, 0, 0.08)
md: 0 4px 12px rgba(0, 0, 0, 0.08)
lg: 0 8px 20px rgba(0, 0, 0, 0.1)
xl: 0 12px 28px rgba(0, 0, 0, 0.12)
minimal: 0 1px 0 rgba(0, 0, 0, 0.05) (divider line)
```

## Border Radius

```css
sm: 2px - Minimal elements
md: 6px - Small components
lg: 8px - Cards, buttons
xl: 12px - Large cards
2xl: 16px - Hero elements
```

## Animations

### Timing Functions
```css
Default: ease-out
Smooth: cubic-bezier(0.4, 0, 0.2, 1)
Duration: 200ms - 400ms
```

### Animations
```css
Fade In: opacity 0 → 1 (400ms)
Slide Up: translateY(10px) → 0 (500ms)
Scale In: scale(0.95) → 1 (300ms)
```

## Icons

**Size Scale**
```
xs: w-3 h-3 (12px)
sm: w-4 h-4 (16px)
base: w-5 h-5 (20px)
lg: w-6 h-6 (24px)
xl: w-8 h-8 (32px)
```

**Icon Treatment**
- Use simple, outlined icons (Lucide React)
- Black fill in light mode, white in dark mode
- Consistent stroke width (1.5-2px)

## Best Practices

### DO ✓
- Use generous whitespace between sections (py-32)
- Rely on typography hierarchy (font weight, size)
- Keep color palette strictly monochromatic
- Use subtle borders for separation
- Apply smooth, restrained transitions
- Use font-light (300) for large headlines
- Use font-normal (400) for body text
- Maintain high contrast in dark mode

### DON'T ✗
- Add colorful gradients or brand colors
- Use heavy box shadows or glows
- Overcrowd sections with content
- Mix font weights excessively
- Add unnecessary decorative elements
- Use low-contrast text colors
- Animate aggressively
- Create busy, cluttered layouts

## Dark Mode Guidelines

### Contrast Requirements
- Text on background: minimum 12:1 ratio
- Use #FFFFFF for primary text, not gray
- Use #A3A3A3 for secondary text (readable)
- Use #737373 for tertiary/disabled text

### Background Hierarchy
```
Primary: #0A0A0A (main background)
Secondary: #141414 (raised surfaces)
Elevated: #1A1A1A (cards, modals)
```

### Avoid
- Pure #000000 (too harsh)
- Gray text below #737373 (unreadable)
- Low-contrast borders

## Accessibility

### WCAG AA Compliance
- Body text: minimum 4.5:1 contrast
- Large text (18pt+): minimum 3:1 contrast
- UI components: minimum 3:1 contrast

### Focus States
```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-black dark:focus-visible:ring-white
focus-visible:ring-offset-2
```

## Code Examples

### Page Template
```tsx
export default function Page() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      {/* Fixed Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          {/* Nav content */}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-light tracking-tight text-black dark:text-white mb-8 leading-[1.1]">
            Headline
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 mb-12 max-w-2xl font-light leading-relaxed">
            Description text
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-32 px-6 lg:px-12 border-t border-neutral-100 dark:border-neutral-900">
        <div className="max-w-7xl mx-auto">
          {/* Content */}
        </div>
      </section>
    </div>
  );
}
```

### Card Component Usage
```tsx
<Card className="p-6">
  <h3 className="text-2xl font-light text-black dark:text-white mb-4">
    Card Title
  </h3>
  <p className="text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
    Card description with comfortable line height
  </p>
</Card>
```

## File Reference

```
tailwind.config.ts - Design tokens and utilities
components/ui/button.tsx - Button component
components/ui/card.tsx - Card component
components/ui/badge.tsx - Badge component
components/ui/theme-toggle.tsx - Theme switcher
app/page.tsx - Landing page example
app/layout.tsx - Root layout with theme provider
```

## Version

**Current Version:** 1.0.0
**Last Updated:** 2026-01-24
**Inspired By:** JLR minimal aesthetic
**Framework:** Next.js 15 + Tailwind CSS 3.4
