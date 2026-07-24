// Types mirroring data/plan.json. The JSON is the single source of truth.

export interface WarmupItem {
  name: string;
  dose: string;
  why: string;
  video: string;
  id: string;
}

export interface StaticItem {
  name: string;
  dose: string;
  target: string;
  video: string;
  id: string;
}

export interface Exercise {
  order: number;
  name: string;
  sets: string;
  primary: string[];
  secondary: string[];
  form: string;
  mistakes: string;
  video: string;
  backup: string;
  id: string;
  restSeconds: number;
}

export interface Day {
  day: string;
  title: string;
  crowdNote: string;
  warmup: WarmupItem[];
  exercises: Exercise[];
  static: StaticItem[];
  id: string;
}

export interface Meal {
  time: string;
  food: string;
  protein: string;
}

export interface BudgetRow {
  item: string;
  cost: string;
}

export interface Diet {
  id: string;
  label: string;
  targets: string;
  meals: Meal[];
  note: string;
  budget: BudgetRow[];
  priority: string;
}

export interface Supplement {
  name: string;
  detail: string;
}

export interface Lifestyle {
  cardio: string;
  sleep: string;
  smoking: string[];
}

export interface Tracking {
  start: string;
  biweekly: string;
  perfectRecomp: string;
  adjust: string;
  sundayReport: string;
  mindset: string;
}

export interface References {
  muscleWiki: string;
  youtube: string;
  camera: string;
  charts: string;
}

export interface Expectation {
  honestTruth: string;
  results: string[];
  core: string;
  fiveDayConditions: string;
  spotReductionTruth: string;
}

export interface WeekendRoutine {
  satSun: string;
  daily: string;
  steps: string;
}

export type DietMode = "regular" | "veg";

export interface Plan {
  meta: {
    appName: string;
    mission: string;
    split: string;
    timezone: string;
    language: string;
  };
  profile: Record<string, string | number>;
  expectation: Expectation;
  trainingRules: string[];
  universalFormRules: string[];
  stretchingRules: string[];
  weekendRoutine: WeekendRoutine;
  crowdDodgeRules: string[];
  muscleAudit: string[];
  week: Day[];
  diet: Record<DietMode, Diet>;
  supplements: Supplement[];
  supplementsPriority: string;
  lifestyle: Lifestyle;
  tracking: Tracking;
  references: References;
  closing: string;
}

// ---- localStorage record shapes (namespaced coach:*) ----

export interface LoggedSet {
  w: number; // weight kg
  r: number; // reps
  done?: boolean;
}

export interface LoggedSession {
  date: string; // YYYY-MM-DD (Asia/Kolkata)
  sets: LoggedSet[];
}

export interface SessionSummary {
  dayId: string;
  completedSets: number;
  durationMin: number;
  volumeKg?: number;
}

// coach:sessions = Record<dateKey, SessionSummary>
export type SessionsMap = Record<string, SessionSummary>;

export interface Measurement {
  date: string; // YYYY-MM-DD
  weight: number; // kg
  waist: number; // cm
}
