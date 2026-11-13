// Loaded before anything connects: every socket of this process is one of the ws package.
// Node's own WebSocket reports no close after a refused connection, and the client the wallet
// keeps for the node then never connects again.
import { WebSocket } from 'ws';

// The global is typed as the browser's class, which ws implements without sharing its type.
globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;
