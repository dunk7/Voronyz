export function canonicalParticipantIds(
  userIdA: string,
  userIdB: string
): [string, string] {
  return userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
}
