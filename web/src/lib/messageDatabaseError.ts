export function messengerDatabaseErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message.includes("MessengerUser") ||
    message.includes("does not exist") ||
    message.includes("P2021")
  ) {
    return "Messenger is not set up on the server yet. Database migrations still need to run.";
  }
  return "Messenger is temporarily unavailable. Try again shortly.";
}
