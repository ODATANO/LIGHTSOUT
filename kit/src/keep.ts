import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** Writes a file whole or not at all, so that a stop in between leaves the old content. Makes its folder. */
export async function keepFile(file: string, text: string): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const part = `${file}.${process.pid}.part`;
  await writeFile(part, text);
  await rename(part, file);
}

/** The JSON a file holds; undefined when there is no such file. A file that does not parse is an error. */
export async function keptJson<T>(file: string): Promise<T | undefined> {
  const text = await readFile(file, 'utf8').catch((e: NodeJS.ErrnoException) => {
    if (e.code === 'ENOENT') return undefined;
    throw e;
  });
  if (text === undefined) return undefined;
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`${file} is damaged: it holds no JSON`);
  }
}
