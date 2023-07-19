import type { Dirent } from "fs";

export type CompareOptions = {
  dryRun: boolean;
  secure: boolean;
  verbose: boolean;
};

export type CompareDirectory = {
  basepath: string;
  entries: Dirent[];
};
