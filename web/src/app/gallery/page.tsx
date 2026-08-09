import type { Metadata } from "next";
import GalleryExperience from "@/components/GalleryExperience";

export const metadata: Metadata = {
  title: "Gallery – Voronyz",
  description:
    "Instagram photos and review videos from Ralph Paradomo, Nicole Page, Maximus Chapman, Alex Chapman, Mike Shea, and the Voronyz feed — scroll to slide.",
};

export default function GalleryPage() {
  return <GalleryExperience />;
}
