import { createReadStream, createWriteStream, type Dirent } from "node:fs";
import { access, constants, readdir } from "node:fs/promises";
import streamEqual from "stream-equal";

export const readDirectory = async (
  path: string,
): Promise<Dirent[] | undefined> => {
  try {
    const dir = await readdir(path, { withFileTypes: true });
    return dir;
  } catch {
    return undefined;
  }
};

export const copy = (source: string, destination: string): Promise<void> =>
  new Promise((resolve, reject) => {
    const read = createReadStream(source);
    const write = createWriteStream(destination, { flags: "w+" });

    read.pipe(write);

    write.on("error", reject);
    write.on("finish", resolve);
  });

export const getFiles = (dir: Dirent[]) => dir.filter((x) => x.isFile());

export const getDirectories = (dir: Dirent[]) =>
  dir.filter((x) => x.isDirectory());

export const exists = async (
  path: string,
  writeable = false,
): Promise<boolean> => {
  const mode = writeable
    ? constants.F_OK | constants.R_OK | constants.W_OK
    : constants.F_OK | constants.R_OK;

  try {
    await access(path, mode);
    return true;
  } catch {
    return false;
  }
};

export const secureCompare = (
  source: string,
  destination: string,
): Promise<boolean> =>
  streamEqual(createReadStream(source), createReadStream(destination));
