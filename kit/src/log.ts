/** Prints a line with the time of day. */
export function say(line: string): void {
  console.log(`${new Date().toISOString().slice(11, 19)} ${line}`);
}
