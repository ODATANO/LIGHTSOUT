/**
 * An error's message, with the message of the first error behind it that says more. Libraries
 * wrap a failure and keep the reason on `cause`.
 */
export function reasonOf(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  let root: Error = e;
  for (let depth = 0; root.cause instanceof Error && depth < 8; depth++) root = root.cause;
  return root === e || e.message.includes(root.message) ? e.message : `${e.message} Cause: ${root.message}`;
}
