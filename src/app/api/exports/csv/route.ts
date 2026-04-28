import { auth } from "@/lib/auth";
import { getReportsPageData } from "@/lib/data";
import { formatDate, formatHours, formatMinutes } from "@/lib/utils";

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsvRow(values: (string | number | null | undefined)[]): string {
  return values.map(escapeCsvValue).join(",");
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "horas-tripulante";
  const inicio = searchParams.get("inicio") ?? "";
  const fim = searchParams.get("fim") ?? "";

  const data = await getReportsPageData({ startDate: inicio, endDate: fim });

  const periodLabel =
    inicio && fim
      ? `${inicio}_${fim}`
      : `${data.startDate.getFullYear()}-01-01_${data.endDate.toISOString().slice(0, 10)}`;

  let csv = "";
  let filename = `relatorio_${tipo}_${periodLabel}.csv`;

  const BOM = "\uFEFF";

  if (tipo === "horas-tripulante") {
    const rows = [
      buildCsvRow(["Tripulante", "Graduação", "Nº Missões", "Total (h:mm)", "Total (horas decimais)"]),
      ...data.hoursByCrewMember.map((item) =>
        buildCsvRow([item.name, item.rank, item.logCount, formatMinutes(item.totalMinutes), formatHours(item.totalMinutes)]),
      ),
    ];
    csv = BOM + rows.join("\r\n");
  } else if (tipo === "horas-aeronave") {
    const rows = [
      buildCsvRow(["Aeronave", "Modelo", "Nº Missões", "Total (h:mm)", "Total (horas decimais)"]),
      ...data.hoursByAircraft.map((item) =>
        buildCsvRow([item.code, item.model, item.logCount, formatMinutes(item.totalMinutes), formatHours(item.totalMinutes)]),
      ),
    ];
    csv = BOM + rows.join("\r\n");
  } else if (tipo === "horas-missao") {
    const rows = [
      buildCsvRow(["Tipo de Missão", "Nº Missões", "Total (h:mm)", "Total (horas decimais)"]),
      ...data.hoursByMissionType.map((item) =>
        buildCsvRow([item.name, item.logCount, formatMinutes(item.totalMinutes), formatHours(item.totalMinutes)]),
      ),
    ];
    csv = BOM + rows.join("\r\n");
  } else if (tipo === "limites") {
    const periodNames = data.limitStatuses[0]?.limitStatuses.map((ls) => ls.period) ?? [];
    const header = buildCsvRow(["Tripulante", "Graduação", ...periodNames.flatMap((p) => [`${p} (%)`, `${p} (h:mm)`])]);
    const rows = [
      header,
      ...data.limitStatuses.map((member) =>
        buildCsvRow([
          member.name,
          member.rank,
          ...member.limitStatuses.flatMap((ls) => [Math.round(ls.percentage), formatMinutes(ls.consumedMinutes)]),
        ]),
      ),
    ];
    csv = BOM + rows.join("\r\n");
  } else if (tipo === "pendentes") {
    const rows = [
      buildCsvRow(["Tripulante", "Data", "Origem", "Destino", "Aeronave", "Missão", "Duração", "Estado", "Razão de rejeição"]),
      ...data.pendingRejectedLogs.map((log) =>
        buildCsvRow([
          log.crewMember.name,
          formatDate(log.date),
          log.origin,
          log.destination,
          log.aircraft.code,
          log.missionType.name,
          formatMinutes(log.durationMinutes),
          log.status,
          log.rejectionReason,
        ]),
      ),
    ];
    csv = BOM + rows.join("\r\n");
  } else {
    // completo: combine all sections
    const sections: string[] = [];

    sections.push("=== HORAS POR TRIPULANTE ===");
    sections.push(buildCsvRow(["Tripulante", "Graduação", "Missões", "Total (h:mm)"]));
    data.hoursByCrewMember.forEach((item) => {
      sections.push(buildCsvRow([item.name, item.rank, item.logCount, formatMinutes(item.totalMinutes)]));
    });

    sections.push("");
    sections.push("=== HORAS POR AERONAVE ===");
    sections.push(buildCsvRow(["Aeronave", "Modelo", "Missões", "Total (h:mm)"]));
    data.hoursByAircraft.forEach((item) => {
      sections.push(buildCsvRow([item.code, item.model, item.logCount, formatMinutes(item.totalMinutes)]));
    });

    sections.push("");
    sections.push("=== HORAS POR TIPO DE MISSÃO ===");
    sections.push(buildCsvRow(["Tipo de Missão", "Missões", "Total (h:mm)"]));
    data.hoursByMissionType.forEach((item) => {
      sections.push(buildCsvRow([item.name, item.logCount, formatMinutes(item.totalMinutes)]));
    });

    sections.push("");
    sections.push("=== REGISTOS PENDENTES / REJEITADOS ===");
    sections.push(buildCsvRow(["Tripulante", "Data", "Origem→Destino", "Aeronave", "Missão", "Duração", "Estado"]));
    data.pendingRejectedLogs.forEach((log) => {
      sections.push(
        buildCsvRow([
          log.crewMember.name,
          formatDate(log.date),
          `${log.origin}→${log.destination}`,
          log.aircraft.code,
          log.missionType.name,
          formatMinutes(log.durationMinutes),
          log.status,
        ]),
      );
    });

    csv = BOM + sections.join("\r\n");
    filename = `relatorio_completo_${periodLabel}.csv`;
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
