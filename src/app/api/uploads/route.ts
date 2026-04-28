import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILES_PER_LOG = 3;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const flightLogId = formData.get("flightLogId") as string | null;

    if (!file || !flightLogId) {
      return NextResponse.json({ error: "Ficheiro e ID de registo obrigatórios." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de ficheiro não suportado." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "O ficheiro excede o tamanho máximo de 10 MB." }, { status: 400 });
    }

    // Verify the flight log belongs to this user
    const flightLog = await prisma.flightLog.findFirst({
      where: { id: flightLogId, crewMemberId: session.user.id },
      include: { attachments: true },
    });

    if (!flightLog) {
      return NextResponse.json({ error: "Registo não encontrado." }, { status: 404 });
    }

    if (flightLog.attachments.length >= MAX_FILES_PER_LOG) {
      return NextResponse.json({ error: `Máximo de ${MAX_FILES_PER_LOG} anexos por registo.` }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${randomUUID()}.${ext}`;
    const filePath = join(uploadDir, filename);

    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const attachment = await prisma.flightLogAttachment.create({
      data: {
        flightLogId,
        filename,
        originalName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedById: session.user.id,
      },
    });

    return NextResponse.json({ attachment });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erro ao processar o ficheiro." }, { status: 500 });
  }
}
