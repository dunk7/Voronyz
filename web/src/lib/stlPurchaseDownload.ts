import fs from "fs";
import path from "path";
import { stlShoeById, stlShoeByName } from "@/lib/stlFiles";

export function getStlZipPath(
  shoeIdOrName: string | null | undefined
): { filePath: string; fileName: string; shoeId: string } | null {
  const shoe = stlShoeById(shoeIdOrName) ?? stlShoeByName(shoeIdOrName);
  if (!shoe?.file) return null;
  const fileName = shoe.file.split("/").pop() || shoe.file;
  const candidates = [
    path.join(process.cwd(), "private", "stl", shoe.file),
    path.join(process.cwd(), "web", "private", "stl", shoe.file),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.statSync(filePath).isFile()) {
        return { filePath, fileName, shoeId: shoe.id };
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}
