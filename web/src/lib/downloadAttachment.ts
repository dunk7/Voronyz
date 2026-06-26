/** Download an authenticated attachment without navigating away from the page. */
export async function downloadAttachment(
  url: string,
  fileName: string
): Promise<void> {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) {
    throw new Error("Download failed");
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

/** Download multiple attachments sequentially (avoids mobile browser throttling). */
export async function downloadAttachments(
  items: { url: string; fileName: string }[]
): Promise<void> {
  for (const item of items) {
    await downloadAttachment(item.url, item.fileName);
  }
}
