/** Max characters allowed in a messenger message body. */
export const MESSAGE_BODY_MAX_LENGTH = 40_000;

export function canonicalParticipantIds(
  userIdA: string,
  userIdB: string
): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}
