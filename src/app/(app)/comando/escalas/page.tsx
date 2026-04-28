import { FeedbackBanner } from "@/components/feedback-banner";
import { CommanderSchedulesManager } from "@/components/commander-schedules-manager";
import { requireCommander } from "@/lib/auth";
import { getCommanderSchedulesPageData } from "@/lib/data";
import { getFeedback } from "@/lib/feedback";

export default async function CommanderSchedulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireCommander();
  const [data, feedback] = await Promise.all([getCommanderSchedulesPageData(), getFeedback(searchParams)]);

  return (
    <div className="space-y-6">
      {feedback ? <FeedbackBanner type={feedback.type} text={feedback.text} /> : null}
      <CommanderSchedulesManager
        crewMembers={data.crewMembers}
        schedules={data.schedules.map((schedule) => ({
          id: schedule.id,
          title: schedule.title,
          description: schedule.description,
          location: schedule.location,
          startAt: schedule.startAt.toISOString(),
          endAt: schedule.endAt.toISOString(),
          status: schedule.status,
          assignments: schedule.assignments.map((assignment) => ({
            id: assignment.id,
            userId: assignment.userId,
            userName: assignment.user.name,
            roleLabel: assignment.roleLabel,
            notes: assignment.notes,
          })),
        }))}
      />
    </div>
  );
}