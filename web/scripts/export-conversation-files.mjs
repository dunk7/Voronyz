/**
 * Export all files/photos from a messenger DM to a local folder.
 *
 * Usage (from web/):
 *   node scripts/export-conversation-files.mjs --users braydengay,dunk7
 *   node scripts/export-conversation-files.mjs --users braydengay,dunk7 --out ./exports/braydengay-dunk7
 *
 * Requires:
 *   DATABASE_URL or DIRECT_DATABASE_URL
 *   NETLIFY_AUTH_TOKEN + NETLIFY_SITE_ID (for blob-stored attachments)
 */
import { createWriteStream, mkdirSync, writeFileSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { getStore } from "@netlify/blobs";
import { loadDotenv } from "./load-dotenv.mjs";
import { resolveDatabaseUrlForMigrations } from "./resolve-database-url-for-migrations.mjs";

loadDotenv();

const NETLIFY_SITE_ID =
  process.env.NETLIFY_SITE_ID?.trim() ?? "cd229aa6-16ce-4912-8da2-39b756823133";
const MESSAGE_STORE = "message-attachments";
const AVATAR_STORE = "messenger-avatars";

function parseArgs(argv) {
  const args = { users: [], out: null, includeAvatars: true };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--users" && argv[i + 1]) {
      args.users = argv[++i].split(",").map((u) => u.trim().replace(/^@/, "")).filter(Boolean);
    } else if (arg === "--out" && argv[i + 1]) {
      args.out = argv[++i];
    } else if (arg === "--no-avatars") {
      args.includeAvatars = false;
    }
  }
  return args;
}

function blobStore(name) {
  const token =
    process.env.NETLIFY_AUTH_TOKEN?.trim() ??
    process.env.NETLIFY_BLOBS_TOKEN?.trim();
  if (NETLIFY_SITE_ID && token) {
    return getStore({ name, siteID: NETLIFY_SITE_ID, token, consistency: "strong" });
  }
  return getStore({ name, consistency: "strong" });
}

function safeFileName(name, fallback = "file") {
  const cleaned = (name || fallback).replace(/[^\w.\-()+ ]/g, "_").slice(0, 180);
  return cleaned || fallback;
}

function isoStamp(date) {
  return new Date(date).toISOString().replace(/[:.]/g, "-");
}

async function readMessageAttachment(message) {
  const store = blobStore(MESSAGE_STORE);

  if (message.attachmentStorageKey && message.attachmentChunkCount) {
    const chunks = [];
    for (let i = 0; i < message.attachmentChunkCount; i++) {
      const key = `messages/${message.id}/chunk-${String(i).padStart(6, "0")}`;
      const data = await store.get(key, { type: "arrayBuffer" });
      if (!(data instanceof ArrayBuffer) || data.byteLength === 0) {
        throw new Error(`Missing blob chunk ${i} for message ${message.id}`);
      }
      chunks.push(Buffer.from(data));
    }
    return Buffer.concat(chunks);
  }

  if (message.attachmentData?.length) {
    return Buffer.from(message.attachmentData);
  }

  return null;
}

async function readAvatar(userId, avatarData) {
  const store = blobStore(AVATAR_STORE);
  const blob = await store.get(`users/${userId}`, { type: "arrayBuffer" });
  if (blob instanceof ArrayBuffer && blob.byteLength > 0) {
    return Buffer.from(blob);
  }
  if (avatarData?.length) {
    return Buffer.from(avatarData);
  }
  return null;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.users.length !== 2) {
    console.error("Usage: node scripts/export-conversation-files.mjs --users user1,user2 [--out dir]");
    process.exit(1);
  }

  const databaseUrl = resolveDatabaseUrlForMigrations();
  if (!databaseUrl) {
    console.error("DATABASE_URL or DIRECT_DATABASE_URL must be set.");
    process.exit(1);
  }

  const [usernameA, usernameB] = args.users;
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

  try {
    const users = await prisma.messengerUser.findMany({
      where: { username: { in: [usernameA, usernameB] } },
      select: {
        id: true,
        username: true,
        avatarMimeType: true,
        avatarData: true,
      },
    });

    const userA = users.find((u) => u.username === usernameA);
    const userB = users.find((u) => u.username === usernameB);
    if (!userA || !userB) {
      const found = users.map((u) => u.username).join(", ") || "(none)";
      throw new Error(`Could not find both users. Found: ${found}`);
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { members: { some: { userId: userA.id } } },
          { members: { some: { userId: userB.id } } },
        ],
      },
      select: { id: true },
    });

    if (!conversation) {
      throw new Error(`No direct conversation between @${usernameA} and @${usernameB}.`);
    }

    const outDir = resolve(
      args.out ?? join(dirname(fileURLToPath(import.meta.url)), "..", "exports", `${usernameA}-${usernameB}`)
    );
    mkdirSync(outDir, { recursive: true });
    const filesDir = join(outDir, "files");
    mkdirSync(filesDir, { recursive: true });

    console.log(`Conversation ${conversation.id}`);
    console.log(`Exporting to ${outDir}`);

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        body: true,
        createdAt: true,
        senderId: true,
        attachmentFileName: true,
        attachmentMimeType: true,
        attachmentSizeBytes: true,
        attachmentStorageKey: true,
        attachmentChunkCount: true,
        attachmentData: true,
        sender: { select: { username: true } },
      },
    });

    const manifest = {
      exportedAt: new Date().toISOString(),
      conversationId: conversation.id,
      participants: [usernameA, usernameB],
      messageCount: messages.length,
      files: [],
      messages: [],
    };

    let fileIndex = 0;
    for (const message of messages) {
      const entry = {
        id: message.id,
        at: message.createdAt.toISOString(),
        from: message.sender.username,
        body: message.body,
        attachment: null,
      };

      if (message.attachmentFileName) {
        fileIndex += 1;
        const ext = message.attachmentFileName.includes(".")
          ? message.attachmentFileName.slice(message.attachmentFileName.lastIndexOf("."))
          : "";
        const baseName = `${String(fileIndex).padStart(4, "0")}_${isoStamp(message.createdAt)}_${message.sender.username}_${safeFileName(message.attachmentFileName, `attachment${ext}`)}`;
        const dest = join(filesDir, baseName);

        try {
          const bytes = await readMessageAttachment(message);
          if (!bytes?.length) {
            console.warn(`  skip ${message.id}: no attachment bytes`);
          } else {
            writeFileSync(dest, bytes);
            entry.attachment = {
              fileName: message.attachmentFileName,
              mimeType: message.attachmentMimeType,
              sizeBytes: bytes.length,
              savedAs: `files/${baseName}`,
            };
            console.log(`  saved ${baseName} (${bytes.length} bytes)`);
          }
        } catch (err) {
          console.warn(`  failed ${message.id}: ${err instanceof Error ? err.message : err}`);
          entry.attachment = {
            fileName: message.attachmentFileName,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      manifest.messages.push(entry);
      if (entry.attachment?.savedAs) manifest.files.push(entry.attachment);
    }

    if (args.includeAvatars) {
      const avatarsDir = join(outDir, "avatars");
      mkdirSync(avatarsDir, { recursive: true });
      for (const user of [userA, userB]) {
        if (!user.avatarMimeType) continue;
        const ext = user.avatarMimeType.split("/")[1]?.replace("jpeg", "jpg") ?? "bin";
        const dest = join(avatarsDir, `${user.username}.${ext}`);
        try {
          const bytes = await readAvatar(user.id, user.avatarData);
          if (bytes?.length) {
            writeFileSync(dest, bytes);
            console.log(`  avatar ${user.username} (${bytes.length} bytes)`);
          }
        } catch (err) {
          console.warn(`  avatar ${user.username} failed: ${err instanceof Error ? err.message : err}`);
        }
      }
    }

    writeFileSync(join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`Done. ${manifest.files.length} file(s), manifest.json written.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
