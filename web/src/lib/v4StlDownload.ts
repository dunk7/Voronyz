import fs from "fs";
import os from "os";
import path from "path";

const DOCUMENTS_V4_STL = path.join(os.homedir(), "Documents", "v4.stl");
const DOCUMENTS_V4_DIR = path.join(os.homedir(), "Documents", "V4");
const PUBLIC_V4_DIR = path.join(process.cwd(), "public", "downloads", "v4");

type V4StlEntry = {
  name: string;
  version: number;
  isTop: boolean;
  mtimeMs: number;
};

function parseV4Stl(name: string, mtimeMs: number): V4StlEntry | null {
  if (name.toLowerCase() === "v4.stl") {
    return { name, version: 9999, isTop: true, mtimeMs };
  }

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

function tryExplicitFile(filePath: string): { filePath: string; fileName: string } | null {
  try {
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return null;
    const name = path.basename(filePath);
    const parsed = parseV4Stl(name, stat.mtimeMs);
    if (!parsed) return null;
    return { filePath, fileName: name };
  } catch {
    return null;
  }
}

function tryEnvOverride(): { filePath: string; fileName: string } | null {
  const raw = process.env.V4_STL_DIR;
  if (!raw) return null;
  try {
    const stat = fs.statSync(raw);
    if (stat.isFile()) {
      return tryExplicitFile(raw);
    }
    if (stat.isDirectory()) {
      const candidates = listV4StlsInDir(raw).sort(compareV4Stl);
      const newest = candidates[0];
      if (!newest) return null;
      return { filePath: newest.filePath, fileName: newest.name };
    }
  } catch {
    return null;
  }
  return null;
}

/** Prefer env, then ~/Documents/v4.stl (never readdir of all Documents), then Documents/V4, then public. */
export function getNewestV4StlPath(): { filePath: string; fileName: string } | null {
  const fromEnv = tryEnvOverride();
  if (fromEnv) return fromEnv;

  const fromDocumentsRoot = tryExplicitFile(DOCUMENTS_V4_STL);
  if (fromDocumentsRoot) return fromDocumentsRoot;

  const fromV4Folder = listV4StlsInDir(DOCUMENTS_V4_DIR).sort(compareV4Stl)[0];
  if (fromV4Folder) {
    return { filePath: fromV4Folder.filePath, fileName: fromV4Folder.name };
  }

  const fromPublic = listV4StlsInDir(PUBLIC_V4_DIR).sort(compareV4Stl)[0];
  if (fromPublic) {
    return { filePath: fromPublic.filePath, fileName: fromPublic.name };
  }

  return null;
}
