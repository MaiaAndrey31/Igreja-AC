"use client";

import { useActionState, useEffect } from "react";
import { updateUnitInfoAction } from "@/actions/unit";
import type { ActionState } from "@/actions/auth";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { Switch } from "@/components/ui/Switch";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useToast } from "@/components/ui/Toast";
import type { UnitInfo } from "@/lib/firebase/collections";

const emptyState: ActionState = {};

export function UnitInfoForm({ unit }: { unit: UnitInfo }) {
  const [state, formAction] = useActionState(updateUnitInfoAction, emptyState);
  const { push } = useToast();

  useEffect(() => {
    if (state.success) push("Dados da unidade salvos.");
    if (state.error) push(state.error, "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success, state.error]);

  return (
    <form action={formAction} className="flex flex-col gap-10">
      <section>
        <h2 className="font-display text-lg tracking-wide text-foreground">Identidade</h2>
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Nome completo" htmlFor="name">
              <Input id="name" name="name" defaultValue={unit.name} required />
            </FieldGroup>
            <FieldGroup label="Nome curto" htmlFor="shortName">
              <Input id="shortName" name="shortName" defaultValue={unit.shortName} required />
            </FieldGroup>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Iniciais" htmlFor="initials" hint="Usadas em selos e ícones pequenos.">
              <Input id="initials" name="initials" defaultValue={unit.initials} required />
            </FieldGroup>
            <FieldGroup label="Tagline" htmlFor="tagline">
              <Input id="tagline" name="tagline" defaultValue={unit.tagline} required />
            </FieldGroup>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle pt-8">
        <h2 className="font-display text-lg tracking-wide text-foreground">Versículo &amp; modelo</h2>
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Referência do versículo" htmlFor="verseReference" hint="Ex.: João 21:17.">
              <Input id="verseReference" name="verseReference" defaultValue={unit.verseReference} required />
            </FieldGroup>
            <FieldGroup label="Trecho citado" htmlFor="verseExcerpt">
              <Input id="verseExcerpt" name="verseExcerpt" defaultValue={unit.verseExcerpt} required />
            </FieldGroup>
          </div>
          <FieldGroup label="Leitura do versículo" htmlFor="verseReading">
            <Textarea id="verseReading" name="verseReading" defaultValue={unit.verseReading} required />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Título do modelo eclesial" htmlFor="modelTitle" hint="Ex.: Igreja pastoreada por células.">
              <Input id="modelTitle" name="modelTitle" defaultValue={unit.modelTitle} required />
            </FieldGroup>
            <FieldGroup label="Descrição do modelo" htmlFor="modelDescription">
              <Input id="modelDescription" name="modelDescription" defaultValue={unit.modelDescription} required />
            </FieldGroup>
          </div>
          <Switch
            label="É a primeira extensão da rede"
            name="isFirstExtension"
            id="isFirstExtension"
            defaultChecked={unit.isFirstExtension}
          />
        </div>
      </section>

      <section className="border-t border-border-subtle pt-8">
        <h2 className="font-display text-lg tracking-wide text-foreground">História</h2>
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldGroup label="Ano de fundação" htmlFor="foundedYear">
              <Input id="foundedYear" name="foundedYear" type="number" defaultValue={unit.foundedYear} required />
            </FieldGroup>
            <FieldGroup label="Data de fundação (rótulo)" htmlFor="foundedDateLabel" hint="Ex.: 26 de junho de 2014.">
              <Input id="foundedDateLabel" name="foundedDateLabel" defaultValue={unit.foundedDateLabel} required />
            </FieldGroup>
            <FieldGroup label="Membros fundadores" htmlFor="foundingMembers">
              <Input
                id="foundingMembers"
                name="foundingMembers"
                type="number"
                defaultValue={unit.foundingMembers}
                required
              />
            </FieldGroup>
          </div>
          <FieldGroup label="História (garagem → congregação)" htmlFor="originStory">
            <Textarea id="originStory" name="originStory" defaultValue={unit.originStory} required rows={5} />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldGroup label="Ano do templo novo" htmlFor="newTempleYear">
              <Input id="newTempleYear" name="newTempleYear" type="number" defaultValue={unit.newTempleYear} required />
            </FieldGroup>
            <div className="sm:col-span-2">
              <FieldGroup label="História do templo novo" htmlFor="newTempleStory">
                <Textarea id="newTempleStory" name="newTempleStory" defaultValue={unit.newTempleStory} required rows={5} />
              </FieldGroup>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle pt-8">
        <h2 className="font-display text-lg tracking-wide text-foreground">Contato</h2>
        <div className="mt-5 flex flex-col gap-4">
          <FieldGroup label="Endereço completo" htmlFor="address">
            <Input id="address" name="address" defaultValue={unit.address} required />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Cidade" htmlFor="city">
              <Input id="city" name="city" defaultValue={unit.city} required />
            </FieldGroup>
            <FieldGroup label="Estado (UF)" htmlFor="state">
              <Input id="state" name="state" maxLength={2} defaultValue={unit.state} required />
            </FieldGroup>
          </div>
          <FieldGroup label="E-mail" htmlFor="contactEmail">
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={unit.contactEmail} required />
          </FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Telefone (exibição)" htmlFor="contactPhoneDisplay" hint="Ex.: (18) 3880-0209.">
              <Input id="contactPhoneDisplay" name="contactPhoneDisplay" defaultValue={unit.contactPhoneDisplay} required />
            </FieldGroup>
            <FieldGroup
              label="Telefone (WhatsApp, E.164)"
              htmlFor="contactPhoneE164"
              hint="Só dígitos, com DDI e DDD (ex.: 551838800209)."
            >
              <Input id="contactPhoneE164" name="contactPhoneE164" defaultValue={unit.contactPhoneE164} required />
            </FieldGroup>
          </div>
          <FieldGroup label="Rótulo de nº de células" htmlFor="cellsCountLabel" hint='Ex.: "70+".'>
            <Input id="cellsCountLabel" name="cellsCountLabel" defaultValue={unit.cellsCountLabel} required />
          </FieldGroup>
        </div>
      </section>

      <section className="border-t border-border-subtle pt-8">
        <h2 className="font-display text-lg tracking-wide text-foreground">Rede nacional</h2>
        <div className="mt-5 flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldGroup label="Nome da rede" htmlFor="networkName">
              <Input id="networkName" name="networkName" defaultValue={unit.networkName} required />
            </FieldGroup>
            <FieldGroup label="Site da rede" htmlFor="networkSite">
              <Input id="networkSite" name="networkSite" defaultValue={unit.networkSite} required />
            </FieldGroup>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <FieldGroup label="Cidade da sede" htmlFor="networkHeadquartersCity">
              <Input id="networkHeadquartersCity" name="networkHeadquartersCity" defaultValue={unit.networkHeadquartersCity} required />
            </FieldGroup>
            <FieldGroup label="Estado da sede (UF)" htmlFor="networkHeadquartersState">
              <Input
                id="networkHeadquartersState"
                name="networkHeadquartersState"
                maxLength={2}
                defaultValue={unit.networkHeadquartersState}
                required
              />
            </FieldGroup>
            <FieldGroup label="Ano de fundação da rede" htmlFor="networkFoundedYear">
              <Input
                id="networkFoundedYear"
                name="networkFoundedYear"
                type="number"
                defaultValue={unit.networkFoundedYear}
                required
              />
            </FieldGroup>
          </div>
        </div>
      </section>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <SubmitButton pendingLabel="Salvando..." className="self-start">
        Salvar dados da unidade
      </SubmitButton>
    </form>
  );
}
