import { CrewSchedulesBoard } from "@/components/crew-schedules-board";
import { requireCrewMember } from "@/lib/auth";
import { getCrewSchedulesPageData } from "@/lib/data";

export default async function CrewSchedulesPage() {
  const user = await requireCrewMember();
  const assignments = await getCrewSchedulesPageData(user.id);

  return (
    <CrewSchedulesBoard
      assignments={assignments.map((assignment) => ({
        id: assignment.id,
        roleLabel: assignment.roleLabel,
        notes: assignment.notes,
        schedule: {
          id: assignment.schedule.id,
          title: assignment.schedule.title,
          description: assignment.schedule.description,
          location: assignment.schedule.location,
          startAt: assignment.schedule.startAt.toISOString(),
          endAt: assignment.schedule.endAt.toISOString(),
          status: assignment.schedule.status,
          assignments: assignment.schedule.assignments.map((item) => ({
            id: item.id,
            user: {
              id: item.user.id,
              name: item.user.name,
            },
            roleLabel: item.roleLabel,
          })),
        },
      }))}
    />
  );
}