import { describe, it, expect } from "vitest";
import { computeEffectiveStatus, isFormAcceptingSubmissions } from "../availability";
import type { AvailabilityInput } from "../availability";

describe("computeEffectiveStatus", () => {
  const base: AvailabilityInput = {
    adminStatus: "published",
    availability: { mode: "manual", activatedAt: new Date("2026-01-01T00:00:00Z") },
    submissionCount: 0,
    maxSubmissions: null,
  };

  it("retorna 'draft' quando adminStatus é draft", () => {
    expect(computeEffectiveStatus({ ...base, adminStatus: "draft" })).toBe("draft");
  });

  it("retorna 'archived' quando adminStatus é archived", () => {
    expect(computeEffectiveStatus({ ...base, adminStatus: "archived" })).toBe("archived");
  });

  it("retorna 'full' quando limite de vagas foi atingido", () => {
    expect(
      computeEffectiveStatus({ ...base, submissionCount: 100, maxSubmissions: 100 })
    ).toBe("full");
  });

  it("prioriza 'full' sobre disponibilidade temporal", () => {
    expect(
      computeEffectiveStatus({
        ...base,
        submissionCount: 50,
        maxSubmissions: 50,
        availability: { mode: "scheduled", opensAt: new Date("2020-01-01"), closesAt: new Date("2099-12-31") },
      })
    ).toBe("full");
  });

  // Modo manual
  it("modo manual: retorna 'open' quando ativado", () => {
    expect(computeEffectiveStatus(base)).toBe("open");
  });

  it("modo manual: retorna 'not_yet_open' quando não ativado", () => {
    expect(
      computeEffectiveStatus({
        ...base,
        availability: { mode: "manual", activatedAt: null },
      })
    ).toBe("not_yet_open");
  });

  // Modo scheduled
  it("modo scheduled: retorna 'not_yet_open' antes da abertura", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    expect(
      computeEffectiveStatus(
        {
          ...base,
          availability: {
            mode: "scheduled",
            opensAt: new Date("2026-07-01T00:00:00Z"),
            closesAt: new Date("2026-08-01T00:00:00Z"),
          },
        },
        now
      )
    ).toBe("not_yet_open");
  });

  it("modo scheduled: retorna 'open' dentro do período", () => {
    const now = new Date("2026-07-15T00:00:00Z");
    expect(
      computeEffectiveStatus(
        {
          ...base,
          availability: {
            mode: "scheduled",
            opensAt: new Date("2026-07-01T00:00:00Z"),
            closesAt: new Date("2026-08-01T00:00:00Z"),
          },
        },
        now
      )
    ).toBe("open");
  });

  it("modo scheduled: retorna 'closed_by_schedule' após encerramento", () => {
    const now = new Date("2026-09-01T00:00:00Z");
    expect(
      computeEffectiveStatus(
        {
          ...base,
          availability: {
            mode: "scheduled",
            opensAt: new Date("2026-07-01T00:00:00Z"),
            closesAt: new Date("2026-08-01T00:00:00Z"),
          },
        },
        now
      )
    ).toBe("closed_by_schedule");
  });

  // Modo duration
  it("modo duration: retorna 'not_yet_open' sem ativação", () => {
    expect(
      computeEffectiveStatus({
        ...base,
        availability: { mode: "duration", durationHours: 24, activatedAt: null },
      })
    ).toBe("not_yet_open");
  });

  it("modo duration: retorna 'open' dentro da duração", () => {
    const activatedAt = new Date("2026-06-01T00:00:00Z");
    const now = new Date("2026-06-01T12:00:00Z"); // 12h depois
    expect(
      computeEffectiveStatus(
        {
          ...base,
          availability: { mode: "duration", durationHours: 24, activatedAt },
        },
        now
      )
    ).toBe("open");
  });

  it("modo duration: retorna 'closed_by_duration' após expiração", () => {
    const activatedAt = new Date("2026-06-01T00:00:00Z");
    const now = new Date("2026-06-03T00:00:00Z"); // 48h depois
    expect(
      computeEffectiveStatus(
        {
          ...base,
          availability: { mode: "duration", durationHours: 24, activatedAt },
        },
        now
      )
    ).toBe("closed_by_duration");
  });

  it("modo duration sem limite de horas: permanece aberto indefinidamente", () => {
    const activatedAt = new Date("2020-01-01T00:00:00Z");
    const now = new Date("2099-12-31T23:59:59Z");
    expect(
      computeEffectiveStatus(
        {
          ...base,
          availability: { mode: "duration", durationHours: null, activatedAt },
        },
        now
      )
    ).toBe("open");
  });
});

describe("isFormAcceptingSubmissions", () => {
  it("retorna true apenas quando status efetivo é 'open'", () => {
    const input: AvailabilityInput = {
      adminStatus: "published",
      availability: { mode: "manual", activatedAt: new Date() },
      submissionCount: 0,
      maxSubmissions: null,
    };
    expect(isFormAcceptingSubmissions(input)).toBe(true);
  });

  it("retorna false quando formulário está fechado", () => {
    const input: AvailabilityInput = {
      adminStatus: "published",
      availability: { mode: "manual", activatedAt: null },
      submissionCount: 0,
      maxSubmissions: null,
    };
    expect(isFormAcceptingSubmissions(input)).toBe(false);
  });
});