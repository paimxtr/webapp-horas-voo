"use client";

import { useState, useRef } from "react";
import { deleteAttachmentAction } from "@/actions/crew-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Paperclip, Trash2, Download, FileText, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import { toast } from "sonner";

type Attachment = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

type AttachmentsPanelProps = {
  flightLogId: string;
  attachments: Attachment[];
  canUpload: boolean;
};

function AttachmentIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-sky-400" />;
  if (mimeType === "application/pdf") return <FileText className="h-4 w-4 text-rose-400" />;
  return <Paperclip className="h-4 w-4 text-slate-400" />;
}

export function AttachmentsPanel({ flightLogId, attachments: initialAttachments, canUpload }: AttachmentsPanelProps) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (attachments.length >= 3) {
      toast.error("Máximo de 3 anexos por registo.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O ficheiro excede o tamanho máximo de 10 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("flightLogId", flightLogId);

      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Erro ao carregar ficheiro.");
        return;
      }

      setAttachments((prev) => [...prev, json.attachment]);
      toast.success("Anexo carregado com sucesso.");
    } catch {
      toast.error("Erro ao carregar ficheiro.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-4">
        {attachments.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Nenhum anexo adicionado a este registo.</p>
        )}

        {attachments.map((attachment) => (
          <div key={attachment.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <AttachmentIcon mimeType={attachment.mimeType} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{attachment.originalName}</p>
                <p className="text-xs text-slate-500">{formatBytes(attachment.sizeBytes)}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button asChild size="sm" variant="ghost">
                <a href={`/uploads/${attachment.filename}`} download={attachment.originalName} target="_blank" rel="noreferrer">
                  <Download className="h-3.5 w-3.5" />
                </a>
              </Button>
              {canUpload && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-rose-400 hover:text-rose-300">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover anexo</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem a certeza que pretende remover <strong>{attachment.originalName}</strong>? Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const fd = new FormData();
                          fd.append("attachmentId", attachment.id);
                          fd.append("flightLogId", flightLogId);
                          await deleteAttachmentAction(fd);
                          setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
                          toast.success("Anexo removido.");
                        }}
                      >
                        Remover
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        ))}

        {canUpload && attachments.length < 3 && (
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="secondary"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="mr-2 h-3.5 w-3.5" />
              )}
              {uploading ? "A carregar..." : "Adicionar anexo"}
            </Button>
            <p className="mt-1.5 text-xs text-slate-500">
              PDF, imagens, Word · Máx. 10 MB · {3 - attachments.length} restante(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
