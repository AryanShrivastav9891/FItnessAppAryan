# Coach — App Structure

Personal 6-month aesthetic-body training app. **No auth** — single local user, all
state in `localStorage` (namespaced `coach:*`). Next.js 16 (App Router) · React 19 ·
TypeScript · Tailwind v4. Path alias `@/*` → project root.

**All content is driven by [`data/plan.json`](../data/plan.json)** — the coach's plan,
treated as the single source of truth. Nothing about exercises/diet is hardcoded in
components. Required render counts (self-checked at `/debug`): **34 exercises, 34
warm-ups, 31 stretches, 12 meal rows**.

**What to lift comes from [`data/starting-weights.json`](../data/starting-weights.json)**
— one entry per exercise id: starting `kg`, `sets`, the `repMin`/`repMax` range and the
`step` progression adds. `kg` is the total load for barbell/machine/cable, per hand for
dumbbells, and the assistance weight for `assisted` (where progression *lowers* it).
Keys beginning `_` are metadata. Prescribed set counts come from here, which is what
keeps Monday at 19 sets and Friday at 21 (a superset set counts once, not once per half).

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
│   ├── MissedSummary  StrengthCharts  LogBackup  StoreMigration
│   └── workout/            # the guided session
│       ├── WorkoutSession  # phase orchestration (Warm-up → Lift → Stretch) + finish
│       ├── WarmupList  StretchList  CheckRow
│       ├── ExerciseCard  SetLogger  RestTimer
│       └── SessionComplete # confetti + plate-drop summary
│
└── lib/
    ├── plan.ts        # loads plan.json, day colors, render counts
    ├── weights.ts     # loads starting-weights.json (the prescription)
    ├── progression.ts # nextTarget() — the pure progression rule  [tested]
    ├── logs.ts        # coach:logs.v1 store, day states, stats, export/import
    ├── draft.ts       # in-progress set rows: prefill, set counting  [tested]
    ├── types.ts       # types mirroring plan.json + localStorage records
    ├── date.ts        # Asia/Kolkata day detection, streak keys
    ├── sets.ts        # parse "3 × 8–12" (fallback only — config wins)
    ├── storage.ts     # SSR-safe localStorage (useSyncExternalStore), coach:* namespace
    └── keys.ts        # central registry of every localStorage key
```

## Progression
`lib/progression.ts` is pure — no storage, no clock — so the rule is testable:

1. no completed session → the config's starting kg/reps;
2. every set at `repMax` → `+step`, back to `repMin`;
3. any set under `repMin` twice **at the same kg** → `−step`;
4. otherwise → same kg, one more rep (clamped to the range);
5. `> 10` days since the last completed session → one step back with a **Comeback**
   badge, `> 21` days → two, never below the config's starting kg;
6. round to plates that exist (barbell 5 kg, or 2.5 with `settings.allow125`;
   dumbbell 2.5; stacks by `step`).

`assisted` inverts every direction (progress = less assistance, floor 0); `time`
progresses the hold in seconds; `bodyweight` progresses reps only; `superset` runs
the whole rule per half.

An earned step-down (rule 3) *may* go under the starting kg — the start is only an
estimate, and the config's own `_meta` calls the first session a "find your weight"
session. The floor in rule 5 exists so time off never wipes out the plan's baseline.

## Tests
`npm test` — esbuild bundles `lib/*.test.ts` (resolving `@/` and the JSON config) and
node's built-in runner executes them. No test framework, no new dependencies.

## Signature element
The **Barbell Loader** (`components/BarbellLoader.tsx`) — an SVG bar that gains one
plate (in the day's bumper-plate color) per completed set. Fully loaded = session done.

## localStorage keys (see `lib/keys.ts`)
`logs.v1` is the log and the single source of truth:

```
sessions: [{ id, date, dayId, startedAt, finishedAt, status: 'done' | 'partial',
             exercises: [{ exerciseId, sets: [{ kg, reps, done, part? }], note? }] }]
overrides: { [exerciseId]: { kg } }   // a weight set by hand, spent after one session
settings:  { allow125: false }         // the gym has 1.25 kg plates
```

A session logs under its plan `dayId` with the date it was **actually** trained, which
is what makes a make-up (Monday's Lower A trained on Saturday) land on the right day.
Export/Import JSON on `/progress` is the only backup there is.

Also: `measurements`, `dietMode`, `setlog:<date>:<exId>` and `note:<date>:<exId>`
(the in-progress card, kept until the session is finished), `wu:<date>`, `st:<date>`,
`water:<date>`, `creatine:<date>`, `start:<date>:<dayId>`. The pre-v1 keys
(`sessions`, `log:<exId>`) are migrated into `logs.v1` once, by `StoreMigration`.

## Optional exercise images
Drop `public/exercises/<exerciseId>.jpg` to show a photo on that exercise card;
otherwise a muscle-tag placeholder shows. Never hotlinks external images.
