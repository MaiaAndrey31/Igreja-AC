import { notFound } from "next/navigation";
import { getPublishedFormBySlug } from "@/lib/data";
import { computeEffectiveStatus } from "@/lib/forms/availability";
import { DynamicFormRenderer } from "@/components/forms/DynamicFormRenderer";
import { FormUnavailable } from "@/components/forms/FormUnavailable";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = "force-dynamic";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const form = await getPublishedFormBySlug(slug);
  if (!form) notFound();

  const effectiveStatus = computeEffectiveStatus({
    adminStatus: form.adminStatus,
    availability: form.availability,
    submissionCount: form.submissionCount,
    maxSubmissions: form.maxSubmissions,
  });

  // Schema.org para formulário público (EventRegistration se vinculado a evento)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: form.title,
    description: form.description || undefined,
    url: `/formularios/${form.slug}`,
  };

  if (effectiveStatus !== "open") {
    return (
      <>
        <JsonLd data={jsonLd} />
        <FormUnavailable status={effectiveStatus} title={form.title} />
      </>
    );
  }

  const remainingSlots =
    form.maxSubmissions != null && form.showRemainingSlots
      ? Math.max(0, form.maxSubmissions - form.submissionCount)
      : null;

  return (
    <>
      <JsonLd data={jsonLd} />
      <DynamicFormRenderer
        form={form}
        remainingSlots={remainingSlots}
      />
    </>
  );
}