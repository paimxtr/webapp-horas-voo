import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";
import { DutyScheduleStatus, FlightLogStatus, LimitPeriod, PrismaClient, Role } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não está definida.");
const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: connectionString }) });

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.dutyScheduleAssignment.deleteMany();
  await prisma.dutySchedule.deleteMany();
  await prisma.limitExemption.deleteMany();
  await prisma.userHourLimit.deleteMany();
  await prisma.flightLogAttachment.deleteMany();
  await prisma.flightLog.deleteMany();
  await prisma.hourLimit.deleteMany();
  await prisma.missionType.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.user.deleteMany();
  await prisma.unit.deleteMany();

  // Phase 4.6: Seed default unit
  const defaultUnit = await prisma.unit.create({
    data: {
      name: "Esquadra 271 - C295",
      description: "27 RAVP - Angola",
      active: true,
    },
  });

  const commanderPassword = await bcrypt.hash("commander123", 10);
  const crewPassword = await bcrypt.hash("tripulante123", 10);

  const commander = await prisma.user.create({
    data: {
      username: "antonio",
      name: "Capitão António Silva",
      rank: "CAP",
      passwordHash: commanderPassword,
      role: Role.COMMANDER,
      active: true,
      unitId: defaultUnit.id,
    },
  });

  const manuel = await prisma.user.create({
    data: {
      username: "manuel",
      name: "Tenente Manuel Pedro",
      rank: "TEN",
      passwordHash: crewPassword,
      role: Role.CREW_MEMBER,
      active: true,
      unitId: defaultUnit.id,
    },
  });

  const paulo = await prisma.user.create({
    data: {
      username: "paulo",
      name: "Subtenente Paulo Domingos",
      rank: "STEN",
      passwordHash: crewPassword,
      role: Role.CREW_MEMBER,
      active: true,
      unitId: defaultUnit.id,
    },
  });

  const aircraft = await prisma.aircraft.create({
    data: {
      code: "C-295",
      model: "Airbus C-295M",
      tailNumber: "T-271",
      notes: "Aeronave principal da Esquadra 271.",
      active: true,
    },
  });

  await prisma.missionType.createMany({
    data: [
      { name: "Evacuação Médica", description: "Apoio MEDEVAC.", active: true },
      { name: "Patrulha Marítima", description: "Missão de vigilância e presença.", active: true },
      { name: "Transporte Tático", description: "Movimentação de pessoal e carga.", active: true },
    ],
  });

  const missionTypes = await prisma.missionType.findMany({
    orderBy: { name: "asc" },
  });

  const medevacMission = missionTypes.find((item) => item.name === "Evacuação Médica");
  const patrolMission = missionTypes.find((item) => item.name === "Patrulha Marítima");
  const transportMission = missionTypes.find((item) => item.name === "Transporte Tático");

  if (!medevacMission || !patrolMission || !transportMission) {
    throw new Error("Tipos de missão não inicializados corretamente.");
  }

  await prisma.hourLimit.createMany({
    data: [
      { period: LimitPeriod.DAILY, maxMinutes: 8 * 60 },
      { period: LimitPeriod.WEEKLY, maxMinutes: 30 * 60 },
      { period: LimitPeriod.MONTHLY, maxMinutes: 90 * 60 },
      { period: LimitPeriod.YEARLY, maxMinutes: 900 * 60 },
    ],
  });

  const now = new Date();

  await prisma.flightLog.createMany({
    data: [
      {
        crewMemberId: manuel.id,
        aircraftId: aircraft.id,
        missionTypeId: patrolMission.id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        origin: "Luanda",
        destination: "Cabinda",
        departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 8, 0),
        arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 11, 15),
        durationMinutes: 195,
        dutyRole: "Piloto",
        notes: "Missão de rotina aprovada.",
        status: FlightLogStatus.APPROVED,
        submittedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 12, 0),
        approvedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 13, 0),
        approvedById: commander.id,
      },
      {
        crewMemberId: paulo.id,
        aircraftId: aircraft.id,
        missionTypeId: transportMission.id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        origin: "Luanda",
        destination: "Soyo",
        departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 10, 0),
        arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 13, 0),
        durationMinutes: 180,
        dutyRole: "Mestre de Carga",
        notes: "A aguardar validação do comandante.",
        status: FlightLogStatus.SUBMITTED,
        submittedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 14, 0),
      },
      {
        crewMemberId: manuel.id,
        aircraftId: aircraft.id,
        missionTypeId: medevacMission.id,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        origin: "Luanda",
        destination: "Benguela",
        departureTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 15, 30),
        arrivalTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0),
        durationMinutes: 150,
        dutyRole: "Copiloto",
        notes: "Rascunho para completar após missão.",
        status: FlightLogStatus.DRAFT,
      },
    ],
  });

  const scheduleOne = await prisma.dutySchedule.create({
    data: {
      title: "Prontidão Alfa",
      description: "Cobertura principal de vigilância costeira e resposta imediata.",
      location: "Base Aérea 27 RAVP",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 7, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 19, 0),
      status: DutyScheduleStatus.PUBLISHED,
      publishedAt: new Date(),
      notes: "Cobertura de vigilância costeira.",
    },
  });

  const scheduleTwo = await prisma.dutySchedule.create({
    data: {
      title: "Treino de Navegação",
      description: "Sessão de treino semanal para padronização de procedimentos.",
      location: "Luanda",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 9, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12, 0),
      status: DutyScheduleStatus.DRAFT,
      notes: "Sessão de padronização de tripulação.",
    },
  });

  const scheduleThree = await prisma.dutySchedule.create({
    data: {
      title: "Alerta Logístico Delta",
      description: "Escala reajustada para apoio logístico e transporte rápido.",
      location: "Luanda",
      startAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 6, 0),
      endAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 16, 0),
      status: DutyScheduleStatus.CHANGED,
      publishedAt: new Date(),
      notes: "Necessário confirmar material antes da saída.",
    },
  });

  await prisma.dutyScheduleAssignment.createMany({
    data: [
      { scheduleId: scheduleOne.id, userId: manuel.id, roleLabel: "Piloto de serviço", notes: "Contacto principal com a torre." },
      { scheduleId: scheduleOne.id, userId: paulo.id, roleLabel: "Chefe de carga", notes: "Verificar kit de evacuação." },
      { scheduleId: scheduleTwo.id, userId: manuel.id, roleLabel: "Copiloto", notes: "Levar plano de treino atualizado." },
      { scheduleId: scheduleThree.id, userId: manuel.id, roleLabel: "Piloto comandante", notes: "Rever janela meteorológica às 05h30." },
      { scheduleId: scheduleThree.id, userId: paulo.id, roleLabel: "Apoio logístico", notes: "Confirmar manifesto de carga." },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: commander.id,
        title: "Submissão pendente",
        message: "Existe 1 registo de voo pendente de aprovação.",
        link: "/comando/aprovacoes",
      },
      {
        userId: manuel.id,
        title: "Escala atualizada",
        message: "Foi atribuída uma nova prontidão para amanhã.",
        link: "/tripulante/escalas",
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: commander.id,
        action: "SEED_BOOTSTRAP",
        entityType: "system",
        entityId: "initial-seed",
        details: JSON.stringify({ users: 3, aircraft: 1, missionTypes: 3, unit: defaultUnit.name }),
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });