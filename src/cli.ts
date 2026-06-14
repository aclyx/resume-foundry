#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseResumeMarkdownResult } from "./markdown.js";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageJson = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
) as { version: string };

const helpText = `resume-foundry

Render structured resume data into themed HTML, PDF, and Markdown outputs.

Usage:
  resume-foundry --help
  resume-foundry --version
  resume-foundry parse <input.md> [--format json|markdown]

Formats:
  json       Print validated ResumeDocument JSON. This is the default.
  markdown   Print normalized Markdown with YAML frontmatter.`;

const [argument, ...args] = process.argv.slice(2);

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
  case "parse":
    runParseCommand(args);
    break;
  default:
    console.error(`Unknown option: ${argument}`);
    console.error("Run resume-foundry --help for usage.");
    process.exitCode = 1;
}

function runParseCommand(args: string[]): void {
  const [inputPath, ...options] = args;

  if (!inputPath) {
    console.error("Missing input path.");
    console.error("Usage: resume-foundry parse <input.md> [--format json|markdown]");
    process.exitCode = 1;
    return;
  }

  const format = readFormatOption(options);
  const markdown = readFileSync(inputPath, "utf8");
  const result = parseResumeMarkdownResult(markdown);

  if (!result.success) {
    console.error(result.summary);
    process.exitCode = 1;
    return;
  }

  console.log(format === "markdown" ? result.markdown.trimEnd() : result.json.trimEnd());
}

function readFormatOption(options: string[]): "json" | "markdown" {
  const formatIndex = options.findIndex((option) => option === "--format" || option === "-f");

  if (formatIndex === -1) {
    return "json";
  }

  const format = options[formatIndex + 1];

  if (format === "json" || format === "markdown") {
    return format;
  }

  console.error("Invalid format. Use --format json or --format markdown.");
  process.exit(1);
}
