import fs from "fs";
import path from "path";
import { STL_FILES_DOWNLOAD_FILENAME } from "@/lib/stlFiles";

export function getSlipOnStlZipPath(): { filePath: string; fileName: string } | null {
  const candidates = [
    path.join(process.cwd(), "private", "stl", "slip-on", STL_FILES_DOWNLOAD_FILENAME),
    path.join(process.cwd(), "web", "private", "stl", "slip-on", STL_FILES_DOWNLOAD_FILENAME),
  ];
  for (const filePath of candidates) {
    try {
      if (fs.statSync(filePath).isFile()) {
        return { filePath, fileName: STL_FILES_DOWNLOAD_FILENAME };
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}
