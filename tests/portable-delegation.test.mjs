import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(repoRoot, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const cliText = read("bin/workflow-skills.mjs");
const packageJson = readJson("package.json");
const contractSchema = readJson("schemas/delegation-contract-v1.schema.json");
const resultSchema = readJson("schemas/worker-result-v1.schema.json");

const removedCompanionSkills = [
  "acceptance-matrix",
  "dossier-builder",
  "loop-policy",
  "source-corpus",
  "work-unit",
  "worker-roles",
  "workflow-docs",
];

function dryRunPack() {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  assert.equal(result.status, 0, `npm pack --dry-run failed:\n${result.stderr || result.stdout}`);
  const parsed = JSON.parse(result.stdout);
  assert.equal(parsed.length, 1);
  return parsed[0];
}

test("package metadata exposes a CLI only and includes every runtime directory", () => {
  assert.equal(Object.hasOwn(packageJson, "main"), false, "CLI-only package must not advertise a library entry point");
  assert.equal(Object.hasOwn(packageJson.directories ?? {}, "test"), false, "excluded tests must not be advertised");
  assert.equal(packageJson.bin?.["workflow-supervisor"], "bin/workflow-skills");
  assert.equal(packageJson.bin?.["workflow-skills"], "bin/workflow-skills");

  for (const required of ["skills", "plugins", "adapters", "schemas", "config", "bin"]) {
    assert.ok(packageJson.files.includes(required), `${required} must be included by the npm files allow-list`);
  }
  assert.equal(packageJson.files.includes("tests"), false);
});

test("npm dry-run contains the complete v1 runtime and no dead companion skills", () => {
  const pack = dryRunPack();
  const files = new Set(pack.files.map((entry) => entry.path));
  const requiredFiles = [
    "bin/workflow-skills",
    "bin/workflow-skills.mjs",
    "config/context-profiles.json",
    "skills/workflow-supervisor/SKILL.md",
    "skills/workflow-supervisor/agents/openai.yaml",
    "skills/workflow-supervisor/references/tracked-work.md",
    "skills/workflow-supervisor/references/delegated-work.md",
    ".claude-plugin/marketplace.json",
    "plugins/claude/.claude-plugin/plugin.json",
    "plugins/claude/skills/workflow-supervisor/SKILL.md",
    "plugins/claude/skills/workflow-supervisor/references/tracked-work.md",
    "plugins/claude/skills/workflow-supervisor/references/delegated-work.md",
    "adapters/codex/adapter.json",
    "adapters/claude-code/adapter.json",
    "schemas/delegation-contract-v1.schema.json",
    "schemas/worker-result-v1.schema.json",
    "schemas/worker-result-transport-v1.schema.json",
  ];

  for (const file of requiredFiles) assert.ok(files.has(file), `${file} is absent from npm pack`);
  for (const name of removedCompanionSkills) {
    assert.equal(
      [...files].some((file) => file.startsWith(`skills/${name}/`)),
      false,
      `${name} leaked into npm pack`,
    );
  }
  assert.equal([...files].some((file) => file.startsWith("tests/")), false);
});

test("only Codex and Claude Code declare portable one-shot adapters", () => {
  const adapterDirs = fs.readdirSync(path.join(repoRoot, "adapters"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(repoRoot, "adapters", name, "adapter.json")))
    .sort();
  assert.deepEqual(adapterDirs, ["claude-code", "codex"]);
  assert.match(cliText, /const INSTALLABLE_AGENTS = \["codex", "claude-code"\]/);
  assert.match(cliText, /const DELEGATE_AGENTS = new Set\(\["codex", "claude-code"\]\)/);
  assert.doesNotMatch(cliText, /CONTEXT_ONLY_AGENTS|const DELEGATE_ADAPTERS\s*=/);

  for (const agent of adapterDirs) {
    const adapter = readJson(`adapters/${agent}/adapter.json`);
    assert.equal(adapter.agent, agent);
    assert.ok(Array.isArray(adapter.delegate.command) && adapter.delegate.command.length > 0);
    assert.match(adapter.delegate.promptMode, /^(arg|stdin)$/);
    assert.match(adapter.delegate.schemaMode, /^(file|json)$/);
    assert.equal(typeof adapter.delegate.schemaFlag, "string");
    assert.deepEqual(Object.keys(adapter.delegate.roleArgs).sort(), ["documenter", "implementer", "repair", "verifier"]);
  }
});

test("adapter role modes keep verification read-only and mutation roles explicit", () => {
  const codex = readJson("adapters/codex/adapter.json");
  const claude = readJson("adapters/claude-code/adapter.json");

  assert.equal(codex.delegate.promptMode, "stdin");
  assert.equal(codex.delegate.stdinArg, "-");
  assert.equal(codex.delegate.schemaMode, "file");
  assert.equal(codex.delegate.schemaFlag, "--output-schema");
  assert.ok(codex.delegate.command.includes("--ephemeral"));
  assert.ok(codex.delegate.command.includes("--ignore-user-config"));
  assert.equal(codex.delegate.command.includes("--ignore-rules"), false);
  assert.deepEqual(codex.delegate.roleArgs.verifier, ["--sandbox", "read-only"]);
  for (const role of ["implementer", "repair", "documenter"]) {
    assert.deepEqual(codex.delegate.roleArgs[role], ["--sandbox", "workspace-write"]);
  }

  assert.equal(claude.delegate.promptMode, "stdin");
  assert.equal(claude.delegate.schemaMode, "json");
  assert.equal(claude.delegate.schemaFlag, "--json-schema");
  assert.ok(claude.delegate.command.includes("--disable-slash-commands"));
  assert.ok(claude.delegate.command.includes("--strict-mcp-config"));
  assert.equal(claude.delegate.command.includes("--bare"), false);
  assert.ok(claude.delegate.command.includes("--no-session-persistence"));
  assert.deepEqual(claude.delegate.roleArgs.verifier, ["--permission-mode", "plan"]);
  for (const role of ["implementer", "repair", "documenter"]) {
    assert.deepEqual(claude.delegate.roleArgs[role], ["--permission-mode", "acceptEdits"]);
  }
});

test("DelegationContractV1 is strict, bounded, and authority-carrying", () => {
  assert.equal(contractSchema.title, "DelegationContractV1");
  assert.equal(contractSchema.additionalProperties, false);
  assert.deepEqual(contractSchema.properties.schema, { type: "string", const: "DelegationContractV1" });
  assert.deepEqual(contractSchema.properties.role.enum, ["implementer", "verifier", "repair", "documenter"]);
  assert.deepEqual(contractSchema.properties.expected_effect.enum, [
    "mutation_required",
    "mutation_allowed",
    "read_only",
  ]);
  assert.deepEqual(contractSchema.properties.authority.required, ["grants", "source"]);
  assert.equal(contractSchema.properties.authority.additionalProperties, false);
  assert.equal(contractSchema.properties.acceptance.minItems, 1);
  assert.equal(contractSchema.properties.acceptance.items.properties.id.pattern, "^A[1-9][0-9]*$");
  assert.deepEqual(contractSchema.properties.acceptance.items.required, ["id", "outcome", "evidence"]);
  assert.match(contractSchema.$defs.safeRelativePath.pattern, /\.\{1,2\}/);

  const serialized = JSON.stringify(contractSchema.allOf);
  assert.match(serialized, /"role":\{"const":"verifier"\}/);
  assert.match(serialized, /"expected_effect":\{"const":"read_only"\}/);
  assert.match(serialized, /"write_scope":\{"type":"array","maxItems":0\}/);
  assert.match(serialized, /"write_scope":\{"type":"array","minItems":1\}/);
});

test("WorkerResultV1 keeps model output compact and fail-closed", () => {
  assert.equal(resultSchema.title, "WorkerResultV1");
  assert.equal(resultSchema.additionalProperties, false);
  assert.deepEqual(resultSchema.required, ["schema", "status", "summary", "outcomes"]);
  assert.deepEqual(resultSchema.properties.status.enum, ["PASS", "FAIL", "BLOCKED"]);
  assert.deepEqual(resultSchema.$defs.outcome.required, ["id", "verdict", "evidence"]);
  assert.deepEqual(resultSchema.$defs.outcome.properties.verdict.enum, ["PASS", "FAIL", "BLOCKED"]);
  assert.equal(resultSchema.$defs.outcome.properties.id.pattern, "^A[1-9][0-9]*$");
  assert.ok(resultSchema.required.length <= 4, "model-facing output gained avoidable required fields");
  assert.ok(Object.keys(resultSchema.properties).length <= 10, "model-facing output is no longer compact");

  const serialized = JSON.stringify(resultSchema.allOf);
  const outcomeRules = JSON.stringify(resultSchema.$defs.outcome.allOf);
  assert.match(serialized, /"status":\{"const":"BLOCKED"\}/);
  assert.match(serialized, /"required":\["blocker"\]/);
  assert.match(serialized, /"else":\{"not"/);
  assert.match(outcomeRules, /"verdict":\{"const":"PASS"\}/);
  assert.match(outcomeRules, /"evidence":\{"type":"array","minItems":1\}/);
});

test("CLI source binds context profiles, compact contracts, results, and adapter JSON", () => {
  for (const binding of [
    "context-profiles.json",
    "delegation-contract-v1.schema.json",
    "worker-result-v1.schema.json",
    "loadContextProfiles",
    "loadAdapterConfig",
    "adapter.delegate.command",
    'source: "adapter-json"',
  ]) {
    assert.match(cliText, new RegExp(binding.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${binding} is not bound`);
  }
});
