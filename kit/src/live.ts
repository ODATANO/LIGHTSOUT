// A published package carries the public settings of the live deployment in live-deployment.env.
// They fill what the environment leaves unset. A checkout has no such file and reads its .env.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../live-deployment.env', import.meta.url));

/** Whether this is the package from npm, not a checkout. */
export const published = existsSync(file);
if (published) process.loadEnvFile(file);
