import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getCurrentSession } from "@/lib/auth/session";
import { formsCollection, formSubmissionsDynRaw } from "@/lib/firebase/collections";
import type { DynamicFormField } from "@/lib/forms/types";

/**
 * Route Handler protegida para exportação de respostas em PDF real.
 *
 * GET /api/export/pdf?formId=xxx&submissionId=yyy (opcional)
 *
 * - Exige sessão administrativa válida.
 * - Gera PDF com pdf-lib + fonte Geist (suporte a português).
 * - Retorna arquivo binário para download direto no navegador.
 * - Não armazena arquivos permanentemente.
 */
export async function GET(request: NextRequest) {
  // Autenticação administrativa obrigatória
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formId = searchParams.get("formId");
  const submissionId = searchParams.get("submissionId");

  if (!formId) {
    return NextResponse.json({ error: "Parâmetro formId é obrigatório." }, { status: 400 });
  }

  try {
    // Busca formulário
    const formSnap = await formsCollection().doc(formId).get();
    if (!formSnap.exists) {
      return NextResponse.json({ error: "Formulário não encontrado." }, { status: 404 });
    }
    const form = formSnap.data()!;
    const fields = form.fields;

    // Busca submissões
    let submissions: Array<{ id: string; data: Record<string, unknown> }>;
    if (submissionId) {
      const docSnap = await formSubmissionsDynRaw(formId).doc(submissionId).get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: "Resposta não encontrada." }, { status: 404 });
      }
      submissions = [{ id: docSnap.id, data: docSnap.data() as Record<string, unknown> }];
    } else {
      const snap = await formSubmissionsDynRaw(formId).orderBy("createdAt", "desc").get();
      submissions = snap.docs.map((doc) => ({ id: doc.id, data: doc.data() as Record<string, unknown> }));
    }

    if (submissions.length === 0) {
      return NextResponse.json({ error: "Nenhuma resposta para exportar." }, { status: 400 });
    }

    // Cria documento PDF
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // Carrega fonte Geist Regular do projeto
    const fontPath = join(process.cwd(), "public", "fonts", "Geist-Regular.ttf");
    const fontBytes = await readFile(fontPath);
    const customFont = await pdfDoc.embedFont(fontBytes);

    // Configurações de layout
    const PAGE_WIDTH = 595.28; // A4
    const PAGE_HEIGHT = 841.89;
    const MARGIN_LEFT = 40;
    const MARGIN_RIGHT = 40;
    const MARGIN_TOP = 50;
    const MARGIN_BOTTOM = 50;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
    const FONT_SIZE_TITLE = 16;
    const FONT_SIZE_SUBTITLE = 10;
    const FONT_SIZE_LABEL = 9;
    const FONT_SIZE_VALUE = 9;
    const LINE_HEIGHT = 14;
    const SECTION_GAP = 20;

    const isIndividual = !!submissionId;
    const now = new Date();
    const dateStr = now.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Função auxiliar para formatar resposta
    function formatAnswer(field: DynamicFormField, value: unknown): string {
      if (value == null) return "Não informado";
      if (Array.isArray(value)) return value.join(", ");
      if (field.type === "boolean" || field.type === "consent") {
        return value ? "Sim" : "Não";
      }
      if (field.type === "file") {
        const url = String(value);
        return url ? "Arquivo anexado" : "Sem arquivo";
      }
      return String(value);
    }

    // Função para quebrar texto em linhas respeitando largura
    function wrapText(text: string, fontSize: number): string[] {
      const words = text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = customFont.widthOfTextAtSize(testLine, fontSize);
        if (width > CONTENT_WIDTH && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines.length > 0 ? lines : [""];
    }

    // Adiciona páginas conforme necessário
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN_TOP;

    function ensureSpace(needed: number): void {
      if (y - needed < MARGIN_BOTTOM) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN_TOP;
      }
    }

    // Cabeçalho
    page.drawText("IGREJA AMOR & CUIDADO", {
      x: MARGIN_LEFT,
      y,
      size: FONT_SIZE_TITLE,
      font: customFont,
      color: rgb(0, 0, 0),
    });
    y -= FONT_SIZE_TITLE + 8;

    page.drawText(form.title, {
      x: MARGIN_LEFT,
      y,
      size: 13,
      font: customFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 18;

    // Metadados
    const metaLines = [
      `Relatório gerado em: ${dateStr}`,
      `Total de respostas: ${submissions.length}`,
      isIndividual ? "Tipo: Resposta individual" : "Tipo: Relatório consolidado",
    ];
    if (form.maxSubmissions) {
      metaLines.push(`Vagas configuradas: ${form.maxSubmissions}`);
    }
    if (form.eventRef) {
      metaLines.push(`Evento vinculado: ${form.eventRef}`);
    }

    for (const line of metaLines) {
      ensureSpace(LINE_HEIGHT);
      page.drawText(line, {
        x: MARGIN_LEFT,
        y,
        size: FONT_SIZE_SUBTITLE,
        font: customFont,
        color: rgb(0.4, 0.4, 0.4),
      });
      y -= LINE_HEIGHT;
    }

    y -= SECTION_GAP;

    // Linha separadora
    ensureSpace(2);
    page.drawLine({
      start: { x: MARGIN_LEFT, y },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= SECTION_GAP;

    // Respostas
    for (let i = 0; i < submissions.length; i++) {
      const sub = submissions[i];
      const answers = (sub.data.answers ?? {}) as Record<string, unknown>;
      const status = sub.data.status === "confirmed" ? "Confirmada" : "Cancelada";
      const createdAt = sub.data.createdAt instanceof Date
        ? sub.data.createdAt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : String(sub.data.createdAt ?? "");

      // Cabeçalho da resposta
      const responseHeader = `Resposta ${i + 1} — ${status} — ${createdAt}`;
      const headerLines = wrapText(responseHeader, FONT_SIZE_LABEL);
      const headerHeight = headerLines.length * LINE_HEIGHT + 6;
      ensureSpace(headerHeight + LINE_HEIGHT);

      for (const hl of headerLines) {
        page.drawText(hl, {
          x: MARGIN_LEFT,
          y,
          size: FONT_SIZE_LABEL,
          font: customFont,
          color: rgb(0, 0, 0),
        });
        y -= LINE_HEIGHT;
      }
      y -= 4;

      // Campos
      for (const field of fields) {
        const label = field.label;
        const value = formatAnswer(field, answers[field.id]);

        // Label
        const labelLines = wrapText(label, FONT_SIZE_LABEL);
        const valueLines = wrapText(value, FONT_SIZE_VALUE);
        const fieldHeight = (labelLines.length + valueLines.length) * LINE_HEIGHT + 6;
        ensureSpace(fieldHeight);

        for (const ll of labelLines) {
          page.drawText(ll, {
            x: MARGIN_LEFT,
            y,
            size: FONT_SIZE_LABEL,
            font: customFont,
            color: rgb(0.3, 0.3, 0.3),
          });
          y -= LINE_HEIGHT;
        }

        for (const vl of valueLines) {
          page.drawText(vl, {
            x: MARGIN_LEFT + 10,
            y,
            size: FONT_SIZE_VALUE,
            font: customFont,
            color: rgb(0, 0, 0),
          });
          y -= LINE_HEIGHT;
        }
        y -= 4;
      }

      y -= SECTION_GAP / 2;

      // Separador entre respostas (exceto na última)
      if (i < submissions.length - 1) {
        ensureSpace(SECTION_GAP);
        page.drawLine({
          start: { x: MARGIN_LEFT, y },
          end: { x: PAGE_WIDTH - MARGIN_RIGHT, y },
          thickness: 0.5,
          color: rgb(0.9, 0.9, 0.9),
        });
        y -= SECTION_GAP;
      }
    }

    // Rodapé na última página
    ensureSpace(MARGIN_BOTTOM);
    page.drawText("Igreja Amor & Cuidado — Documento gerado automaticamente", {
      x: MARGIN_LEFT,
      y: MARGIN_BOTTOM - 10,
      size: 7,
      font: customFont,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Serializa PDF
    const pdfBytes = await pdfDoc.save();
    // Converte Uint8Array para Buffer (compatível com NextResponse no Next.js 16)
    const pdfBuffer = Buffer.from(pdfBytes);
    const safeTitle = form.title.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    const dateSuffix = now.toISOString().slice(0, 10);
    const suffix = isIndividual ? "individual" : "consolidado";
    const filename = `${safeTitle}_${dateSuffix}_${suffix}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[export/pdf] Erro ao gerar PDF:", {
      name: (err as Error)?.name,
      message: (err as Error)?.message,
    });
    return NextResponse.json(
      { error: "Falha ao gerar PDF. Tente novamente." },
      { status: 500 }
    );
  }
}