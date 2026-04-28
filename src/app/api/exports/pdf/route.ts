import { auth } from "@/lib/auth";
import { getReportsPageData } from "@/lib/data";
import { formatDate, formatMinutes } from "@/lib/utils";

const PRINT_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1a2e; font-size: 12px; }
  .page { max-width: 960px; margin: 0 auto; padding: 24px; }
  .header { border-bottom: 3px solid #8b1e1e; padding-bottom: 16px; margin-bottom: 24px; }
  .header h1 { font-size: 20px; font-weight: 700; color: #1a1a2e; }
  .header p { color: #555; margin-top: 4px; }
  .header .squadron { font-size: 13px; color: #8b1e1e; font-weight: 600; letter-spacing: 0.05em; }
  .header .period { font-size: 11px; color: #666; margin-top: 2px; }
  .section { margin-bottom: 28px; page-break-inside: avoid; }
  .section h2 { font-size: 14px; font-weight: 700; color: #8b1e1e; text-transform: uppercase;
    letter-spacing: 0.1em; border-bottom: 1px solid #e0c080; padding-bottom: 6px; margin-bottom: 12px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #1a1a2e; color: #c9a958; font-size: 10px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.12em; padding: 7px 10px; text-align: left; }
  td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .gold { color: #8b6a00; font-weight: 600; }
  .red { color: #8b1e1e; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase; }
  .badge-green { background: #d4edda; color: #155724; }
  .badge-yellow { background: #fff3cd; color: #856404; }
  .badge-red { background: #f8d7da; color: #721c24; }
  .badge-warning { background: #fff3cd; color: #856404; }
  .badge-danger { background: #f8d7da; color: #721c24; }
  .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 12px; text-align: center;
    font-size: 10px; color: #888; }
  .no-print { background: #1a1a2e; color: #c9a958; border: none; padding: 10px 20px; border-radius: 6px;
    font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 16px; display: block; }
  @media print {
    .no-print { display: none !important; }
    body { background: white; }
    .page { padding: 0; }
  }
`;

function badgeClass(level: string) {
  if (level === "green") return "badge badge-green";
  if (level === "yellow") return "badge badge-yellow";
  return "badge badge-red";
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Não autorizado.", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo") ?? "completo";
  const inicio = searchParams.get("inicio") ?? "";
  const fim = searchParams.get("fim") ?? "";

  const data = await getReportsPageData({ startDate: inicio, endDate: fim });

  const periodLabel =
    inicio && fim
      ? `${formatDate(new Date(inicio))} — ${formatDate(new Date(fim))}`
      : `1 Jan ${data.startDate.getFullYear()} — ${formatDate(data.endDate)}`;

  const showCrewHours = tipo === "horas-tripulante" || tipo === "completo";
  const showAircraftHours = tipo === "horas-aeronave" || tipo === "completo";
  const showMissionHours = tipo === "horas-missao" || tipo === "completo";
  const showLimits = tipo === "limites" || tipo === "completo";
  const showPending = tipo === "pendentes" || tipo === "completo";

  const reportTitles: Record<string, string> = {
    "horas-tripulante": "Horas por Tripulante",
    "horas-aeronave": "Horas por Aeronave",
    "horas-missao": "Horas por Tipo de Missão",
    limites: "Estado de Limites de Horas",
    pendentes: "Registos Pendentes e Rejeitados",
    completo: "Relatório Completo de Horas de Voo",
  };

  const reportTitle = reportTitles[tipo] ?? "Relatório de Horas de Voo";

  let sectionsHtml = "";

  if (showCrewHours) {
    sectionsHtml += `
      <div class="section">
        <h2>Horas por Tripulante</h2>
        <table>
          <thead><tr><th>Tripulante</th><th>Graduação</th><th>Missões</th><th>Total</th></tr></thead>
          <tbody>
            ${
              data.hoursByCrewMember.length === 0
                ? `<tr><td colspan="4" style="color:#888;font-style:italic">Sem dados para o período.</td></tr>`
                : data.hoursByCrewMember
                    .map(
                      (item) =>
                        `<tr><td><strong>${item.name}</strong></td><td>${item.rank ?? "—"}</td><td>${item.logCount}</td><td class="gold">${formatMinutes(item.totalMinutes)}</td></tr>`,
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>`;
  }

  if (showAircraftHours) {
    sectionsHtml += `
      <div class="section">
        <h2>Horas por Aeronave</h2>
        <table>
          <thead><tr><th>Aeronave</th><th>Modelo</th><th>Missões</th><th>Total</th></tr></thead>
          <tbody>
            ${
              data.hoursByAircraft.length === 0
                ? `<tr><td colspan="4" style="color:#888;font-style:italic">Sem dados para o período.</td></tr>`
                : data.hoursByAircraft
                    .map(
                      (item) =>
                        `<tr><td><strong>${item.code}</strong></td><td>${item.model}</td><td>${item.logCount}</td><td class="gold">${formatMinutes(item.totalMinutes)}</td></tr>`,
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>`;
  }

  if (showMissionHours) {
    sectionsHtml += `
      <div class="section">
        <h2>Horas por Tipo de Missão</h2>
        <table>
          <thead><tr><th>Tipo de Missão</th><th>Missões</th><th>Total</th></tr></thead>
          <tbody>
            ${
              data.hoursByMissionType.length === 0
                ? `<tr><td colspan="3" style="color:#888;font-style:italic">Sem dados para o período.</td></tr>`
                : data.hoursByMissionType
                    .map(
                      (item) =>
                        `<tr><td><strong>${item.name}</strong></td><td>${item.logCount}</td><td class="gold">${formatMinutes(item.totalMinutes)}</td></tr>`,
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>`;
  }

  if (showLimits) {
    const periodNames = data.limitStatuses[0]?.limitStatuses.map((ls) => ls.period) ?? [];
    const limitHeaders = periodNames.map((p) => `<th>${p}</th>`).join("");
    sectionsHtml += `
      <div class="section">
        <h2>Estado de Limites de Horas</h2>
        <table>
          <thead><tr><th>Tripulante</th><th>Graduação</th>${limitHeaders}</tr></thead>
          <tbody>
            ${data.limitStatuses
              .map(
                (member) =>
                  `<tr><td><strong>${member.name}</strong></td><td>${member.rank ?? "—"}</td>${member.limitStatuses
                    .map(
                      (ls) =>
                        `<td><span class="${badgeClass(ls.level)}">${Math.round(ls.percentage)}%</span><br/><small style="color:#666">${formatMinutes(ls.consumedMinutes)}</small></td>`,
                    )
                    .join("")}</tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
  }

  if (showPending) {
    sectionsHtml += `
      <div class="section">
        <h2>Registos Pendentes e Rejeitados</h2>
        <table>
          <thead><tr><th>Tripulante</th><th>Data</th><th>Voo</th><th>Duração</th><th>Estado</th></tr></thead>
          <tbody>
            ${
              data.pendingRejectedLogs.length === 0
                ? `<tr><td colspan="5" style="color:#888;font-style:italic">Sem registos pendentes ou rejeitados.</td></tr>`
                : data.pendingRejectedLogs
                    .map(
                      (log) =>
                        `<tr>
                          <td><strong>${log.crewMember.name}</strong></td>
                          <td>${formatDate(log.date)}</td>
                          <td>${log.origin} → ${log.destination}<br/><small style="color:#666">${log.aircraft.code} · ${log.missionType.name}</small></td>
                          <td>${formatMinutes(log.durationMinutes)}</td>
                          <td><span class="badge ${log.status === "SUBMITTED" ? "badge-warning" : "badge-danger"}">${log.status === "SUBMITTED" ? "Submetido" : "Rejeitado"}</span>${log.rejectionReason ? `<br/><small style="color:#888">${log.rejectionReason}</small>` : ""}</td>
                        </tr>`,
                    )
                    .join("")
            }
          </tbody>
        </table>
      </div>`;
  }

  const html = `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${reportTitle} — Esquadra 271</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <div class="page">
    <button class="no-print" onclick="window.print()">Imprimir / Guardar como PDF</button>
    <div class="header">
      <p class="squadron">Esquadra 271 — C295 · 27 RAVP — Angola</p>
      <h1>${reportTitle}</h1>
      <p class="period">Período: ${periodLabel} · Gerado em ${formatDate(new Date())}</p>
    </div>
    ${sectionsHtml}
    <div class="footer">
      Esquadra 271 — Sistema de Horas de Voo C-295 · Documento gerado automaticamente
    </div>
  </div>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}
