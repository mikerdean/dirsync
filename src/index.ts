import { createCommand } from "commander";

import { compare } from "./compare.js";
import { error, log } from "logging.js";
import type { CompareOptions } from "types.js";

const main = async (): Promise<void> => {
  const program = createCommand();

  program
    .usage("[options] <source> <destination ...>")
    .option("-d, --dry-run", "enable dry run mode", false)
    .option("-s, --secure", "enable secure file comparison (slow)", false)
    .option("-v, --verbose", "enable verbose log output", false);

  program.parse();

  const source = program.args[0];
  const destinations = program.args.slice(1);

  if (!source) {
    error(
      "Please provide a source directory and at least one destination directory.",
    );
    return;
  }

  if (destinations.length === 0) {
    error("Please provide at least one destination directory.");
    return;
  }

  const options = program.opts<CompareOptions>();

  if (options.secure) {
    log("Secure mode enabled");
  }

  if (options.dryRun) {
    log("Dry run mode enabled");
  }

  for (const destination of destinations) {
    log(`Comparing ${source} to ${destination}...`);
    await compare(source, destination, options);
  }

  log("Done");
};

main();
