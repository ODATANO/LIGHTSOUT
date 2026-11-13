// The first import of each script: a failure ends it with one line and exit code 1.
// LIGHTSOUT_TRACE=1 prints the whole error with its stack.
import './websocket.js';
import { reasonOf } from './reason.js';

function end(e: unknown): never {
  console.error(process.env.LIGHTSOUT_TRACE ? e : `error: ${reasonOf(e)}`);
  process.exit(1);
}
process.on('uncaughtException', end);
process.on('unhandledRejection', end);
