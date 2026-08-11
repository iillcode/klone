import { verifySession } from "@/lib/auth";
import TemplateBuilder from "@/components/templates/TemplateBuilder";

export default async function NewTemplatePage() {
  await verifySession();

  return (
    <div className="w-full">
      <TemplateBuilder />
    </div>
  );
}