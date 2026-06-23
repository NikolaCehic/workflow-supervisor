import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const text = fs.readFileSync(path.join(repoRoot, "docs/portable-delegation.md"), "utf8");
const cliText = fs.readFileSync(path.join(repoRoot, "bin/workflow-skills.mjs"), "utf8");
const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));

test("portable delegation stays a small skill-pack helper, not a harness", () => {
  assert.match(text, /must stay a small skill pack/i);
  assert.match(text, /must not become a daemon, queue, server, scheduler, dashboard, or full agent harness/i);
  assert.match(text, /one supervised, one-shot delegation/i);
});

test("portable delegation covers the supported platform set", () => {
  for (const platform of ["Codex", "Claude Code"]) {
    assert.match(text, new RegExp(platform.replace("/", "\\/")));
  }
});

test("cli no longer exposes uncertified context-only platforms", () => {
  assert.doesNotMatch(cliText, /CONTEXT_ONLY_AGENTS/);
  assert.match(cliText, /const INSTALLABLE_AGENTS = \["codex", "claude-code"\]/);
  assert.match(cliText, /const DELEGATE_AGENTS = new Set\(\["codex", "claude-code"\]\)/);

  for (const agent of ["opencode", "hermesagent", "pi", "openclaw"]) {
    assert.equal(fs.existsSync(path.join(repoRoot, "adapters", agent, "adapter.json")), false);
  }
});

test("every supported platform adapter declares a delegate command array", () => {
  for (const agent of ["codex", "claude-code"]) {
    const adapter = JSON.parse(fs.readFileSync(path.join(repoRoot, "adapters", agent, "adapter.json"), "utf8"));
    assert.equal(adapter.agent, agent);
    assert.ok(Array.isArray(adapter.delegate.command), `${agent} delegate command must be an array`);
    assert.ok(adapter.delegate.command.length > 0, `${agent} delegate command must not be empty`);
    assert.match(adapter.delegate.promptMode, /^(arg|stdin)$/);
  }
});

test("delegate runtime loads adapter JSON instead of carrying a duplicate command table", () => {
  assert.doesNotMatch(cliText, /const DELEGATE_ADAPTERS\s*=/);
  assert.match(cliText, /loadAdapterConfig/);
  assert.match(cliText, /adapter\.delegate\.command/);
  assert.match(cliText, /source: "adapter-json"/);
});

test("WorkerReportV1 schema is packaged and native schema adapters are declared", () => {
  const schema = JSON.parse(fs.readFileSync(path.join(repoRoot, "schemas", "worker-report-v1.schema.json"), "utf8"));
  const dossierSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, "schemas", "dossier-v1.schema.json"), "utf8"));
  assert.equal(schema.title, "WorkerReportV1");
  assert.equal(dossierSchema.title, "DossierV1");
  assert.deepEqual(dossierSchema.properties.worker_role.enum, ["implementer", "verifier", "repair", "documenter"]);
  assert.ok(dossierSchema.required.includes("allowed_surfaces"));
  assert.ok(dossierSchema.required.includes("forbidden_surfaces"));
  assert.deepEqual(schema.properties.status.enum, ["PASS", "FAIL", "BLOCKED"]);
  assert.ok(schema.properties.verification_environment);
  assert.ok(schema.properties.outcome_evaluations);
  assert.deepEqual(schema.$defs.outcomeEvaluation.properties.verdict.enum, [
    "PASS",
    "FAIL",
    "BLOCKED",
    "CONDITIONAL_PASS",
  ]);
  assert.ok(packageJson.files.includes("schemas"));

  assert.match(cliText, /WORKER_REPORT_SCHEMA_PATH/);
  assert.match(cliText, /DOSSIER_SCHEMA_PATH/);
  assert.match(cliText, /validateDossierData/);
  assert.match(cliText, /invalid_dossier/);
  assert.match(cliText, /adapter\.delegate\.schemaMode/);
  assert.match(cliText, /adapter\.delegate\.schemaFlag/);

  const codex = JSON.parse(fs.readFileSync(path.join(repoRoot, "adapters", "codex", "adapter.json"), "utf8"));
  const claude = JSON.parse(fs.readFileSync(path.join(repoRoot, "adapters", "claude-code", "adapter.json"), "utf8"));
  assert.ok(codex.delegate.command.includes("service_tier=\"fast\""));
  assert.equal(codex.delegate.schemaMode, "file");
  assert.equal(codex.delegate.schemaFlag, "--output-schema");
  assert.equal(claude.delegate.schemaMode, "json");
  assert.equal(claude.delegate.schemaFlag, "--json-schema");
  assert.equal(schema.additionalProperties, false);
});

test("portable delegation has a single normalized output contract", () => {
  assert.match(text, /WorkerReportV1/);
  assert.match(text, /Every adapter must normalize into this shape/);
  assert.match(text, /PASS`, `FAIL`, and `BLOCKED` mean the same thing on both platforms/);
});

test("portable delegation answers the core failure modes", () => {
  for (const phrase of [
    "Agent CLI is missing",
    "Agent is not authenticated",
    "Worker edits forbidden files",
    "Verifier edits files",
    "Worker asks the human a question",
    "Worker hangs",
    "Worker returns PASS without evidence",
    "Platform output differs",
    "Workspace is dirty before delegation",
  ]) {
    assert.match(text, new RegExp(phrase));
  }
});
