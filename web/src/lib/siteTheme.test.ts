import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

test("without a database, the admin dark/regular choice is shared via a local file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "voronyz-theme-"));
  const previousTmpdir = process.env.TMPDIR;
  const previousDatabaseUrl = process.env.DATABASE_URL;
  process.env.TMPDIR = dir;
  delete process.env.DATABASE_URL;

  try {
    const { getSiteDarkMode, setSiteDarkMode, SITE_DARK_MODE_BY_DEFAULT } =
      await import("./siteTheme");

    assert.equal(SITE_DARK_MODE_BY_DEFAULT, false);
    assert.equal(await getSiteDarkMode(), false);

    assert.equal(await setSiteDarkMode(true), true);
    assert.equal(await getSiteDarkMode(), true);

    assert.equal(await setSiteDarkMode(false), false);
    assert.equal(await getSiteDarkMode(), false);
  } finally {
    if (previousTmpdir === undefined) delete process.env.TMPDIR;
    else process.env.TMPDIR = previousTmpdir;
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabaseUrl;
    rmSync(dir, { recursive: true, force: true });
  }
});
