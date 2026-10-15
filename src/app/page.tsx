import type { Metadata } from "next";
import { HomePage } from "@/components/public-pages";
export const metadata: Metadata = {
  title: "Good work, together",
  description:
    "A calmer place for teams to talk, make decisions and move work forward.",
  alternates: { canonical: "/" },
};
export default function Home() {
  return <HomePage />;
}
