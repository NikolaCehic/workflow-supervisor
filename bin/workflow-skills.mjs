#!/usr/bin/env node
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const PACKAGE_NAME = "workflow-supervisor";
const PACKAGE_VERSION = "0.1.1";
const WORKER_REPORT_SCHEMA_PATH = path.join(packageRoot, "schemas", "worker-report-v1.schema.json");
const DOSSIER_SCHEMA_PATH = path.join(packageRoot, "schemas", "dossier-v1.schema.json");
const ADAPTERS_ROOT = path.join(packageRoot, "adapters");
const INSTALLABLE_AGENTS = ["codex", "claude-code"];
const AGENTS = new Set([...INSTALLABLE_AGENTS, "generic"]);
const DELEGATE_AGENTS = new Set(["codex", "claude-code"]);
const WORKER_ROLES = new Set(["implementer", "verifier", "repair", "documenter"]);
const REPORT_STATUSES = new Set(["PASS", "FAIL", "BLOCKED"]);
const WORKFLOW_STATE_IGNORE_ENTRY = ".workflow/";

function usage() {
  return `workflow-supervisor

Usage:
  workflow-supervisor list [--root <path>]
  workflow-supervisor validate [--root <path>]
  workflow-supervisor validate-dossier <path> [--role <role>] [--unit <unit-id>] [--json]
  workflow-supervisor doctor [--agent <agent|all>] [--scope user|project] [--project <path>] [--target <path>]
  workflow-supervisor install --agent <agent|all> [--scope user|project] [--project <path>] [--target <path>] [--skills all|a,b] [--force] [--dry-run]
  workflow-supervisor uninstall --agent <agent|all> [--scope user|project] [--project <path>] [--target <path>] [--skills all|a,b] [--dry-run]
  workflow-supervisor emit-context --agent <agent> [--scope user|project] [--project <path>] [--target <path>] [--skills all|a,b] [--out <path>] [--root <path>]
  workflow-supervisor delegate --agent <agent> --role <role> --unit <unit-id> [--cwd <path>] [--dossier <path>] [--adapter-command <json-array>] [--prompt-mode stdin|arg] [--timeout-ms <ms>] [--allow-dirty]
  workflow-supervisor delegate-doctor --agent <agent|all> [--adapter-command <json-array>] [--prompt-mode stdin|arg] [--probe] [--require-pass] [--cwd <path>]

Agents:
  codex, claude-code, generic, all

Alias:
  workflow-skills

Examples:
  npx workflow-supervisor install --agent codex --scope user
  npx workflow-supervisor install --agent all --scope project --project .
  npx workflow-supervisor install --agent generic --target ./agent-skills
  npx workflow-supervisor validate-dossier .workflow/dossiers/U1-implementer.yaml --role implementer --unit U1 --json
  npx workflow-supervisor emit-context --agent generic --skills workflow-supervisor,workflow-docs --out AGENTS.md
  npx workflow-supervisor delegate --agent claude-code --role verifier --unit U1 --dossier .workflow/DOSSIER.md
`;
}

function parseArgs(argv) {
  const result = { _: [] };
  const booleans = new Set(["force", "dry-run", "help", "allow-dirty", "probe", "require-pass", "json"]);
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      result._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (booleans.has(key)) {
      result[key] = true;
      continue;
    }
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
    result[key] = next;
    i += 1;
  }
  return result;
}

function expandHome(input) {
  if (!input) return input;
  if (input === "~") return os.homedir();
  if (input.startsWith("~/")) return path.join(os.homedir(), input.slice(2));
  return input;
}

function skillsRoot(root = packageRoot) {
  return path.join(root, "skills");
}

function schemasRoot(root = packageRoot) {
  return path.join(root, "schemas");
}

function adaptersRoot(root = packageRoot) {
  return path.join(root, "adapters");
}

function workerReportSchemaPath(root = packageRoot) {
  return path.join(schemasRoot(root), "worker-report-v1.schema.json");
}

function dossierSchemaPath(root = packageRoot) {
  return path.join(schemasRoot(root), "dossier-v1.schema.json");
}

function listSkills(root = packageRoot) {
  const rootDir = skillsRoot(root);
  if (!fs.existsSync(rootDir)) throw new Error(`Missing skills directory: ${rootDir}`);
  return fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function normalizeScope(scope = "user") {
  if (scope !== "user" && scope !== "project") throw new Error("--scope must be user or project");
  return scope;
}

function defaultTarget(agent, { scope = "user", project = process.cwd() } = {}) {
  const home = os.homedir();
  const resolvedScope = normalizeScope(scope);
  const projectRoot = path.resolve(expandHome(project));
  switch (agent) {
    case "codex":
      return resolvedScope === "project"
        ? path.join(projectRoot, ".agents", "skills")
        : path.join(home, ".agents", "skills");
    case "claude-code":
      return resolvedScope === "project"
        ? path.join(projectRoot, ".claude", "skills")
        : path.join(process.env.CLAUDE_HOME || path.join(home, ".claude"), "skills");
    case "generic":
      return null;
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
}

function workflowStateAlreadyIgnored(text) {
  return text.split(/\r?\n/).some((line) => {
    const trimmed = line.trim();
    return trimmed === WORKFLOW_STATE_IGNORE_ENTRY || trimmed === ".workflow" || trimmed === ".workflow/**";
  });
}

function ensureWorkflowStateIgnored(project, dryRun = false) {
  const projectRoot = path.resolve(expandHome(project || process.cwd()));
  const file = path.join(projectRoot, ".gitignore");
  const existing = fs.existsSync(file) ? readText(file) : "";
  const alreadyPresent = workflowStateAlreadyIgnored(existing);
  const result = {
    file,
    entry: WORKFLOW_STATE_IGNORE_ENTRY,
    changed: !alreadyPresent,
    alreadyPresent,
    dryRun: Boolean(dryRun),
  };

  if (alreadyPresent || dryRun) return result;

  fs.mkdirSync(projectRoot, { recursive: true });
  const separator = existing.length > 0 && !existing.endsWith("\n") ? "\n" : "";
  fs.writeFileSync(file, `${existing}${separator}${WORKFLOW_STATE_IGNORE_ENTRY}\n`);
  return result;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return null;
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) return null;
  const raw = text.slice(4, end).trim().split(/\r?\n/);
  const parsed = {};
  for (const line of raw) {
    const idx = line.indexOf(":");
    if (idx === -1) return null;
    parsed[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return parsed;
}

function validateSkill(root, name) {
  const skillDir = path.join(skillsRoot(root), name);
  const skillFile = path.join(skillDir, "SKILL.md");
  const errors = [];
  if (!fs.existsSync(skillFile)) return ["missing SKILL.md"];

  const text = readText(skillFile);
  const frontmatter = parseFrontmatter(text);
  if (!frontmatter) {
    errors.push("invalid frontmatter");
  } else {
    const keys = Object.keys(frontmatter).sort();
    if (keys.join(",") !== "description,name") errors.push("frontmatter must contain only name and description");
    if (frontmatter.name !== name) errors.push(`frontmatter name ${frontmatter.name || "<missing>"} does not match folder ${name}`);
    if (!frontmatter.description || frontmatter.description.length < 80) errors.push("description is missing or too short");
  }

  if (/\[TODO|TODO:|Structuring This Skill|Not every skill requires/.test(text)) errors.push("contains scaffold/TODO text");

  const agentFile = path.join(skillDir, "agents", "openai.yaml");
  if (fs.existsSync(agentFile)) {
    const agentYaml = readText(agentFile);
    if (!agentYaml.includes(`Use $${name}`)) errors.push("agents/openai.yaml default prompt must mention skill name");
    if (!agentYaml.includes("allow_implicit_invocation: false")) errors.push("skills must be opt-in by default");
  }
  return errors;
}

function validateRuntimeArtifacts(root = packageRoot) {
  const errors = [];
  const schemaFile = workerReportSchemaPath(root);
  if (!fs.existsSync(schemaFile)) {
    errors.push(`schema: missing ${schemaFile}`);
  } else {
    try {
      const schema = parseJsonFile(schemaFile, "WorkerReportV1 schema");
      if (schema.title !== "WorkerReportV1") errors.push("schema: title must be WorkerReportV1");
      if (schema.properties?.schema?.const !== "WorkerReportV1") errors.push("schema: schema.const must be WorkerReportV1");
      const statuses = schema.properties?.status?.enum || [];
      if (JSON.stringify(statuses) !== JSON.stringify([...REPORT_STATUSES])) {
        errors.push("schema: status enum must be PASS, FAIL, BLOCKED");
      }
    } catch (error) {
      errors.push(`schema: ${error.message}`);
    }
  }

  const dossierSchemaFile = dossierSchemaPath(root);
  if (!fs.existsSync(dossierSchemaFile)) {
    errors.push(`schema: missing ${dossierSchemaFile}`);
  } else {
    try {
      const schema = parseJsonFile(dossierSchemaFile, "DossierV1 schema");
      if (schema.title !== "DossierV1") errors.push("schema: title must be DossierV1");
      if (schema.properties?.schema?.const !== "DossierV1") errors.push("schema: schema.const must be DossierV1");
    } catch (error) {
      errors.push(`schema: ${error.message}`);
    }
  }

  for (const agent of DELEGATE_AGENTS) {
    const file = path.join(adaptersRoot(root), agent, "adapter.json");
    if (!fs.existsSync(file)) {
      errors.push(`adapter ${agent}: missing ${file}`);
      continue;
    }
    try {
      const adapter = parseJsonFile(file, `${agent} adapter`);
      if (adapter.agent !== agent) {
        errors.push(`adapter ${agent}: declares agent ${adapter.agent || "<missing>"}`);
      }
      validateDelegateConfig(agent, adapter.delegate);
    } catch (error) {
      errors.push(`adapter ${agent}: ${error.message}`);
    }
  }

  return errors;
}

function validate(root = packageRoot) {
  const names = listSkills(root);
  const allErrors = [];
  for (const name of names) {
    for (const error of validateSkill(root, name)) allErrors.push(`${name}: ${error}`);
  }
  for (const error of validateRuntimeArtifacts(root)) allErrors.push(error);
  if (names.length === 0) allErrors.push("no skills found");
  if (allErrors.length > 0) throw new Error(`Validation failed:\n${allErrors.map((e) => `- ${e}`).join("\n")}`);
  return names;
}

function selectSkills(root, raw) {
  const names = listSkills(root);
  if (!raw || raw === "all") return names;
  const requested = raw.split(",").map((item) => item.trim()).filter(Boolean);
  for (const name of requested) {
    if (!names.includes(name)) throw new Error(`Unknown skill ${name}. Available: ${names.join(", ")}`);
  }
  return requested;
}

function walkFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    if (entry.isFile()) files.push(full);
  }
  return files.sort();
}

function hashDir(dir) {
  const hash = crypto.createHash("sha256");
  for (const file of walkFiles(dir)) {
    hash.update(path.relative(dir, file));
    hash.update("\0");
    hash.update(fs.readFileSync(file));
    hash.update("\0");
  }
  return hash.digest("hex");
}

const SKILL_SUMMARIES = {
  "workflow-supervisor": "coordinate open-ended agent loops and bind Codex goals when appropriate",
  "source-corpus": "rank and reconcile sources when source authority affects safe next action",
  "work-unit": "decompose broad objectives into bounded units",
  "dossier-builder": "create a delegation contract for one already-bounded work unit",
  "worker-roles": "separate implementer, verifier, repair, documentation, reviewer, and solo-mode responsibilities",
  "acceptance-matrix": "create formal evidence-mapped acceptance criteria",
  "loop-policy": "define retries, parallel safety, approval gates, and goal binding policy",
  "workflow-docs": "create durable workflow-state or documentation-production artifacts",
};

function skillSummary(name) {
  return SKILL_SUMMARIES[name] || "use the bundled SKILL.md instructions";
}

function markdownResourceFiles(skillDir) {
  const referencesDir = path.join(skillDir, "references");
  return walkFiles(referencesDir).filter((file) => file.endsWith(".md"));
}

function copyDir(src, dest, { force = false, dryRun = false } = {}) {
  if (fs.existsSync(dest)) {
    if (!force) throw new Error(`Destination exists: ${dest}. Use --force to overwrite.`);
    if (!dryRun) fs.rmSync(dest, { recursive: true, force: true });
  }
  if (dryRun) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function resolveAgents(raw = "generic") {
  if (raw === "all") return INSTALLABLE_AGENTS;
  if (!AGENTS.has(raw)) throw new Error(`Unsupported agent: ${raw}`);
  return [raw];
}

function resolveTarget(args, agent) {
  const scope = normalizeScope(args.scope || "user");
  if (args.target) return path.resolve(expandHome(args.target));
  const target = defaultTarget(agent, { scope, project: args.project || process.cwd() });
  if (!target) throw new Error(`--target is required for --agent ${agent} with --scope ${scope}`);
  return target;
}

function contextFor(agent, target, names = listSkills(packageRoot)) {
  const title = agent === "generic" ? "Workflow Skill Pack" : `Workflow Skill Pack for ${agent}`;
  const skillLines = names.map((name) => `- \`$${name}\`: ${skillSummary(name)}.`);
  return `# ${title}

Installed skills:

\`${target || "<custom skill directory>"}\`

Use these skills explicitly for supervised, long-running, or delegation-heavy workflows:

${skillLines.join("\n")}

Do not use this pack for tiny direct tasks, ordinary README edits, one-off tests, or routine review unless a supervised workflow or durable continuation state is explicitly needed.

In Git-backed codebases, keep workflow state local: ensure \`.workflow/\` is listed in \`.gitignore\` before creating workflow artifacts, and do not stage or publish \`.workflow/\` unless the user explicitly makes it a deliverable.
`;
}

function portableContextFor(root, agent, target, names) {
  const title = agent === "generic" ? "Workflow Skill Pack Portable Context" : `Workflow Skill Pack Portable Context for ${agent}`;
  const sections = [
    `# ${title}`,
    "",
    "This file embeds the selected Workflow Supervisor skills for agents that cannot discover `SKILL.md` folders directly.",
    "",
    "Use these skills explicitly for supervised, long-running, or delegation-heavy workflows. Loading or reading a skill does not by itself create a worker, thread, subagent, goal, commit, PR, publication, or other side effect; those actions require the governing environment tools and the gates described in the relevant skill.",
    "",
    `Expected skill directory: \`${target || "<custom skill directory>"}\``,
    "",
    "## Included Skills",
    "",
    ...names.map((name) => `- \`$${name}\`: ${skillSummary(name)}.`),
    "",
    "Do not use this pack for tiny direct tasks, ordinary README edits, one-off tests, or routine review unless a supervised workflow or durable continuation state is explicitly needed.",
    "",
    "In Git-backed codebases, keep workflow state local: ensure `.workflow/` is listed in `.gitignore` before creating workflow artifacts, and do not stage or publish `.workflow/` unless the user explicitly makes it a deliverable.",
    "",
  ];

  for (const name of names) {
    const skillDir = path.join(skillsRoot(root), name);
    const skillFile = path.join(skillDir, "SKILL.md");
    sections.push(`## Skill: $${name}`, "");
    sections.push(`Source: \`skills/${name}/SKILL.md\``, "");
    sections.push(readText(skillFile).trim(), "");

    for (const resourceFile of markdownResourceFiles(skillDir)) {
      const relative = path.relative(skillDir, resourceFile);
      sections.push(`### Bundled Reference: $${name}/${relative}`, "");
      sections.push(readText(resourceFile).trim(), "");
    }
  }

  return `${sections.join("\n")}\n`;
}

function parseJsonArray(value, label) {
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    throw new Error(`${label} must be a JSON array: ${error.message}`);
  }
  if (!Array.isArray(parsed) || parsed.length === 0 || parsed.some((item) => typeof item !== "string" || !item)) {
    throw new Error(`${label} must be a non-empty JSON array of strings`);
  }
  return parsed;
}

function parseJsonFile(file, label) {
  try {
    return JSON.parse(readText(file));
  } catch (error) {
    throw new Error(`${label} must be valid JSON: ${error.message}`);
  }
}

function unquoteScalar(value) {
  const trimmed = String(value || "").trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseInlineArray(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) return null;
  const body = trimmed.slice(1, -1).trim();
  if (!body) return [];
  return body.split(",").map((item) => unquoteScalar(item)).filter(Boolean);
}

function parseDossierScalar(value) {
  const inlineArray = parseInlineArray(value);
  if (inlineArray) return inlineArray;
  return unquoteScalar(value);
}

function parseSimpleYaml(text) {
  const result = {};
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!match) continue;
    const key = match[1];
    const rawValue = match[2] ?? "";

    if (rawValue === "|" || rawValue === ">") {
      const block = [];
      for (i += 1; i < lines.length; i += 1) {
        const next = lines[i];
        if (/^[A-Za-z_][A-Za-z0-9_-]*:/.test(next)) {
          i -= 1;
          break;
        }
        block.push(next.replace(/^ {2,}/, ""));
      }
      result[key] = rawValue === ">" ? block.join(" ").trim() : block.join("\n").trim();
      continue;
    }

    if (rawValue.trim()) {
      result[key] = parseDossierScalar(rawValue);
      continue;
    }

    const items = [];
    for (i += 1; i < lines.length; i += 1) {
      const next = lines[i];
      if (!next.trim() || next.trimStart().startsWith("#")) continue;
      if (/^[A-Za-z_][A-Za-z0-9_-]*:/.test(next)) {
        i -= 1;
        break;
      }
      const item = next.match(/^\s*-\s*(.*)$/);
      if (item) items.push(unquoteScalar(item[1]));
    }
    result[key] = items.length > 0 ? items : "";
  }
  return result;
}

function extractFencedBlock(text, languagePattern) {
  const fence = new RegExp(`\`\`\`(?:${languagePattern})\\s*\\n([\\s\\S]*?)\\n\`\`\``, "gi");
  let match;
  while ((match = fence.exec(text))) {
    if (/\b(schema|dossier_id|work_unit)\s*:/.test(match[1]) || match[1].trim().startsWith("{")) {
      return match[1].trim();
    }
  }
  return null;
}

function parseDossierText(text, label = "dossier") {
  const trimmed = text.trim();
  if (!trimmed) throw new Error(`${label} is empty`);
  const fencedJson = extractFencedBlock(trimmed, "json");
  const fencedYaml = extractFencedBlock(trimmed, "ya?ml");
  const candidate = fencedJson || fencedYaml || trimmed;
  if (candidate.trim().startsWith("{")) {
    try {
      return JSON.parse(candidate);
    } catch (error) {
      throw new Error(`${label} JSON is invalid: ${error.message}`);
    }
  }
  const parsed = parseSimpleYaml(candidate);
  if (Object.keys(parsed).length === 0) throw new Error(`${label} must be JSON, YAML, or fenced YAML`);
  return parsed;
}

const DOSSIER_STRING_FIELDS = [
  "workflow",
  "work_unit",
  "dossier_id",
  "worker_name",
  "worker_role",
  "delegation_transport",
  "start_condition",
  "title",
  "objective",
  "worker_prompt",
  "completion_report_schema",
  "verification_report_schema",
];

const DOSSIER_CORE_ARRAY_FIELDS = [
  "non_goals",
  "source_corpus",
  "must_read",
  "allowed_surfaces",
  "forbidden_surfaces",
  "acceptance_matrix",
  "adversarial_checks",
  "required_commands_or_evidence",
  "supervisor_checkpoints",
  "stop_gates",
];

const DOSSIER_EXPLICIT_ARRAY_FIELDS = ["assumptions", "open_questions"];

function isPlaceholder(value, { allowNone = false } = {}) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[.!]+$/, "");
  if (allowNone && /^(none|no open questions|no assumptions|empty)$/.test(normalized)) return false;
  return (
    !normalized ||
    /^(tbd|todo|unknown|unclear|n\/a|na|none|null|use your judgment|you decide|whatever|later|as needed|various|misc|etc)$/.test(normalized) ||
    /\b(tbd|todo|unknown|unclear|use your judgment|as needed|and so on)\b/.test(normalized)
  );
}

function fieldArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return [];
}

function validateConcreteArray(data, field, errors, options = {}) {
  const values = fieldArray(data[field]);
  if (values.length === 0) {
    errors.push(`${field} must be a non-empty array`);
    return values;
  }
  values.forEach((item, index) => {
    if (isPlaceholder(item, options)) errors.push(`${field}[${index}] is not concrete: ${item || "<empty>"}`);
  });
  return values;
}

function validateDossierData(data, { role, unitId } = {}) {
  const errors = [];
  const warnings = [];
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, errors: ["dossier must be an object"], warnings };
  }

  if (data.schema !== "DossierV1") errors.push("schema must be DossierV1");

  for (const field of DOSSIER_STRING_FIELDS) {
    if (typeof data[field] !== "string" || isPlaceholder(data[field])) {
      errors.push(`${field} must be a concrete non-empty string`);
    }
  }

  for (const field of DOSSIER_CORE_ARRAY_FIELDS) {
    validateConcreteArray(data, field, errors);
  }

  for (const field of DOSSIER_EXPLICIT_ARRAY_FIELDS) {
    validateConcreteArray(data, field, errors, { allowNone: true });
  }

  if (data.worker_role && !WORKER_ROLES.has(data.worker_role)) {
    errors.push(`worker_role must be one of: ${[...WORKER_ROLES].join(", ")}`);
  }
  if (role && data.worker_role && data.worker_role !== role) {
    errors.push(`worker_role ${data.worker_role} does not match requested role ${role}`);
  }
  if (unitId && data.work_unit) {
    const unitPattern = new RegExp(`(^|[^A-Za-z0-9])${unitId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z0-9]|$)`);
    if (data.work_unit !== unitId && !unitPattern.test(data.work_unit)) {
      errors.push(`work_unit ${data.work_unit} does not reference requested unit ${unitId}`);
    }
  }
  if (data.delegation_transport && !["portable_delegate", "native_thread", "native_subagent", "same_session_phased"].includes(data.delegation_transport)) {
    errors.push("delegation_transport must be portable_delegate, native_thread, native_subagent, or same_session_phased");
  }
  if (data.completion_report_schema && !/\bWorkerReportV1\b/.test(data.completion_report_schema)) {
    errors.push("completion_report_schema must name WorkerReportV1");
  }
  if (data.verification_report_schema && !/\bWorkerReportV1\b/.test(data.verification_report_schema)) {
    errors.push("verification_report_schema must name WorkerReportV1");
  }
  if (data.worker_prompt && !/\bWorkerReportV1\b/.test(data.worker_prompt)) {
    errors.push("worker_prompt must require WorkerReportV1");
  }
  if (data.worker_prompt && data.worker_role && !data.worker_prompt.toLowerCase().includes(data.worker_role.toLowerCase())) {
    errors.push("worker_prompt must name the worker role");
  }

  const broadSurface = /^(all|all files|everything|entire repo|whole repo|repo root|\.|\*|\*\*)$/i;
  for (const [field, values] of [
    ["allowed_surfaces", fieldArray(data.allowed_surfaces)],
    ["forbidden_surfaces", fieldArray(data.forbidden_surfaces)],
  ]) {
    values.forEach((surface, index) => {
      if (broadSurface.test(surface.trim())) errors.push(`${field}[${index}] is too broad: ${surface}`);
    });
  }

  fieldArray(data.acceptance_matrix).forEach((row, index) => {
    if (!/\b[A-Z]+[0-9]+\b/.test(row)) warnings.push(`acceptance_matrix[${index}] should include a stable row ID`);
  });

  const unresolved = fieldArray(data.open_questions).filter((item) => !/^(none|no open questions|empty)$/i.test(item));
  if (unresolved.length > 0) {
    errors.push("open_questions must be explicitly none before delegation; create a discovery dossier or stop as BLOCKED");
  }

  return { valid: errors.length === 0, errors, warnings };
}

function loadDossier(file) {
  const dossierPath = path.resolve(expandHome(file));
  if (!fs.existsSync(dossierPath)) throw new Error(`Missing dossier: ${dossierPath}`);
  const text = readText(dossierPath);
  return {
    path: dossierPath,
    text,
    data: parseDossierText(text, dossierPath),
  };
}

function validateDossierCommand(args) {
  const target = args.dossier || args._[1];
  if (!target) throw new Error("validate-dossier requires a dossier path");
  const loaded = loadDossier(target);
  const validation = validateDossierData(loaded.data, { role: args.role, unitId: args.unit });
  const report = {
    schema: "DossierValidationV1",
    dossier: loaded.path,
    valid: validation.valid,
    errors: validation.errors,
    warnings: validation.warnings,
  };
  if (!validation.valid) process.exitCode = 1;
  return args.json ? JSON.stringify(report, null, 2) : validation.valid
    ? `Dossier valid: ${loaded.path}`
    : `Dossier invalid: ${loaded.path}\n${validation.errors.map((error) => `- ${error}`).join("\n")}`;
}

function resolveDelegateDossier(args, cwd, { role, unitId }) {
  if (args["dossier-text"]) {
    return { text: args["dossier-text"], data: null, guardArgs: args };
  }
  if (!args.dossier) {
    return {
      blocked: blockedReport({
        role,
        unitId,
        reason: "invalid_dossier",
        summary: "Worker delegation requires --dossier with a valid DossierV1 contract.",
        adapter: null,
        guard: { allowed_surface_violations: [], role_violations: [], warnings: [] },
      }),
    };
  }

  const dossierPath = path.resolve(cwd, expandHome(args.dossier));
  const loaded = loadDossier(dossierPath);
  const validation = validateDossierData(loaded.data, { role, unitId });
  if (!validation.valid) {
    return {
      blocked: blockedReport({
        role,
        unitId,
        reason: "invalid_dossier",
        summary: `DossierV1 validation failed: ${validation.errors.join("; ")}`,
        adapter: null,
        guard: { allowed_surface_violations: [], role_violations: [], warnings: validation.warnings },
      }),
    };
  }

  return {
    text: loaded.text,
    data: loaded.data,
    guardArgs: {
      ...args,
      "allowed-surfaces": args["allowed-surfaces"] || fieldArray(loaded.data.allowed_surfaces).join(","),
      "forbidden-surfaces": args["forbidden-surfaces"] || fieldArray(loaded.data.forbidden_surfaces).join(","),
    },
  };
}

function splitCsv(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function excerpt(value, max = 2000) {
  const text = String(value || "");
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}

function workerReportSchemaText() {
  return readText(WORKER_REPORT_SCHEMA_PATH);
}

function adapterConfigPath(agent) {
  return path.join(ADAPTERS_ROOT, agent, "adapter.json");
}

function validateDelegateConfig(agent, delegate) {
  const errors = [];
  if (!delegate || typeof delegate !== "object" || Array.isArray(delegate)) {
    errors.push("delegate must be an object");
  }
  if (!Array.isArray(delegate?.command) || delegate.command.length === 0) {
    errors.push("delegate.command must be a non-empty array");
  } else if (delegate.command.some((item) => typeof item !== "string" || !item)) {
    errors.push("delegate.command must contain only non-empty strings");
  }
  if (delegate?.promptMode !== "arg" && delegate?.promptMode !== "stdin") {
    errors.push("delegate.promptMode must be arg or stdin");
  }
  if (delegate?.schemaMode != null && delegate.schemaMode !== "file" && delegate.schemaMode !== "json") {
    errors.push("delegate.schemaMode must be file or json when present");
  }
  if (delegate?.schemaMode && (typeof delegate.schemaFlag !== "string" || !delegate.schemaFlag)) {
    errors.push("delegate.schemaFlag is required when delegate.schemaMode is set");
  }
  if (errors.length > 0) throw new Error(`Invalid delegate adapter for ${agent}: ${errors.join("; ")}`);
}

function loadAdapterConfig(agent) {
  const file = adapterConfigPath(agent);
  if (!fs.existsSync(file)) throw new Error(`Missing adapter config: ${file}`);
  const adapter = parseJsonFile(file, `${agent} adapter`);
  if (adapter.agent !== agent) {
    throw new Error(`Invalid adapter config: ${file} declares agent ${adapter.agent || "<missing>"}`);
  }
  validateDelegateConfig(agent, adapter.delegate);
  return adapter;
}

function resolveDelegateAdapter(args) {
  const agent = args.agent;
  if (!agent) throw new Error("--agent is required");
  if (!DELEGATE_AGENTS.has(agent)) {
    throw new Error(`Unsupported delegate agent: ${agent}. Supported: ${[...DELEGATE_AGENTS].join(", ")}`);
  }

  if (args["adapter-command"]) {
    const promptMode = args["prompt-mode"] || "stdin";
    if (promptMode !== "stdin" && promptMode !== "arg") throw new Error("--prompt-mode must be stdin or arg");
    return {
      agent,
      command: parseJsonArray(args["adapter-command"], "--adapter-command"),
      promptMode,
      source: "override",
      schemaMode: null,
      schemaFlag: null,
    };
  }

  const adapter = loadAdapterConfig(agent);
  return {
    agent,
    command: adapter.delegate.command,
    promptMode: adapter.delegate.promptMode,
    schemaMode: adapter.delegate.schemaMode || null,
    schemaFlag: adapter.delegate.schemaFlag || null,
    source: "adapter-json",
  };
}

function schemaArgsFor(adapter) {
  if (!adapter.schemaMode) return [];
  if (adapter.schemaMode === "file") return [adapter.schemaFlag, WORKER_REPORT_SCHEMA_PATH];
  if (adapter.schemaMode === "json") return [adapter.schemaFlag, workerReportSchemaText()];
  return [];
}

function runtimeCommand(adapter) {
  return [...adapter.command, ...schemaArgsFor(adapter)];
}

function displayCommand(adapter) {
  if (!adapter.schemaMode) return adapter.command;
  const schemaDisplay = adapter.schemaMode === "file" ? WORKER_REPORT_SCHEMA_PATH : "<WorkerReportV1 schema>";
  return [...adapter.command, adapter.schemaFlag, schemaDisplay];
}

function commandAvailable(command) {
  if (command.includes(path.sep)) return fs.existsSync(command);
  const paths = (process.env.PATH || "").split(path.delimiter).filter(Boolean);
  return paths.some((dir) => fs.existsSync(path.join(dir, command)));
}

function readDossier(args, cwd) {
  if (args["dossier-text"]) return args["dossier-text"];
  if (!args.dossier) return "";
  const dossierPath = path.resolve(cwd, expandHome(args.dossier));
  if (!fs.existsSync(dossierPath)) throw new Error(`Missing dossier: ${dossierPath}`);
  return readText(dossierPath);
}

function buildWorkerPrompt({ role, unitId, dossierText }) {
  return [
    "You are a role-scoped worker in a Workflow Supervisor loop.",
    `Role: ${role}`,
    `Work unit: ${unitId}`,
    "",
    "Rules:",
    "- Use only the assigned role and dossier.",
    "- Do not ask the human directly.",
    "- Do not choose final disposition.",
    "- Do not expand scope.",
    "- If you need a human decision, return BLOCKED with blocking_question.",
    "- Return exactly one WorkerReportV1 JSON object and no prose outside JSON.",
    "- PASS requires concrete evidence for the material acceptance rows.",
    "- Verifier must not edit files or artifacts.",
    "",
    "WorkerReportV1 JSON shape:",
    JSON.stringify(
      {
        schema: "WorkerReportV1",
        status: "PASS|FAIL|BLOCKED",
        role,
        unit_id: unitId,
        summary: "",
        changed_surfaces: [],
        evidence: [],
        checks_run: [],
        skipped_checks: [],
        findings: [],
        blocking_question: null,
        next_action: "",
        adapter: null,
        guard: null,
        reason: null,
      },
      null,
      2,
    ),
    "",
    "WorkerReportV1 JSON Schema:",
    workerReportSchemaText(),
    "",
    "Dossier:",
    dossierText || "(No dossier file was provided. If the objective or acceptance evidence is insufficient, return BLOCKED.)",
  ].join("\n");
}

function gitStatusLines(cwd) {
  const result = spawnSync("git", ["-C", cwd, "status", "--porcelain=v1", "--untracked-files=all"], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024,
  });
  if (result.error || result.status !== 0) return null;
  return result.stdout.trimEnd() ? result.stdout.trimEnd().split(/\r?\n/) : [];
}

function parseGitStatusPaths(lines) {
  const paths = new Set();
  for (const line of lines || []) {
    const raw = line.slice(3).trim();
    const renamed = raw.includes(" -> ") ? raw.split(" -> ").pop() : raw;
    if (renamed) paths.add(renamed.replace(/^"|"$/g, ""));
  }
  return [...paths].sort();
}

function normalizeSurface(value) {
  return value.replace(/\\/g, "/").replace(/^\.?\//, "").replace(/\/+$/, "");
}

function surfaceMatches(changedPath, surface) {
  const changed = normalizeSurface(changedPath);
  const target = normalizeSurface(surface);
  return changed === target || changed.startsWith(`${target}/`);
}

function hashPath(targetPath) {
  if (!fs.existsSync(targetPath)) return "MISSING";
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    const hash = crypto.createHash("sha256");
    for (const file of walkFiles(targetPath)) {
      hash.update(path.relative(targetPath, file));
      hash.update("\0");
      hash.update(fs.readFileSync(file));
      hash.update("\0");
    }
    return hash.digest("hex");
  }
  return crypto.createHash("sha256").update(fs.readFileSync(targetPath)).digest("hex");
}

function snapshotSurfaces(cwd, surfaces) {
  const snapshot = new Map();
  for (const surface of surfaces) {
    snapshot.set(normalizeSurface(surface), hashPath(path.resolve(cwd, surface)));
  }
  return snapshot;
}

function changedSnapshotSurfaces(before, cwd) {
  const changed = [];
  for (const [surface, oldHash] of before.entries()) {
    const nextHash = hashPath(path.resolve(cwd, surface));
    if (nextHash !== oldHash) changed.push(surface);
  }
  return changed.sort();
}

function beginGuard(args, role, cwd) {
  const allowedSurfaces = splitCsv(args["allowed-surfaces"]);
  const forbiddenSurfaces = splitCsv(args["forbidden-surfaces"]);
  const gitBefore = gitStatusLines(cwd);
  const explicitSurfaces = [...allowedSurfaces, ...forbiddenSurfaces];
  const guard = {
    allowed_surface_violations: [],
    role_violations: [],
    warnings: [],
  };

  if (gitBefore && gitBefore.length > 0 && role !== "verifier" && !args["allow-dirty"]) {
    return {
      blocked: blockedReport({
        role,
        unitId: args.unit,
        reason: "dirty_workspace",
        summary: "Mutable worker delegation is blocked because the git workspace is already dirty and --allow-dirty was not set.",
        adapter: null,
        guard: { ...guard, warnings: ["baseline git status is not clean"] },
      }),
    };
  }

  if (!gitBefore && explicitSurfaces.length === 0) {
    guard.warnings.push("surface guard degraded: not a git workspace and no explicit surfaces were provided");
  }

  return {
    gitBefore,
    allowedSurfaces,
    forbiddenSurfaces,
    explicitSnapshot: !gitBefore && explicitSurfaces.length > 0 ? snapshotSurfaces(cwd, explicitSurfaces) : null,
    guard,
  };
}

function finishGuard(start, role, cwd) {
  const guard = {
    allowed_surface_violations: [...(start.guard?.allowed_surface_violations || [])],
    role_violations: [...(start.guard?.role_violations || [])],
    warnings: [...(start.guard?.warnings || [])],
  };

  let changedPaths = [];
  if (start.gitBefore) {
    const gitAfter = gitStatusLines(cwd);
    if (!gitAfter) {
      guard.warnings.push("surface guard degraded: git status became unavailable after delegation");
    } else {
      changedPaths = parseGitStatusPaths(gitAfter);
      const beforeText = start.gitBefore.join("\n");
      const afterText = gitAfter.join("\n");
      if (role === "verifier" && beforeText !== afterText) {
        guard.role_violations.push("verifier changed the workspace");
      }
      if (start.gitBefore.length > 0) {
        guard.warnings.push("surface guard degraded: baseline was dirty, so changed paths may include pre-existing edits");
      }
    }
  } else if (start.explicitSnapshot) {
    changedPaths = changedSnapshotSurfaces(start.explicitSnapshot, cwd);
    if (role === "verifier" && changedPaths.length > 0) {
      guard.role_violations.push("verifier changed watched surfaces");
    }
  }

  if (start.allowedSurfaces?.length > 0) {
    for (const changedPath of changedPaths) {
      if (!start.allowedSurfaces.some((surface) => surfaceMatches(changedPath, surface))) {
        guard.allowed_surface_violations.push(changedPath);
      }
    }
  }

  for (const changedPath of changedPaths) {
    if (start.forbiddenSurfaces?.some((surface) => surfaceMatches(changedPath, surface))) {
      guard.role_violations.push(`changed forbidden surface: ${changedPath}`);
    }
  }

  return guard;
}

function ensureArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function reportAdapterMeta(adapter, result = {}) {
  return {
    agent: adapter?.agent || null,
    command: adapter ? displayCommand(adapter).join(" ") : null,
    exit_code: Number.isInteger(result.status) ? result.status : null,
    timed_out: Boolean(result.signal === "SIGTERM" && result.error?.code === "ETIMEDOUT"),
    source: adapter?.source || null,
    schema_mode: adapter?.schemaMode || null,
  };
}

function blockedReport({ role, unitId, reason, summary, adapter, guard, stdout, stderr }) {
  return {
    schema: "WorkerReportV1",
    status: "BLOCKED",
    role,
    unit_id: unitId,
    summary,
    changed_surfaces: [],
    evidence: [],
    checks_run: [],
    skipped_checks: [],
    findings: reason ? [{ id: reason, severity: "blocking", summary }] : [],
    blocking_question: null,
    next_action: "supervisor_review",
    adapter: adapter || null,
    guard: guard || { allowed_surface_violations: [], role_violations: [], warnings: [] },
    reason,
    stdout_excerpt: stdout ? excerpt(stdout) : undefined,
    stderr_excerpt: stderr ? excerpt(stderr) : undefined,
  };
}

function normalizeReport(report, { role, unitId, adapter, guard }) {
  return {
    ...report,
    schema: "WorkerReportV1",
    status: String(report.status || "").toUpperCase(),
    role: report.role || role,
    unit_id: report.unit_id || unitId,
    summary: report.summary || "",
    changed_surfaces: ensureArray(report.changed_surfaces),
    evidence: ensureArray(report.evidence),
    checks_run: ensureArray(report.checks_run),
    skipped_checks: ensureArray(report.skipped_checks),
    findings: ensureArray(report.findings),
    blocking_question: report.blocking_question ?? null,
    next_action: report.next_action || "",
    adapter,
    guard,
  };
}

function validateWorkerReport(report, { role, unitId }) {
  const errors = [];
  if (!report || typeof report !== "object" || Array.isArray(report)) errors.push("report is not an object");
  if (report?.schema !== "WorkerReportV1") errors.push("schema must be WorkerReportV1");
  if (!REPORT_STATUSES.has(report?.status)) errors.push("status must be PASS, FAIL, or BLOCKED");
  if (report?.role !== role) errors.push(`role must be ${role}`);
  if (report?.unit_id !== unitId) errors.push(`unit_id must be ${unitId}`);
  for (const field of ["changed_surfaces", "evidence", "checks_run", "skipped_checks", "findings"]) {
    if (!Array.isArray(report?.[field])) errors.push(`${field} must be an array`);
  }
  if (report?.status === "PASS" && report.evidence.length === 0) errors.push("PASS requires non-empty evidence");
  if (report?.blocking_question && report.status !== "BLOCKED") {
    errors.push("blocking_question requires BLOCKED status");
  }
  if (role === "verifier" && report?.changed_surfaces?.length > 0) errors.push("verifier must not report changed surfaces");
  return errors;
}

function extractJsonObjects(text) {
  const objects = [];
  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }
    if (char === "\"") {
      inString = true;
      continue;
    }
    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }
    if (char === "}" && depth > 0) {
      depth -= 1;
      if (depth === 0 && start !== -1) {
        const candidate = text.slice(start, i + 1);
        try {
          objects.push(JSON.parse(candidate));
        } catch {
          // Ignore non-JSON brace groups.
        }
        start = -1;
      }
    }
  }
  return objects;
}

function nestedTextValues(value, depth = 0) {
  if (depth > 4 || value == null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap((item) => nestedTextValues(item, depth + 1));
  if (typeof value === "object") return Object.values(value).flatMap((item) => nestedTextValues(item, depth + 1));
  return [];
}

function extractWorkerReport(stdout, stderr) {
  const objects = extractJsonObjects(`${stdout || ""}\n${stderr || ""}`);
  const direct = objects.find((item) => item?.schema === "WorkerReportV1");
  if (direct) return direct;
  for (const object of objects) {
    for (const text of nestedTextValues(object)) {
      const nested = extractJsonObjects(text).find((item) => item?.schema === "WorkerReportV1");
      if (nested) return nested;
    }
  }
  return null;
}

function looksLikeAuthFailure(text) {
  return /\b(auth|authenticate|authentication|login|logged in|unauthorized|forbidden|api key|token|credential|permission denied)\b/i.test(
    text || "",
  );
}

function runAdapter(adapter, prompt, cwd, timeoutMs) {
  const [command, ...baseArgs] = runtimeCommand(adapter);
  const commandArgs = adapter.promptMode === "arg" ? [...baseArgs, prompt] : baseArgs;
  return spawnSync(command, commandArgs, {
    cwd,
    input: adapter.promptMode === "stdin" ? prompt : undefined,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
    timeout: timeoutMs,
  });
}

function delegate(args) {
  const role = args.role;
  const unitId = args.unit;
  if (!WORKER_ROLES.has(role)) throw new Error(`--role must be one of: ${[...WORKER_ROLES].join(", ")}`);
  if (!unitId) throw new Error("--unit is required");

  const cwd = path.resolve(expandHome(args.cwd || process.cwd()));
  if (!fs.existsSync(cwd)) throw new Error(`Missing --cwd path: ${cwd}`);
  const dossier = resolveDelegateDossier(args, cwd, { role, unitId });
  if (dossier.blocked) return JSON.stringify(dossier.blocked, null, 2);
  const adapter = resolveDelegateAdapter(args);
  const timeoutMs = Number.parseInt(args["timeout-ms"] || "120000", 10);
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("--timeout-ms must be a positive integer");

  const guardStart = beginGuard(dossier.guardArgs, role, cwd);
  if (guardStart.blocked) return JSON.stringify(guardStart.blocked, null, 2);

  const prompt = buildWorkerPrompt({ role, unitId, dossierText: dossier.text });
  const result = runAdapter(adapter, prompt, cwd, timeoutMs);
  const adapterMeta = reportAdapterMeta(adapter, result);

  if (result.error?.code === "ENOENT") {
    return JSON.stringify(
      blockedReport({
        role,
        unitId,
        reason: "adapter_cli_missing",
        summary: `Adapter executable was not found: ${adapter.command[0]}`,
        adapter: adapterMeta,
        guard: guardStart.guard,
        stderr: result.error.message,
      }),
      null,
      2,
    );
  }

  if (result.error && result.error.code !== "ETIMEDOUT") {
    return JSON.stringify(
      blockedReport({
        role,
        unitId,
        reason: "adapter_execution_error",
        summary: result.error.message,
        adapter: adapterMeta,
        guard: guardStart.guard,
        stdout: result.stdout,
        stderr: result.stderr,
      }),
      null,
      2,
    );
  }

  const guard = finishGuard(guardStart, role, cwd);
  const extracted = extractWorkerReport(result.stdout, result.stderr);
  if (!extracted) {
    const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}\n${result.error?.message || ""}`;
    const reason = result.error?.code === "ETIMEDOUT"
      ? "adapter_timeout"
      : looksLikeAuthFailure(combinedOutput)
        ? "adapter_auth_unavailable"
        : "invalid_worker_report";
    return JSON.stringify(
      blockedReport({
        role,
        unitId,
        reason,
        summary: reason === "adapter_timeout"
          ? "Adapter timed out before producing a valid WorkerReportV1."
          : reason === "adapter_auth_unavailable"
            ? "Adapter appears to require authentication before it can produce WorkerReportV1."
            : "Adapter did not produce a valid WorkerReportV1 JSON object.",
        adapter: adapterMeta,
        guard,
        stdout: result.stdout,
        stderr: result.stderr || result.error?.message,
      }),
      null,
      2,
    );
  }

  const report = normalizeReport(extracted, { role, unitId, adapter: adapterMeta, guard });
  const validationErrors = validateWorkerReport(report, { role, unitId });
  if (result.status !== 0 && report.status === "PASS") validationErrors.push("PASS is invalid when adapter exits non-zero");
  if (guard.allowed_surface_violations.length > 0) validationErrors.push("worker changed surfaces outside allowed set");
  if (guard.role_violations.length > 0) validationErrors.push("worker violated role or forbidden-surface guard");

  if (validationErrors.length > 0) {
    return JSON.stringify(
      blockedReport({
        role,
        unitId,
        reason: "report_validation_failed",
        summary: `Worker report rejected: ${validationErrors.join("; ")}`,
        adapter: adapterMeta,
        guard,
        stdout: result.stdout,
        stderr: result.stderr,
      }),
      null,
      2,
    );
  }

  return JSON.stringify(report, null, 2);
}

function delegateDoctor(args) {
  if (args.agent === "all") {
    if (args["adapter-command"]) throw new Error("--adapter-command cannot be used with --agent all");
    const reports = [...DELEGATE_AGENTS].map((agent) => JSON.parse(delegateDoctor({ ...args, agent, "require-pass": false })));
    if (args["require-pass"] && reports.some((report) => report.status !== "PASS")) {
      process.exitCode = 1;
    }
    return JSON.stringify(
      reports,
      null,
      2,
    );
  }

  const adapter = resolveDelegateAdapter(args);
  const cwd = path.resolve(expandHome(args.cwd || process.cwd()));
  const available = commandAvailable(adapter.command[0]);
  const report = {
    agent: adapter.agent,
    command: displayCommand(adapter),
    prompt_mode: adapter.promptMode,
    source: adapter.source,
    schema_mode: adapter.schemaMode || null,
    executable_available: available,
    status: available ? "PASS" : "BLOCKED",
    note: available
      ? "Executable is present. Use --probe to run a trivial WorkerReportV1 delegation check."
      : `Executable was not found: ${adapter.command[0]}`,
  };

  if (args.probe) {
    const probeResult = JSON.parse(
      delegate({
        ...args,
        role: "verifier",
        unit: "delegate-doctor",
        cwd,
        "allow-dirty": true,
        "dossier-text": "Delegate doctor probe. Return PASS if you can emit a valid WorkerReportV1 for this probe. Evidence may be a single item saying the adapter produced structured output.",
      }),
    );
    report.probe = {
      status: probeResult.status,
      reason: probeResult.reason || null,
      adapter: probeResult.adapter,
      guard: probeResult.guard,
    };
    report.status = probeResult.status === "PASS" ? "PASS" : "BLOCKED";
  }

  if (args["require-pass"] && report.status !== "PASS") {
    process.exitCode = 1;
  }

  return JSON.stringify(report, null, 2);
}

function writeManifest(target, data, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, ".workflow-skills-install.json"), JSON.stringify(data, null, 2) + "\n");
}

function installOne(args, agent) {
  const root = path.resolve(expandHome(args.root || packageRoot));
  const scope = normalizeScope(args.scope || "user");
  const project = scope === "project" ? path.resolve(expandHome(args.project || process.cwd())) : null;
  const target = resolveTarget(args, agent);
  const names = selectSkills(root, args.skills || "all");
  const dryRun = Boolean(args["dry-run"]);
  const installed = [];

  for (const name of names) {
    const src = path.join(skillsRoot(root), name);
    const dest = path.join(target, name);
    copyDir(src, dest, { force: Boolean(args.force), dryRun });
    installed.push({ name, checksum: hashDir(src) });
  }

  if (!dryRun) fs.writeFileSync(path.join(target, "WORKFLOW_SKILL_PACK.md"), contextFor(agent, target, names));
  const workflowGitignore = project ? ensureWorkflowStateIgnored(project, dryRun) : null;
  writeManifest(
    target,
    {
      package: PACKAGE_NAME,
      version: PACKAGE_VERSION,
      agent,
      scope,
      project,
      target,
      installedAt: new Date().toISOString(),
      workflowGitignore,
      skills: installed,
    },
    dryRun
  );

  return { agent, target, skills: names, dryRun, workflowGitignore };
}

function install(args) {
  validate(path.resolve(expandHome(args.root || packageRoot)));
  return resolveAgents(args.agent || "generic").map((agent) => installOne(args, agent));
}

function uninstallOne(args, agent) {
  const root = path.resolve(expandHome(args.root || packageRoot));
  const target = resolveTarget(args, agent);
  const names = selectSkills(root, args.skills || "all");
  const dryRun = Boolean(args["dry-run"]);
  for (const name of names) {
    if (!dryRun) fs.rmSync(path.join(target, name), { recursive: true, force: true });
  }
  if (!dryRun) {
    fs.rmSync(path.join(target, ".workflow-skills-install.json"), { force: true });
    fs.rmSync(path.join(target, "WORKFLOW_SKILL_PACK.md"), { force: true });
  }
  return { agent, target, skills: names, dryRun };
}

function uninstall(args) {
  return resolveAgents(args.agent || "generic").map((agent) => uninstallOne(args, agent));
}

function emitContext(args) {
  const agent = args.agent || "generic";
  if (!AGENTS.has(agent)) throw new Error(`Unsupported agent: ${agent}`);
  const root = path.resolve(expandHome(args.root || packageRoot));
  validate(root);
  const names = selectSkills(root, args.skills || "all");
  const target = args.target ? path.resolve(expandHome(args.target)) : defaultTarget(agent, { scope: args.scope || "user", project: args.project || process.cwd() });
  const text = portableContextFor(root, agent, target, names);
  if (args.out) {
    const out = path.resolve(expandHome(args.out));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, text);
    return `Wrote ${out}`;
  }
  return text;
}

function doctorOne(args, agent) {
  const target = args.target ? path.resolve(expandHome(args.target)) : defaultTarget(agent, { scope: args.scope || "user", project: args.project || process.cwd() });
  return {
    packageRoot,
    agent,
    scope: args.scope || "user",
    defaultTarget: target,
    skills: validate(packageRoot),
    targetExists: target ? fs.existsSync(target) : false,
    manifestExists: target ? fs.existsSync(path.join(target, ".workflow-skills-install.json")) : false,
    note: target ? "Override with --target if your agent uses a different skill directory." : "Provide --target for installation.",
  };
}

function doctor(args) {
  const agent = args.agent || "generic";
  if (agent === "all") return JSON.stringify(INSTALLABLE_AGENTS.map((item) => doctorOne(args, item)), null, 2);
  if (!AGENTS.has(agent)) throw new Error(`Unsupported agent: ${agent}`);
  return JSON.stringify(doctorOne(args, agent), null, 2);
}

function printInstallResults(results, verb) {
  const pastTense = verb === "remove" ? "Removed" : "Installed";
  for (const result of results) {
    console.log(`${result.dryRun ? `Would ${verb}` : pastTense} ${result.skills.length} skills for ${result.agent} at ${result.target}`);
    if (result.workflowGitignore) {
      const { file, entry, changed } = result.workflowGitignore;
      const action = result.dryRun && changed ? "Would add" : changed ? "Added" : "Already ignores";
      console.log(`${action} ${entry} in ${file}`);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "help";
  if (args.help || command === "help") {
    console.log(usage());
    return;
  }
  if (command === "list") {
    console.log(listSkills(path.resolve(expandHome(args.root || packageRoot))).join("\n"));
    return;
  }
  if (command === "validate") {
    const root = path.resolve(expandHome(args.root || packageRoot));
    const names = validate(root);
    console.log(`Validated ${names.length} skills: ${names.join(", ")}`);
    return;
  }
  if (command === "validate-dossier") {
    console.log(validateDossierCommand(args));
    return;
  }
  if (command === "doctor") {
    console.log(doctor(args));
    return;
  }
  if (command === "install") {
    printInstallResults(install(args), "install");
    return;
  }
  if (command === "uninstall") {
    printInstallResults(uninstall(args), "remove");
    return;
  }
  if (command === "emit-context") {
    console.log(emitContext(args));
    return;
  }
  if (command === "delegate") {
    console.log(delegate(args));
    return;
  }
  if (command === "delegate-doctor") {
    console.log(delegateDoctor(args));
    return;
  }
  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
