import { FinalCTA } from "@/components/marketing/landing/FinalCTA";
import { LandingFooter } from "@/components/marketing/landing/LandingFooter";
import { DocsGuidesSection } from "@/components/marketing/docs/DocsGuidesSection";
import { DocsHeroSection } from "@/components/marketing/docs/DocsHeroSection";
import { DocsNavbar } from "@/components/marketing/docs/DocsNavbar";
import {
  DocsFAQSection,
  DocsSecuritySection,
} from "@/components/marketing/docs/DocsSecurityFAQSection";
import { DocsSetupSection } from "@/components/marketing/docs/DocsSetupSection";
import { DocsToolsSection } from "@/components/marketing/docs/DocsToolsSection";

/**
 * Klone MCP docs page — guides for connecting AI assistants and
 * automation tools to the hosted MCP server.
 */
export default function DocsPage() {
  return (
    <>
      <DocsNavbar />
      <main>
        <DocsHeroSection />
        <DocsSetupSection />
        <DocsToolsSection />
        <DocsGuidesSection />
        <DocsSecuritySection />
        <DocsFAQSection />
        <FinalCTA />
      </main>
      <LandingFooter />
    </>
  );
}
