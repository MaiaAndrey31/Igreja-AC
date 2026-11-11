import { describe, it, expect } from "vitest";
import { buildSubmissionSchema } from "../schemas";
import type { DynamicFormField } from "../types";

describe("buildSubmissionSchema", () => {
  const fields: DynamicFormField[] = [
    { id: "name", type: "text", label: "Nome", required: true, order: 0, validation: { minLength: 2, maxLength: 80 } },
    { id: "email", type: "email", label: "E-mail", required: true, order: 1 },
    { id: "age", type: "number", label: "Idade", required: false, order: 2, validation: { min: 0, max: 150 } },
    { id: "role", type: "select", label: "Função", required: true, order: 3, options: [{ id: "vol", label: "Voluntário" }, { id: "part", label: "Participante" }] },
    { id: "tags", type: "multiselect", label: "Interesses", required: false, order: 4, options: [{ id: "musica", label: "Música" }, { id: "midia", label: "Mídia" }] },
    { id: "consent", type: "consent", label: "Aceito os termos", required: true, order: 5 },
    { id: "active", type: "boolean", label: "Ativo", required: false, order: 6 },
    { id: "bio", type: "textarea", label: "Bio", required: false, order: 7 },
    { id: "phone", type: "phone", label: "Telefone", required: false, order: 8 },
    { id: "birth", type: "date", label: "Nascimento", required: false, order: 9 },
    { id: "radio_opt", type: "radio", label: "Turno", required: false, order: 10, options: [{ id: "manha", label: "Manhã" }, { id: "noite", label: "Noite" }] },
    { id: "doc", type: "file", label: "Documento", required: false, order: 11 },
  ];

  const schema = buildSubmissionSchema(fields);

  it("aceita respostas válidas completas", () => {
    const result = schema.safeParse({
      name: "Maria Silva",
      email: "maria@email.com",
      age: 25,
      role: "vol",
      tags: ["musica"],
      consent: true,
      active: true,
      bio: "Breve biografia",
      phone: "+5511999999999",
      birth: new Date("2000-01-01"),
      radio_opt: "manha",
      doc: "https://blob.vercel-storage.com/file.pdf",
    });
    expect(result.success).toBe(true);
  });

  it("rejeita campo obrigatório ausente (text)", () => {
    const result = schema.safeParse({
      name: "",
      email: "maria@email.com",
      role: "vol",
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita e-mail inválido", () => {
    const result = schema.safeParse({
      name: "Maria",
      email: "invalido",
      role: "vol",
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita opção de select inválida", () => {
    const result = schema.safeParse({
      name: "Maria",
      email: "maria@email.com",
      role: "invalido",
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita multiselect com opção inválida", () => {
    const result = schema.safeParse({
      name: "Maria",
      email: "maria@email.com",
      role: "vol",
      tags: ["invalido"],
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita consent obrigatório quando falso", () => {
    const result = schema.safeParse({
      name: "Maria",
      email: "maria@email.com",
      role: "vol",
      consent: false,
    });
    expect(result.success).toBe(false);
  });

  it("rejeita número fora do intervalo", () => {
    const result = schema.safeParse({
      name: "Maria",
      email: "maria@email.com",
      age: 200,
      role: "vol",
      consent: true,
    });
    expect(result.success).toBe(false);
  });

  it("aceita campos opcionais vazios", () => {
    const result = schema.safeParse({
      name: "Maria",
      email: "maria@email.com",
      role: "vol",
      consent: true,
      age: null,
      bio: "",
      phone: "",
      tags: [],
      active: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejeita texto abaixo do minLength", () => {
    const result = schema.safeParse({
      name: "A",
      email: "maria@email.com",
      role: "vol",
      consent: true,
    });
    expect(result.success).toBe(false);
  });
});