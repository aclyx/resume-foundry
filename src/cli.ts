#!/usr/bin/env node

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderHtml } from "./html.js";
import { parseResumeMarkdownResult } from "./markdown.js";
import { renderPdf } from "./pdf.js";
import { baselineResumeTheme, staffSoftwareEngineeringTheme, type ResumeTheme } from "./theme.js";

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
  resume-foundry validate <input.md>
  resume-foundry render <input.md> --theme staff --format html
  resume-foundry render <input.md> --theme staff --format pdf

Formats:
  json       Print validated ResumeDocument JSON. This is the default.
  markdown   Print normalized Markdown with YAML frontmatter.
  html       Print rendered semantic HTML.
  pdf        Print rendered PDF bytes, or write them with --output <file>.`;

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
  case "validate":
    runValidateCommand(args);
    break;
  case "render":
    await runRenderCommand(args);
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

function runValidateCommand(args: string[]): void {
  const [inputPath] = args;

  if (!inputPath) {
    console.error("Missing input path.");
    console.error("Usage: resume-foundry validate <input.md>");
    process.exitCode = 1;
    return;
  }

  const result = parseResumeMarkdownResult(readFileSync(inputPath, "utf8"));

  if (!result.success) {
    console.error(result.summary);
    process.exitCode = 1;
    return;
  }

  console.log(`Valid resume: ${result.data.basics.name}`);
}

async function runRenderCommand(args: string[]): Promise<void> {
  const [inputPath, ...options] = args;

  if (!inputPath) {
    console.error("Missing input path.");
    console.error("Usage: resume-foundry render <input.md> --theme staff --format html|pdf");
    process.exitCode = 1;
    return;
  }

  const format = readRenderFormatOption(options);
  const outputPath = readOptionValue(options, "--output", "-o");
  const theme = resolveTheme(readOptionValue(options, "--theme", "-t"));
  const variant = readOptionValue(options, "--variant", "-v");
  const pageSize = readOptionValue(options, "--page-size");
  const result = parseResumeMarkdownResult(readFileSync(inputPath, "utf8"));

  if (!result.success) {
    console.error(result.summary);
    process.exitCode = 1;
    return;
  }

  const renderOptions = {
    pageSize: pageSize === "a4" || pageSize === "letter" ? pageSize : undefined,
    theme,
    variant,
  } as const;

  if (format === "html") {
    const html = renderHtml(result.data, renderOptions);

    writeOutput(outputPath, html);
    return;
  }

  const pdf = await renderPdf(result.data, renderOptions);

  if (outputPath) {
    writeFileSync(outputPath, pdf);
    return;
  }

  process.stdout.write(pdf);
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

function readRenderFormatOption(options: string[]): "html" | "pdf" {
  const format = readOptionValue(options, "--format", "-f") ?? "html";

  if (format === "html" || format === "pdf") {
    return format;
  }

  console.error("Invalid format. Use --format html or --format pdf.");
  process.exit(1);
}

function readOptionValue(options: string[], longName: string, shortName?: string): string | undefined {
  const optionIndex = options.findIndex((option) => option === longName || option === shortName);

  if (optionIndex === -1) {
    return undefined;
  }

  return options[optionIndex + 1];
}

function resolveTheme(themeName = "baseline"): ResumeTheme {
  switch (themeName) {
    case "baseline":
    case "default":
      return baselineResumeTheme;
    case "staff":
    case "staff-software-engineering":
      return staffSoftwareEngineeringTheme;
    default:
      console.error(`Unknown theme: ${themeName}`);
      console.error("Available themes: baseline, staff");
      process.exit(1);
  }
}

function writeOutput(outputPath: string | undefined, output: string): void {
  if (outputPath) {
    writeFileSync(outputPath, output);
    return;
  }

  console.log(output);
}
