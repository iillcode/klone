import { requireSession } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Any signed-in user may open the dashboard (including free/Hobby plan).
  // Creating projects and exporting PDFs is gated separately by
  // requireProPlan() inside the respective server actions / API route.
  await requireSession();

  // The dashboard home page renders its own full shell (top bar + sidebar +
  // scrollable content). The preview editor is a full-screen editor, so it
  // just fills this overflow-hidden viewport.
  return (
    <div className="min-h-screen bg-[#161617] text-[#e4e4e7]">
      <div className="h-screen overflow-hidden">{children}</div>
    </div>
  );
}
