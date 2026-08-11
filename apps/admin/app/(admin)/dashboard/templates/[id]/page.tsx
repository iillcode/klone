import { notFound } from "next/navigation";
import { verifySession } from "@/lib/auth";
import { getTemplate } from "@/lib/data";
import TemplateBuilder from "@/components/templates/TemplateBuilder";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await verifySession();

  const template = await getTemplate(id);
  if (!template) notFound();

  return (
    <div className="w-full">
      <TemplateBuilder template={template} />
    </div>
  );
}