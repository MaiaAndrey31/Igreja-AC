"use server";

import { revalidatePath } from "next/cache";
import { unitInfoDoc } from "@/lib/firebase/collections";
import { requireAdminSession } from "@/lib/auth/session";
import { unitInfoSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/actions/auth";

export async function updateUnitInfoAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminSession();

  const parsed = unitInfoSchema.safeParse({
    name: formData.get("name"),
    shortName: formData.get("shortName"),
    initials: formData.get("initials"),
    tagline: formData.get("tagline"),
    verseReference: formData.get("verseReference"),
    verseExcerpt: formData.get("verseExcerpt"),
    verseReading: formData.get("verseReading"),
    modelTitle: formData.get("modelTitle"),
    modelDescription: formData.get("modelDescription"),
    isFirstExtension: formData.get("isFirstExtension") === "on",
    foundedYear: formData.get("foundedYear"),
    foundedDateLabel: formData.get("foundedDateLabel"),
    foundingMembers: formData.get("foundingMembers"),
    originStory: formData.get("originStory"),
    newTempleYear: formData.get("newTempleYear"),
    newTempleStory: formData.get("newTempleStory"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    contactEmail: formData.get("contactEmail"),
    contactPhoneDisplay: formData.get("contactPhoneDisplay"),
    contactPhoneE164: formData.get("contactPhoneE164"),
    cellsCountLabel: formData.get("cellsCountLabel"),
    networkName: formData.get("networkName"),
    networkSite: formData.get("networkSite"),
    networkHeadquartersCity: formData.get("networkHeadquartersCity"),
    networkHeadquartersState: formData.get("networkHeadquartersState"),
    networkFoundedYear: formData.get("networkFoundedYear"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  await unitInfoDoc().set({ ...parsed.data, updatedAt: new Date() });

  // Praticamente toda página pública lê algum campo de `unit` (header, rodapé,
  // home, /sobre, páginas jurídicas) — mais simples invalidar tudo aqui do que
  // manter uma lista exaustiva de rotas sincronizada com cada novo consumo.
  revalidatePath("/", "layout");
  revalidatePath("/admin/unidade");
  return { success: true };
}
