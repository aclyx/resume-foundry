import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { resumeDocumentJsonSchema } from "../schema.js";

const packageRoot = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const schemaPath = join(packageRoot, "schemas", "resume-document.schema.json");

mkdirSync(dirname(schemaPath), { recursive: true });
writeFileSync(schemaPath, `${JSON.stringify(resumeDocumentJsonSchema, null, 2)}\n`);
