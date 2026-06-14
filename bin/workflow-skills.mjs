#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, "..");
const PACKAGE_NAME = "workflow-skill-pack";
const PACKAGE_VERSION = "0.1.0";
const INSTALLABLE_AGENTS = ["codex", "claude-code", "opencode", "hermesagent"];
const AGENTS = new Set([...INSTALLABLE_AGENTS, "generic"]);

function usage() {
  return `workflow-skills

Usage:
  workflow-skills list [--root <path>]
  workflow-skills validate [--root <path>]
  workflow-skills doctor [--agent <agent|all>] [--scope user|project] [--project <path>] [--target <path>]
  workflow-skills install --agent <agent|all> [--scope user|project] [--project <path>] [--target <path>] [--skills all|a,b] [--force] [--dry-run]
  workflow-skills uninstall --agent <agent|all> [--scope user|project] [--project <path>] [--target <path>] [--skills all|a,b] [--dry-run]
  workflow-skills emit-context --agent <agent> [--scope user|project] [--project <path>] [--target <path>] [--skills all|a,b] [--out <path>] [--root <path>]

Agents:
  codex, claude-code, opencode, hermesagent, generic, all

Examples:
  npx workflow-skill-pack install --agent codex --scope user
  npx workflow-skill-pack install --agent all --scope project --project .
  npx workflow-skill-pack install --agent generic --target ./agent-skills
  npx workflow-skill-pack emit-context --agent opencode --skills workflow-supervisor,workflow-docs --out AGENTS.md
`;
}

function parseArgs(argv) {
  const result = { _: [] };
  const booleans = new Set(["force", "dry-run", "help"]);
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
    case "opencode":
      return resolvedScope === "project"
        ? path.join(projectRoot, ".opencode", "skills")
        : path.join(process.env.OPENCODE_HOME || path.join(home, ".config", "opencode"), "skills");
    case "hermesagent":
      return resolvedScope === "project"
        ? path.join(projectRoot, ".hermes", "skills")
        : path.join(process.env.HERMESAGENT_HOME || process.env.HERMES_HOME || path.join(home, ".hermes"), "skills");
    case "generic":
      return null;
    default:
      throw new Error(`Unknown agent: ${agent}`);
  }
}

function readText(file) {
  return fs.readFileSync(file, "utf8");
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

function validate(root = packageRoot) {
  const names = listSkills(root);
  const allErrors = [];
  for (const name of names) {
    for (const error of validateSkill(root, name)) allErrors.push(`${name}: ${error}`);
  }
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
  "dossier-builder": "create a handoff contract for one already-bounded work unit",
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

Use these skills explicitly for supervised, long-running, or handoff-heavy workflows:

${skillLines.join("\n")}

Do not use this pack for tiny direct tasks, ordinary README edits, one-off tests, or routine review unless a supervised workflow or durable handoff is explicitly needed.
`;
}

function portableContextFor(root, agent, target, names) {
  const title = agent === "generic" ? "Workflow Skill Pack Portable Context" : `Workflow Skill Pack Portable Context for ${agent}`;
  const sections = [
    `# ${title}`,
    "",
    "This file embeds the selected Workflow Supervisor skills for agents that cannot discover `SKILL.md` folders directly.",
    "",
    "Use these skills explicitly for supervised, long-running, or handoff-heavy workflows. Loading or reading a skill does not by itself create a new thread, subagent, goal, commit, PR, publication, or other side effect; those actions require the governing environment tools and the gates described in the relevant skill.",
    "",
    `Expected skill directory: \`${target || "<custom skill directory>"}\``,
    "",
    "## Included Skills",
    "",
    ...names.map((name) => `- \`$${name}\`: ${skillSummary(name)}.`),
    "",
    "Do not use this pack for tiny direct tasks, ordinary README edits, one-off tests, or routine review unless a supervised workflow or durable handoff is explicitly needed.",
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

function writeManifest(target, data, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(target, { recursive: true });
  fs.writeFileSync(path.join(target, ".workflow-skills-install.json"), JSON.stringify(data, null, 2) + "\n");
}

function installOne(args, agent) {
  const root = path.resolve(expandHome(args.root || packageRoot));
  const scope = normalizeScope(args.scope || "user");
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
  writeManifest(
    target,
    {
      package: PACKAGE_NAME,
      version: PACKAGE_VERSION,
      agent,
      scope,
      project: scope === "project" ? path.resolve(expandHome(args.project || process.cwd())) : null,
      target,
      installedAt: new Date().toISOString(),
      skills: installed,
    },
    dryRun
  );

  return { agent, target, skills: names, dryRun };
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
  throw new Error(`Unknown command: ${command}\n\n${usage()}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
