import type { Metadata } from "next";
import { Onboarding } from "@/components/onboarding";
export const metadata: Metadata = {
  title: "Create a workspace",
  description: "Start a SyncHQ workspace for your team.",
  robots: { index: false, follow: false },
};
export default function WorkspaceOnboarding() {
  return <Onboarding />;
}
