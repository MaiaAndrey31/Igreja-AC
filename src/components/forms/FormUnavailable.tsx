import Link from "next/link";
import type { FormEffectiveStatus } from "@/lib/forms/types";

const STATUS_MESSAGES: Record<FormEffectiveStatus, string> = {
  draft: "Este formulário ainda não foi publicado.",
  not_yet_open: "As inscrições ainda não foram abertas. Volte mais tarde!",
  open: "", // nunca usado — o formulário está aberto
  closed_by_schedule: "O período de inscrição foi encerrado.",
  closed_by_duration: "O prazo de inscrição expirou.",
  closed_manually: "As inscrições foram encerradas pela organização.",
  full: "Todas as vagas foram preenchidas. Agradecemos o interesse!",
  archived: "Este formulário foi arquivado e não aceita mais inscrições.",
};

export function FormUnavailable({
  status,
  title,
}: {
  status: FormEffectiveStatus;
  title: string;
}) {
  const message = STATUS_MESSAGES[status] ?? "Formulário indisponível.";

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-3xl text-foreground">{title}</h1>
      <p className="mt-4 text-lg text-foreground-muted">{message}</p>
      <Link
        href="/"
        className="mt-8 rounded-lg border border-border-soft px-6 py-3 text-sm text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        Voltar ao início
      </Link>
    </div>
  );
}