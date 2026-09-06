/** Live unless an admin turns it off, or MESSAGE_DISABLED=true is set. */
export const MESSAGE_ENABLED_BY_DEFAULT = true;

export function parseMessageEnabledValue(value: string | null | undefined): boolean {
  if (value == null) return MESSAGE_ENABLED_BY_DEFAULT;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return MESSAGE_ENABLED_BY_DEFAULT;
  return normalized === "1" || normalized === "true" || normalized === "yes";
}
