import { verifySession } from "@/lib/auth";
import {
  getCategories,
  getComponents,
  getSubCategories,
} from "@/lib/data";
import ComponentsManager from "@/components/ComponentsManager";

export default async function DashboardPage() {
  await verifySession();

  const [categories, subCategories, components] = await Promise.all([
    getCategories(),
    getSubCategories(),
    getComponents(),
  ]);

  return (
    <div className="mx-auto w-full lg:w-3/4">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>

      <div className="mt-6">
        <ComponentsManager
          categories={categories}
          subCategories={subCategories}
          components={components}
        />
      </div>
    </div>
  );
}
