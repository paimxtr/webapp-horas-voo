import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (secret !== "seed271c295") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // Check if already seeded
    const existingUsers = await prisma.user.count();
    if (existingUsers > 0) {
      return NextResponse.json({ message: "Base de dados já tem dados. Seed ignorado.", users: existingUsers });
    }

    const hash = await bcrypt.hash("commander123", 10);
    const crewHash = await bcrypt.hash("crew123", 10);

    // Create unit
    const unit = await prisma.unit.create({
      data: { name: "Esquadra 271 – C-295", code: "ESQ271", description: "27º RAVP – Força Aérea Angolana" },
    });

    // Create commander
    await prisma.user.create({
      data: {
        fullName: "Antonio da Silva Dias Paim",
        email: "antonio",
        passwordHash: hash,
        role: "COMMANDER",
        rank: "Comandante",
        specialty: "Piloto",
        unitId: unit.id,
      },
    });

    // Create crew
    await prisma.user.create({
      data: {
        fullName: "Carlos Mendes",
        email: "carlos.mendes",
        passwordHash: crewHash,
        role: "CREW_MEMBER",
        rank: "Capitão",
        specialty: "Copiloto",
        unitId: unit.id,
      },
    });

    await prisma.user.create({
      data: {
        fullName: "Maria Santos",
        email: "maria.santos",
        passwordHash: crewHash,
        role: "CREW_MEMBER",
        rank: "Tenente",
        specialty: "Loadmaster",
        unitId: unit.id,
      },
    });

    // Create aircraft
    await prisma.aircraft.create({
      data: { code: "C295-01", tailNumber: "T-271", model: "C-295" },
    });

    // Create mission types
    await prisma.missionType.create({ data: { name: "Transporte", description: "Transporte de pessoal e carga" } });
    await prisma.missionType.create({ data: { name: "Reconhecimento", description: "Missão de reconhecimento" } });
    await prisma.missionType.create({ data: { name: "Patrulha Marítima", description: "Vigilância costeira" } });
    await prisma.missionType.create({ data: { name: "Treino", description: "Voo de instrução e treino" } });
    await prisma.missionType.create({ data: { name: "Evacuação", description: "Evacuação médica ou humanitária" } });

    // Create default hour limits
    await prisma.hourLimit.create({
      data: { period: "DAILY", maxMinutes: 480 },
    });
    await prisma.hourLimit.create({
      data: { period: "WEEKLY", maxMinutes: 2400 },
    });
    await prisma.hourLimit.create({
      data: { period: "MONTHLY", maxMinutes: 6000 },
    });
    await prisma.hourLimit.create({
      data: { period: "YEARLY", maxMinutes: 54000 },
    });

    return NextResponse.json({ message: "Seed concluído com sucesso!", users: 3, aircraft: 1, missionTypes: 5 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
