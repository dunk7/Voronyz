import fs from "fs";
import os from "os";
import path from "path";

const V4_STL_DIRS = [
  process.env.V4_STL_DIR,
  path.join(os.homedir(), "Documents", "V4"),
  path.join(process.cwd(), "public", "downloads", "v4"),
].filter((dir): dir is string => Boolean(dir));

type V4StlEntry = {
  name: string;
  version: number;
  isTop: boolean;
  mtimeMs: number;
};

function parseV4Stl(name: string, mtimeMs: number): V4StlEntry | null {
  const match = /^v4\.(\d+)([a-zA-Z]*)\.stl$/i.exec(name);
  if (!match) return null;

  return {
    name,
    version: parseInt(match[1], 10),
    isTop: match[2].toLowerCase() === "t",
    mtimeMs,
  };
}

function compareV4Stl(a: V4StlEntry, b: V4StlEntry): number {
  if (a.version !== b.version) return b.version - a.version;
  if (a.isTop !== b.isTop) return a.isTop ? -1 : 1;
  return b.mtimeMs - a.mtimeMs;
}

type V4StlCandidate = V4StlEntry & { filePath: string };

function listV4StlsInDir(dir: string): V4StlCandidate[] {
  let entries: string[];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return [];
  }

  return entries.flatMap((name) => {
    const filePath = path.join(dir, name);
    try {
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) return [];
      const parsed = parseV4Stl(name, stat.mtimeMs);
      if (!parsed) return [];
      return [{ ...parsed, filePath }];
    } catch {
      return [];
    }
  });
}

export function getNewestV4StlPath(): { filePath: string; fileName: string } | null {
  for (const dir of V4_STL_DIRS) {
    const candidates = listV4StlsInDir(dir).sort(compareV4Stl);
    const newest = candidates[0];
    if (newest) {
      return { filePath: newest.filePath, fileName: newest.name };
    }
  }
  return null;
}
