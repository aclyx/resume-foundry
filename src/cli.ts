#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
) as { version: string };

const helpText = `resume-foundry

Render structured resume data into themed HTML, PDF, and Markdown outputs.

Usage:
  resume-foundry --help
  resume-foundry --version

The conversion command is not implemented yet.`;

const [argument] = process.argv.slice(2);

switch (argument) {
  case undefined:
  case "--help":
  case "-h":
    console.log(helpText);
    break;
  case "--version":
  case "-v":
    console.log(packageJson.version);
    break;
  default:
    console.error(`Unknown option: ${argument}`);
    console.error("Run resume-foundry --help for usage.");
    process.exitCode = 1;
}
