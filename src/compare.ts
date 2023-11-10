import { mkdir, rm, stat, unlink } from "node:fs/promises";
import { join } from "node:path";

import { error, log } from "logging.js";
import type { CompareDirectory, CompareOptions } from "types.js";
import {
  copy,
  exists,
  getDirectories,
  getFiles,
  readDirectory,
  secureCompare,
} from "utils.js";

const compareFiles = async (
  source: CompareDirectory,
  destination: CompareDirectory,
  options: CompareOptions,
): Promise<void> => {
  const sourceFiles = getFiles(source.entries);
  const destinationFiles = getFiles(destination.entries);

  for (const file of sourceFiles) {
    const sourcePath = join(source.basepath, file.name);
    const destinationPath = join(destination.basepath, file.name);

    if (options.verbose) {
      log(`comparing ${sourcePath} to ${destinationPath}`);
    }

    if (!(await exists(destinationPath, true))) {
      log(`copying file from ${sourcePath} to ${destinationPath}`);
      if (!options.dryRun) {
        await copy(sourcePath, destinationPath);
      }
      continue;
    }

    const [sourceStat, destinationStat] = await Promise.all([
      stat(sourcePath),
      stat(destinationPath),
    ]);

    if (sourceStat.size !== destinationStat.size) {
      log(`copying file from ${sourcePath} to ${destinationPath}`);
      if (!options.dryRun) {
        await copy(sourcePath, destinationPath);
      }
      continue;
    }

    if (options.secure && !(await secureCompare(sourcePath, destinationPath))) {
      log(`copying file from ${sourcePath} to ${destinationPath}`);
      if (!options.dryRun) {
        await copy(sourcePath, destinationPath);
      }
    }
  }

  for (const file of destinationFiles) {
    const sourcePath = join(source.basepath, file.name);
    const destinationPath = join(destination.basepath, file.name);
    if (!(await exists(sourcePath))) {
      log(
        `deleting file from ${destinationPath} because it does not exist in the source`,
      );
      if (!options.dryRun) {
        await unlink(destinationPath);
      }
    }
  }
};

const compareDirectories = async (
  source: CompareDirectory,
  destination: CompareDirectory,
  options: CompareOptions,
): Promise<void> => {
  const sourceDirectories = getDirectories(source.entries);
  const destinationDirectories = getDirectories(destination.entries);

  for (const dir of sourceDirectories) {
    const sourcePath = join(source.basepath, dir.name);
    const destinationPath = join(destination.basepath, dir.name);
    if (!(await exists(destinationPath, true))) {
      log(`creating directory ${destinationPath}`);
      await mkdir(destinationPath);
    }

    await compare(sourcePath, destinationPath, options);
  }

  for (const dir of destinationDirectories) {
    const sourcePath = join(source.basepath, dir.name);
    const destinationPath = join(destination.basepath, dir.name);

    if (!(await exists(sourcePath))) {
      log(
        `deleting directory ${destinationPath} because it does not exist in the source`,
      );
      if (!options.dryRun) {
        await rm(destinationPath, { force: true, recursive: true });
      }
    }
  }
};

export const compare = async (
  source: string,
  destination: string,
  options: CompareOptions,
): Promise<void> => {
  const [sourceDir, destinationDir] = await Promise.all([
    readDirectory(source),
    readDirectory(destination),
  ]);

  if (!sourceDir) {
    error(`Error reading opening source directory: ${source}`);
    return;
  }

  if (!destinationDir) {
    error(`Error reading opening destination directory: ${destination}`);
    return;
  }

  await compareFiles(
    { basepath: source, entries: sourceDir },
    { basepath: destination, entries: destinationDir },
    options,
  );

  await compareDirectories(
    { basepath: source, entries: sourceDir },
    { basepath: destination, entries: destinationDir },
    options,
  );
};
