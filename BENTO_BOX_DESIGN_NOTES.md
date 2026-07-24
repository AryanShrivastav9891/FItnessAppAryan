# Bento Box Design System - Implementation Notes

## Design Philosophy
Complete UI overhaul with soft, modern Bento Box aesthetic featuring:
- Soft gradients instead of hard borders
- Rounded corners (`rounded-3xl` for cards, `rounded-2xl` for buttons)
- Subtle shadows (`shadow-sm`, `shadow-md`, `shadow-lg`)
- Larger touch targets and improved spacing
- Smooth animations (`fade-in-up`, `scale-in`, `bounce-in`)
- Gradient accents for interactive states

---

## Color Palette

### Base Colors
```css
--color-bg: #0a0e14;           /* Dark navy background */
--color-surface: #1a2027;       /* Card background */
--color-surface2: #252a33;      /* Secondary surface */
--color-surface3: #2f3641;      /* Tertiary surface */
--color-ink: #e9ecef;           /* Primary text */
--color-muted: #8e95a3;         /* Secondary text */
```

### Accent Colors (Soft Pastels)
```css
--color-red: #ff6b6b;           /* Soft red */
--color-blue: #4dabf7;          /* Soft blue */
--color-yellow: #ffd43b;        /* Soft yellow */
--color-green: #51cf66;         /* Soft green */
--color-purple: #b197fc;        /* Soft purple */
--color-success: #6ee7b7;       /* Soft success */
```

### Day-Specific Colors (from lib/plan.ts)
```typescript
DAY_COLOR = {
  monday: '#ff6b6b',    // red
  tuesday: '#4dabf7',   // blue
  wednesday: '#ffd43b', // yellow
  thursday: '#51cf66',  // green
  friday: '#e9ecef',    // light gray
}
```

---

## Typography

### Fonts
```typescript
// layout.tsx
Outfit - Display font (headings, large text)
Inter - Body font (paragraphs, UI text)
JetBrains_Mono - Tabular font (numbers, data)
```

### Font Sizes
- **Display**: `text-5xl` (48px) for page titles
- **Headings**: `text-3xl` to `text-xl`
- **Body**: `text-base` (16px) for main text
- **Small**: `text-sm` (14px), `text-xs` (12px)
- **Tiny**: `text-[10px]`, `text-[9px]` for meta info

---

## Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
```

---

## Border Radius

- **Cards**: `rounded-3xl` (24px)
- **Buttons**: `rounded-2xl` (16px)
- **Pills/Chips**: `rounded-full`
- **Inputs**: `rounded-xl` (12px)
- **Small elements**: `rounded-lg` (8px)

---

## Animations

### Keyframes (globals.css)
```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce-in {
  0% { opacity: 0; transform: scale(0.3); }
  50% { opacity: 1; transform: scale(1.05); }
  70% { transform: scale(0.97); }
  100% { transform: scale(1); }
}
```

### Usage
- Page containers: `animate-fade-in-up`
- Cards appearing: `animate-scale-in`
- Plates/progress: `animate-bounce-in`
- Buttons: `active:scale-[0.98]` or `active:scale-95`

---

## Component Updates

### 1. Core UI Components (components/ui.tsx)

#### Card
```tsx
className="rounded-3xl bg-surface p-4 shadow-md transition-all"
// With gradient background:
style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}
```

#### TileLink
```tsx
className="rounded-2xl bg-surface p-5 shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
```

#### PageTitle
```tsx
className="font-display text-5xl leading-tight text-ink"
```

#### SectionTitle
```tsx
className="text-xs font-bold uppercase tracking-wider text-muted"
```

---

### 2. Homepage (app/page.tsx)

#### Workout Hero Button
```tsx
<Link
  className="flex min-h-[56px] items-center justify-center rounded-2xl text-base font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
  style={{ 
    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: '#0a0e14'
  }}
>
  Workout Shuru Karo →
</Link>
```

#### Meta Pills
```tsx
<span className="rounded-full bg-surface2/50 px-3 py-1.5 backdrop-blur-sm">
  {children}
</span>
```

---

### 3. DayCard (components/DayCard.tsx)

```tsx
<div 
  className="rounded-3xl bg-surface p-5 shadow-md transition-all hover:shadow-lg active:scale-[0.99]"
  style={{ 
    background: `linear-gradient(135deg, ${color}20, ${color}10)`,
    border: `2px solid ${color}30`
  }}
>
```

---

### 4. Muscle Chips (components/Chips.tsx)

```tsx
<span
  className="rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm"
  style={{ 
    background: `linear-gradient(135deg, ${color}30, ${color}20)`,
    color,
    border: `1px solid ${color}40`
  }}
>
```

---

### 5. Bottom Navigation (components/BottomNav.tsx)

```tsx
className="fixed inset-x-0 bottom-0 z-50 bg-surface/80 backdrop-blur-xl"
style={{ boxShadow: '0 -4px 16px rgba(0,0,0,0.5)' }}

// Active link:
className="flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-all active:scale-95"
style={{ color, background: `${color}15` }}
```

---

### 6. Workout Session (components/workout/WorkoutSession.tsx)

#### Header
```tsx
className="sticky top-0 z-30 bg-surface/95 p-4 shadow-md backdrop-blur-xl"
```

#### Phase Tabs
```tsx
<button
  className="rounded-2xl px-6 py-3 text-sm font-bold transition-all active:scale-95"
  style={isActive ? {
    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: '#0a0e14',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  } : {
    background: 'var(--color-surface2)',
    color: 'var(--color-muted)'
  }}
>
```

---

### 7. Exercise Card (components/workout/ExerciseCard.tsx)

```tsx
<div className="rounded-3xl bg-surface p-5 shadow-md">
  {/* Exercise number badge */}
  <span
    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-sm"
    style={{ 
      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      color: '#0a0e14'
    }}
  >
    {num}
  </span>
  
  {/* Overload button */}
  <button
    className="rounded-2xl px-4 py-2 text-sm font-bold shadow-md transition-all hover:shadow-lg active:scale-95"
    style={{ 
      background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      color: '#0a0e14'
    }}
  >
    ⬆ Overload
  </button>
</div>
```

---

### 8. CheckRow (components/workout/CheckRow.tsx)

#### Checkbox
```tsx
<span
  className="flex h-7 w-7 items-center justify-center rounded-xl shadow-sm transition-all"
  style={{
    background: checked ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'var(--color-surface2)',
    border: checked ? 'none' : '2px solid rgba(255,255,255,0.08)',
    color: checked ? '#0a0e14' : 'transparent',
  }}
>
```

#### Video Button
```tsx
<button className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface2 shadow-sm transition-all hover:bg-surface3 active:scale-95">
```

---

### 9. SetLogger (components/workout/SetLogger.tsx)

#### Set Row
```tsx
<div
  className="grid grid-cols-[28px_1fr_1fr_48px] items-center gap-3 rounded-2xl bg-surface2/50 p-3 shadow-sm backdrop-blur-sm"
  style={row.done ? { 
    background: `linear-gradient(135deg, ${color}15, ${color}08)`,
    border: `2px solid ${color}30`
  } : undefined}
>
```

#### Stepper
```tsx
<div className="flex items-center overflow-hidden rounded-xl bg-surface shadow-sm">
  <button className="flex h-10 w-10 items-center justify-center text-lg text-muted transition-all hover:bg-surface2 active:scale-90">
    −
  </button>
  <input className="w-full bg-transparent text-center text-base font-semibold tabnum outline-none" />
  <button className="flex h-10 w-10 items-center justify-center text-lg text-muted transition-all hover:bg-surface2 active:scale-90">
    +
  </button>
</div>
```

#### Done Button
```tsx
<button
  className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm transition-all active:scale-95"
  style={{
    background: row.done ? `linear-gradient(135deg, ${color}, ${color}dd)` : 'var(--color-surface)',
    border: row.done ? 'none' : '2px solid rgba(255,255,255,0.08)',
    color: row.done ? '#0a0e14' : '#8e95a3',
  }}
>
```

---

### 10. Disclosure (components/Disclosure.tsx)

```tsx
<summary className="flex cursor-pointer items-center justify-between gap-3 py-3 text-base font-semibold transition-colors hover:text-ink">
  <span>{summary}</span>
  <svg className="transition-transform duration-200 group-open:rotate-180">
    {/* chevron icon */}
  </svg>
</summary>

<div
  className="pb-3 text-sm leading-relaxed text-muted"
  style={accent ? { 
    borderLeft: `3px solid ${accent}40`,
    background: `linear-gradient(to right, ${accent}08, transparent)`,
    paddingLeft: 12,
    borderRadius: '0 8px 8px 0'
  } : undefined}
>
```

---

### 11. BarbellLoader (components/BarbellLoader.tsx)

```tsx
{/* Bar */}
<rect fill="rgba(255, 255, 255, 0.08)" rx={2} />

{/* Collars */}
<rect fill="#252a33" rx={3} />

{/* Filled plates */}
<rect
  rx={3}
  fill={color}
  opacity={0.95}
  className="animate-bounce-in"
  style={{ animationDelay: `${i * 50}ms` }}
/>

{/* Empty plates */}
<rect
  rx={3}
  fill="none"
  stroke="rgba(255, 255, 255, 0.08)"
/>
```

---

## Spacing System

- **Container gaps**: `gap-6` (24px) for main sections
- **Card padding**: `p-5` (20px) for cards, `p-4` (16px) for compact
- **List gaps**: `gap-3` (12px) for lists
- **Button padding**: `px-6 py-3` for large, `px-4 py-2` for medium
- **Touch targets**: Minimum `h-10 w-10` (40px)

---

## Interactive States

### Buttons
```tsx
// Hover
hover:shadow-lg
hover:bg-surface3

// Active (pressed)
active:scale-[0.98]  // or active:scale-95 for smaller elements

// Focus (keyboard)
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-offset-2
```

### Cards
```tsx
// Hover
hover:shadow-lg
transition-all

// Active
active:scale-[0.99]
```

---

## Gradient Patterns

### Background Gradient
```tsx
background: `linear-gradient(135deg, ${color}20, ${color}10)`
```

### Button Gradient
```tsx
background: `linear-gradient(135deg, ${color}, ${color}dd)`
color: '#0a0e14'
```

### Chip Gradient
```tsx
background: `linear-gradient(135deg, ${color}30, ${color}20)`
border: `1px solid ${color}40`
```

### Completed State Gradient
```tsx
background: `linear-gradient(135deg, ${color}15, ${color}08)`
border: `2px solid ${color}30`
```

---

## Accessibility

- All interactive elements have min 40×40px touch targets
- Focus states with visible outlines
- ARIA labels on icon-only buttons
- Semantic HTML (button, nav, section)
- Screen reader text with `sr-only` class
- Keyboard navigation support
- Reduced motion support via `@media (prefers-reduced-motion: reduce)`

---

## File Changes Summary

### Modified Files
1. ✅ `app/globals.css` - Color tokens, shadows, animations
2. ✅ `app/layout.tsx` - Outfit font, theme color
3. ✅ `lib/plan.ts` - Soft day colors
4. ✅ `components/ui.tsx` - Card, TileLink, PageTitle, SectionTitle
5. ✅ `app/page.tsx` - Homepage hero, meta pills, gradients
6. ✅ `components/DayCard.tsx` - Gradient backgrounds
7. ✅ `components/BottomNav.tsx` - Soft shadows, blur
8. ✅ `components/Chips.tsx` - Gradient chips
9. ✅ `components/workout/WorkoutSession.tsx` - Gradient tabs
10. ✅ `components/workout/ExerciseCard.tsx` - Rounded cards, badges
11. ✅ `components/workout/CheckRow.tsx` - Larger checkboxes
12. ✅ `components/workout/SetLogger.tsx` - Gradient rows, steppers
13. ✅ `components/BarbellLoader.tsx` - Soft colors, bounce animation
14. ✅ `components/Disclosure.tsx` - Gradient accents

---

## Quick Reference: Common Patterns

### Card with Gradient
```tsx
<div 
  className="rounded-3xl bg-surface p-5 shadow-md"
  style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}
>
```

### Primary Button
```tsx
<button
  className="rounded-2xl px-6 py-3 font-bold shadow-lg transition-all hover:shadow-xl active:scale-[0.98]"
  style={{ 
    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: '#0a0e14'
  }}
>
```

### Chip/Pill
```tsx
<span
  className="rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm"
  style={{ 
    background: `linear-gradient(135deg, ${color}30, ${color}20)`,
    color,
    border: `1px solid ${color}40`
  }}
>
```

### Checkbox (checked)
```tsx
<span
  className="flex h-7 w-7 items-center justify-center rounded-xl shadow-sm"
  style={{
    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
    color: '#0a0e14'
  }}
>
  ✓
</span>
```

---

## Notes

- All gradients use 135deg diagonal for consistency
- Dark backgrounds (#0a0e14) with soft colored accents
- Opacity values: 30 (semi-transparent), 20 (subtle), 15 (very subtle), 08 (barely visible)
- `dd` suffix on colors = slightly darker (via hex alpha)
- Backdrop blur for glass effect: `backdrop-blur-sm`, `backdrop-blur-xl`
- Z-index layers: bottom nav (50), sticky headers (30), modals (40+)

---

**Design completed on:** 2026-07-25  
**Theme:** Bento Box - Soft Modern Aesthetic  
**App:** COACH - 6-Month Fitness Training Plan
