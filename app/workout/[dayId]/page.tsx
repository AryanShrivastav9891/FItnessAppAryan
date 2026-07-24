import { notFound } from "next/navigation";
import { plan, getDay, dayColor, DAY_IDS } from "@/lib/plan";
import WorkoutSession from "@/components/workout/WorkoutSession";

export function generateStaticParams() {
  return DAY_IDS.map((dayId) => ({ dayId }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const day = getDay(dayId);
  return { title: day ? `${day.title} — Coach` : "Workout — Coach" };
}

const OVERLOAD_RULE =
  plan.trainingRules.find((r) => r.includes("PROGRESSIVE OVERLOAD")) ??
  plan.trainingRules[4];

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const day = getDay(dayId);
  if (!day) notFound();

  return (
    <WorkoutSession
      day={day}
      color={dayColor(dayId)}
      overloadRule={OVERLOAD_RULE}
    />
  );
}
