# Coach — App Structure

Personal 6-month aesthetic-body training app. **No auth** — single local user, all
state in `localStorage` (namespaced `coach:*`). Next.js 16 (App Router) · React 19 ·
TypeScript · Tailwind v4. Path alias `@/*` → project root.

**All content is driven by [`data/plan.json`](../data/plan.json)** — the coach's plan,
treated as the single source of truth. Nothing about exercises/diet is hardcoded in
components. Required render counts (self-checked at `/debug`): **34 exercises, 34
warm-ups, 31 stretches, 12 meal rows**.

```
fitness-app/
├── data/plan.json              # THE data — edit here, never in components
│
├── app/                        # App Router routes
│   ├── layout.tsx             # fonts (Anton/Inter/JetBrains Mono) + bottom nav
│   ├── globals.css            # "Iron & Chalk" design tokens (Tailwind v4 @theme)
│   ├── page.tsx               # / — Aaj ka plan (dashboard, Asia/Kolkata day detect)
│   ├── week/page.tsx          # /week — 5-day split + muscle-coverage audit
│   ├── workout/[dayId]/page.tsx  # /workout/monday.. — guided session (SSG per day)
│   ├── diet/page.tsx          # /diet — Regular ⇄ Veg toggle, meals, budget, water
│   ├── progress/page.tsx      # /progress — measurements, charts, recomp verdict
│   ├── rules/page.tsx         # /rules — all coach rules + profile
│   └── debug/page.tsx         # /debug — count self-check (34/34/31/12)
│
├── components/
│   ├── ui.tsx  Chips  Disclosure  BottomNav  BarbellLoader   # shared primitives
│   ├── StreakStrip  ReminderChips  MissTwiceBanner  TodayProgressBar  # dashboard
│   ├── DayCard  DietView  ProgressView  LineChart  DebugAssert
│   └── workout/            # the guided session
│       ├── WorkoutSession  # phase orchestration (Warm-up → Lift → Stretch) + finish
│       ├── WarmupList  StretchList  CheckRow
│       ├── ExerciseCard  SetLogger  RestTimer
│       └── SessionComplete # confetti + plate-drop summary
│
└── lib/
    ├── plan.ts     # loads plan.json, day colors, render counts
    ├── types.ts    # types mirroring plan.json + localStorage records
    ├── date.ts     # Asia/Kolkata day detection, streak keys
    ├── sets.ts     # parse "3 × 8–12", progressive-overload gate
    ├── storage.ts  # SSR-safe localStorage (useSyncExternalStore), namespaced coach:*
    └── keys.ts     # central registry of every localStorage key
```

## Signature element
The **Barbell Loader** (`components/BarbellLoader.tsx`) — an SVG bar that gains one
plate (in the day's bumper-plate color) per completed set. Fully loaded = session done.

## localStorage keys (see `lib/keys.ts`)
`sessions`, `measurements`, `dietMode`, `log:<exId>`, `setlog:<date>:<exId>`,
`wu:<date>`, `st:<date>`, `water:<date>`, `creatine:<date>`, `start:<date>:<dayId>`.

## Optional exercise images
Drop `public/exercises/<exerciseId>.jpg` to show a photo on that exercise card;
otherwise a muscle-tag placeholder shows. Never hotlinks external images.
