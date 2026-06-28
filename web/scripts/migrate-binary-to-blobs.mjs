/**
 * One-time migration: move legacy BYTEA payloads from Supabase Postgres to Netlify Blobs.
 *
 * Usage (from web/):
 *   node --env-file=.env.local scripts/migrate-binary-to-blobs.mjs
 *
 * Safe to re-run — skips rows already in blob storage.
 */
import { createHash } from "crypto";
import { PrismaClient } from "@prisma/client";
import { getStore } from "@netlify/blobs";

const prisma = new PrismaClient();

const STL_STORE = "stl-uploads";
const AVATAR_STORE = "messenger-avatars";
const ATTACHMENT_STORE = "message-attachments";

function stlStore() {
  return getStore({ name: STL_STORE, consistency: "strong" });
}

function avatarStore() {
  return getStore({ name: AVATAR_STORE, consistency: "strong" });
}

function attachmentStore() {
  return getStore({ name: ATTACHMENT_STORE, consistency: "strong" });
}

function avatarEtag(buffer, mimeType) {
  return `"${createHash("sha256").update(mimeType).update(buffer).digest("hex").slice(0, 32)}"`;
}

async function migrateStlSubmissions() {
  const rows = await prisma.stlSubmission.findMany({
    where: { fileData: { not: null } },
    select: { id: true, storageKey: true, fileData: true },
  });

  let migrated = 0;
  for (const row of rows) {
    if (!row.fileData?.length) continue;
    const existing = await stlStore().get(row.storageKey, { type: "arrayBuffer" });
    if (existing instanceof ArrayBuffer && existing.byteLength > 0) {
      await prisma.stlSubmission.update({
        where: { id: row.id },
        data: { fileData: null },
      });
      migrated += 1;
      continue;
    }

    const buffer = Buffer.from(row.fileData);
    await stlStore().set(row.storageKey, buffer);
    await prisma.stlSubmission.update({
      where: { id: row.id },
      data: { fileData: null },
    });
    migrated += 1;
    console.log(`STL ${row.id} → blob (${buffer.length} bytes)`);
  }
  console.log(`STL: migrated ${migrated} submission(s).`);
}

async function migrateAvatars() {
  const rows = await prisma.messengerUser.findMany({
    where: {
      avatarData: { not: null },
      avatarMimeType: { not: null },
    },
    select: { id: true, avatarData: true, avatarMimeType: true },
  });

  let migrated = 0;
  for (const row of rows) {
    if (!row.avatarData?.length || !row.avatarMimeType) continue;
    const key = `users/${row.id}`;
    const existing = await avatarStore().get(key, { type: "arrayBuffer" });
    const buffer = Buffer.from(row.avatarData);
    const etag = avatarEtag(buffer, row.avatarMimeType);

    if (!(existing instanceof ArrayBuffer && existing.byteLength > 0)) {
      await avatarStore().set(key, buffer);
    }

    await prisma.messengerUser.update({
      where: { id: row.id },
      data: {
        avatarStorageKey: key,
        avatarEtag: etag,
        avatarData: null,
      },
    });
    migrated += 1;
    console.log(`Avatar ${row.id} → blob (${buffer.length} bytes)`);
  }
  console.log(`Avatars: migrated ${migrated} user(s).`);
}

async function migrateMessageAttachments() {
  const rows = await prisma.message.findMany({
    where: {
      attachmentData: { not: null },
      attachmentStorageKey: null,
    },
    select: {
      id: true,
      attachmentData: true,
      attachmentFileName: true,
      attachmentMimeType: true,
      attachmentSizeBytes: true,
    },
  });

  let migrated = 0;
  for (const row of rows) {
    if (!row.attachmentData?.length) continue;
    const chunkKey = `messages/${row.id}/chunk-000000`;
    const existing = await attachmentStore().get(chunkKey, { type: "arrayBuffer" });
    const buffer = Buffer.from(row.attachmentData);

    if (!(existing instanceof ArrayBuffer && existing.byteLength > 0)) {
      await attachmentStore().set(chunkKey, buffer);
    }

    await prisma.message.update({
      where: { id: row.id },
      data: {
        attachmentStorageKey: `messages/${row.id}`,
        attachmentChunkCount: 1,
        attachmentData: null,
      },
    });
    migrated += 1;
    console.log(`Attachment ${row.id} → blob (${buffer.length} bytes)`);
  }
  console.log(`Attachments: migrated ${migrated} message(s).`);
}

async function main() {
  console.log("Migrating legacy binary data from Postgres to Netlify Blobs…");
  await migrateStlSubmissions();
  await migrateAvatars();
  await migrateMessageAttachments();
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
