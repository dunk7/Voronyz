export const MESSAGE_DOWN_MESSAGE =
  "Messenger is temporarily unavailable. Try again shortly.";

export function isMessageDisabled(): boolean {
  const value = process.env.MESSAGE_DISABLED?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}
