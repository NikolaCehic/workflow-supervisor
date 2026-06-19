import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "bin", "workflow-skills.mjs");
const fixture = path.join(repoRoot, "tests", "fixtures", "mock-worker.mjs");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "workflow-delegate-"));
}

function runJson(args, cwd = tempDir()) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function runRaw(args, cwd = tempDir()) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function adapterCommand(mode, extra = []) {
  return JSON.stringify([process.execPath, fixture, mode, ...extra]);
}

function dossierText(role = "verifier", unit = "U1") {
  return [
    "schema: DossierV1",
    "workflow: test-workflow",
    `work_unit: ${unit}-test-unit`,
    `dossier_id: ${unit}-${role}-test`,
    `worker_name: wf/test/${unit}-${role}-test`,
    `worker_role: ${role}`,
    "delegation_transport: portable_delegate",
    "start_condition: after path gate",
    "title: Test dossier",
    "objective: Exercise delegate test behavior with a concrete bounded unit.",
    "non_goals:",
    "  - Do not change production files.",
    "source_corpus:",
    "  - tests/fixtures/mock-worker.mjs",
    "must_read:",
    "  - tests/fixtures/mock-worker.mjs",
    "allowed_surfaces:",
    "  - touched.txt",
    "forbidden_surfaces:",
    "  - forbidden.txt",
    "acceptance_matrix:",
    "  - A1: worker returns the expected WorkerReportV1 test fixture.",
    "adversarial_checks:",
    "  - A2: reject missing evidence and invalid human questions.",
    "required_commands_or_evidence:",
    "  - node --test tests/delegate-cli.test.mjs",
    "worker_prompt: |",
    `  Act only as ${role} and return WorkerReportV1.`,
    "supervisor_checkpoints:",
    "  - terminal WorkerReportV1 report",
    "completion_report_schema: WorkerReportV1",
    "verification_report_schema: WorkerReportV1",
    "stop_gates:",
    "  - Missing WorkerReportV1 evidence.",
    "assumptions:",
    "  - Test fixture is local and deterministic.",
    "open_questions:",
    "  - none",
  ].join("\n");
}

function dossierArgs(role = "verifier", unit = "U1") {
  return ["--dossier-text", dossierText(role, unit)];
}

function writeDossier(cwd, text) {
  const file = path.join(cwd, "dossier.yaml");
  fs.writeFileSync(file, text);
  return file;
}

test("delegate extracts a WorkerReportV1 object from noisy worker output", () => {
  const report = runJson([
    "delegate",
    "--agent",
    "codex",
    "--role",
    "verifier",
    "--unit",
    "U1",
    "--adapter-command",
    adapterCommand("pass"),
    "--prompt-mode",
    "stdin",
    ...dossierArgs("verifier", "U1"),
  ]);

  assert.equal(report.schema, "WorkerReportV1");
  assert.equal(report.status, "PASS");
  assert.equal(report.role, "verifier");
  assert.equal(report.unit_id, "U1");
  assert.equal(report.adapter.agent, "codex");
  assert.equal(report.adapter.source, "override");
  assert.deepEqual(report.guard.allowed_surface_violations, []);
});

test("delegate returns normalized BLOCKED when worker output is not a report", () => {
  const report = runJson([
    "delegate",
    "--agent",
    "claude-code",
    "--role",
    "implementer",
    "--unit",
    "U2",
    "--adapter-command",
    adapterCommand("invalid"),
    "--prompt-mode",
    "stdin",
    ...dossierArgs("implementer", "U2"),
  ]);

  assert.equal(report.schema, "WorkerReportV1");
  assert.equal(report.status, "BLOCKED");
  assert.equal(report.reason, "invalid_worker_report");
  assert.match(report.summary, /did not produce a valid WorkerReportV1/);
});

test("delegate rejects PASS reports without evidence", () => {
  const report = runJson([
    "delegate",
    "--agent",
    "codex",
    "--role",
    "verifier",
    "--unit",
    "U3",
    "--adapter-command",
    adapterCommand("pass-no-evidence"),
    "--prompt-mode",
    "stdin",
    ...dossierArgs("verifier", "U3"),
  ]);

  assert.equal(report.status, "BLOCKED");
  assert.equal(report.reason, "report_validation_failed");
  assert.match(report.summary, /PASS requires non-empty evidence/);
});

test("delegate returns normalized BLOCKED when adapter executable is missing", () => {
  const report = runJson([
    "delegate",
    "--agent",
    "codex",
    "--role",
    "verifier",
    "--unit",
    "U-missing",
    "--adapter-command",
    JSON.stringify(["workflow-supervisor-definitely-missing-binary"]),
    "--prompt-mode",
    "stdin",
    ...dossierArgs("verifier", "U-missing"),
  ]);

  assert.equal(report.status, "BLOCKED");
  assert.equal(report.reason, "adapter_cli_missing");
  assert.match(report.summary, /not found/);
});

test("delegate classifies auth-looking adapter failures", () => {
  const report = runJson([
    "delegate",
    "--agent",
    "claude-code",
    "--role",
    "verifier",
    "--unit",
    "U-auth",
    "--adapter-command",
    adapterCommand("auth"),
    "--prompt-mode",
    "stdin",
    ...dossierArgs("verifier", "U-auth"),
  ]);

  assert.equal(report.status, "BLOCKED");
  assert.equal(report.reason, "adapter_auth_unavailable");
  assert.match(report.summary, /authentication/);
});

test("delegate rejects human questions on non-BLOCKED worker reports", () => {
  const report = runJson([
    "delegate",
    "--agent",
    "claude-code",
    "--role",
    "implementer",
    "--unit",
    "U-question",
    "--adapter-command",
    adapterCommand("question-pass"),
    "--prompt-mode",
    "stdin",
    ...dossierArgs("implementer", "U-question"),
  ]);

  assert.equal(report.status, "BLOCKED");
  assert.equal(report.reason, "report_validation_failed");
  assert.match(report.summary, /blocking_question requires BLOCKED status/);
});

test("delegate rejects verifier mutations on watched forbidden surfaces", () => {
  const cwd = tempDir();
  const report = runJson(
    [
      "delegate",
      "--agent",
      "codex",
      "--role",
      "verifier",
      "--unit",
      "U4",
      "--adapter-command",
      adapterCommand("edit", ["forbidden.txt"]),
      "--prompt-mode",
      "stdin",
      ...dossierArgs("verifier", "U4"),
      "--cwd",
      cwd,
      "--forbidden-surfaces",
      "forbidden.txt",
    ],
    cwd,
  );

  assert.equal(report.status, "BLOCKED");
  assert.equal(report.reason, "report_validation_failed");
  assert.match(report.summary, /violated role or forbidden-surface guard/);
  assert.ok(report.guard.role_violations.some((item) => item.includes("verifier changed watched surfaces")));
});

test("validate-dossier accepts a concrete DossierV1 file", () => {
  const cwd = tempDir();
  const file = writeDossier(cwd, dossierText("implementer", "U5"));
  const result = runRaw(["validate-dossier", file, "--role", "implementer", "--unit", "U5", "--json"], cwd);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.schema, "DossierValidationV1");
  assert.equal(report.valid, true);
  assert.deepEqual(report.errors, []);
});

test("validate-dossier warns for risky behavior changes without feedback_loop", () => {
  const cwd = tempDir();
  const risky = dossierText("implementer", "U5").replace(
    "objective: Exercise delegate test behavior with a concrete bounded unit.",
    "objective: Fix login bug with a concrete behavior-catching test.",
  );
  const riskyFile = writeDossier(cwd, risky);
  const riskyResult = runRaw(["validate-dossier", riskyFile, "--role", "implementer", "--unit", "U5", "--json"], cwd);
  assert.equal(riskyResult.status, 0, riskyResult.stderr);
  const riskyReport = JSON.parse(riskyResult.stdout);
  assert.equal(riskyReport.valid, true);
  assert.ok(riskyReport.warnings.some((warning) => warning.includes("feedback_loop is recommended")));

  const withLoop = [
    risky,
    "feedback_loop:",
    "  command_or_evidence: node --test tests/login.test.mjs",
    "  red_capable: yes",
    "  exact_symptom_or_behavior: login rejects valid credentials before the fix",
    "  deterministic: yes",
    "  expected_runtime: under 30 seconds",
    "  agent_runnable: yes",
  ].join("\n");
  const withLoopFile = writeDossier(cwd, withLoop);
  const withLoopResult = runRaw(["validate-dossier", withLoopFile, "--role", "implementer", "--unit", "U5", "--json"], cwd);
  assert.equal(withLoopResult.status, 0, withLoopResult.stderr);
  const withLoopReport = JSON.parse(withLoopResult.stdout);
  assert.equal(withLoopReport.valid, true);
  assert.ok(withLoopReport.warnings.every((warning) => !warning.includes("feedback_loop")));
});

test("validate-dossier rejects vague surfaces and unresolved questions", () => {
  const cwd = tempDir();
  const bad = dossierText("implementer", "U6")
    .replace("  - touched.txt", "  - all files")
    .replace("forbidden_surfaces:\n  - forbidden.txt", "forbidden_surfaces:\n  - none")
    .replace("open_questions:\n  - none", "open_questions:\n  - What should the schema be?");
  const file = writeDossier(cwd, bad);
  const result = runRaw(["validate-dossier", file, "--role", "implementer", "--unit", "U6", "--json"], cwd);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("allowed_surfaces")));
  assert.ok(report.errors.some((error) => error.includes("forbidden_surfaces")));
  assert.ok(report.errors.some((error) => error.includes("open_questions")));
});

test("delegate starts worker when file-backed DossierV1 is concrete", () => {
  const cwd = tempDir();
  const file = writeDossier(cwd, dossierText("implementer", "U8"));
  const report = runJson(
    [
      "delegate",
      "--agent",
      "codex",
      "--role",
      "implementer",
      "--unit",
      "U8",
      "--dossier",
      file,
      "--adapter-command",
      adapterCommand("pass"),
      "--prompt-mode",
      "stdin",
    ],
    cwd,
  );

  assert.equal(report.status, "PASS");
  assert.equal(report.role, "implementer");
  assert.equal(report.unit_id, "U8");
  assert.deepEqual(report.guard.allowed_surface_violations, []);
});

test("delegate refuses to start worker when dossier is missing or invalid", () => {
  const missing = runJson([
    "delegate",
    "--agent",
    "codex",
    "--role",
    "implementer",
    "--unit",
    "U-no-dossier",
    "--adapter-command",
    adapterCommand("pass"),
    "--prompt-mode",
    "stdin",
  ]);
  assert.equal(missing.status, "BLOCKED");
  assert.equal(missing.reason, "invalid_dossier");

  const cwd = tempDir();
  const bad = writeDossier(cwd, "schema: DossierV1\nwork_unit: U7\nobjective: migrate everything\n");
  const invalid = runJson(
    [
      "delegate",
      "--agent",
      "codex",
      "--role",
      "implementer",
      "--unit",
      "U7",
      "--dossier",
      bad,
      "--adapter-command",
      adapterCommand("pass"),
      "--prompt-mode",
      "stdin",
    ],
    cwd,
  );
  assert.equal(invalid.status, "BLOCKED");
  assert.equal(invalid.reason, "invalid_dossier");
  assert.match(invalid.summary, /DossierV1 validation failed/);
});

test("delegate-doctor supports command-array adapter probes", () => {
  const report = runJson([
    "delegate-doctor",
    "--agent",
    "claude-code",
    "--adapter-command",
    adapterCommand("pass"),
    "--prompt-mode",
    "stdin",
    "--probe",
  ]);

  assert.equal(report.status, "PASS");
  assert.equal(report.agent, "claude-code");
  assert.equal(report.executable_available, true);
  assert.equal(report.probe.status, "PASS");
});

test("delegate-doctor exposes native schema mode without expanding schema JSON in command display", () => {
  const codex = runJson(["delegate-doctor", "--agent", "codex"]);
  const claude = runJson(["delegate-doctor", "--agent", "claude-code"]);

  assert.equal(codex.source, "adapter-json");
  assert.equal(codex.schema_mode, "file");
  assert.match(codex.command.join(" "), /--output-schema/);
  assert.match(codex.command.join(" "), /worker-report-v1\.schema\.json/);

  assert.equal(claude.source, "adapter-json");
  assert.equal(claude.schema_mode, "json");
  assert.match(claude.command.join(" "), /--json-schema/);
  assert.match(claude.command.join(" "), /<WorkerReportV1 schema>/);
  assert.doesNotMatch(claude.command.join(" "), /"properties"/);
});

test("delegate-doctor can inspect every built-in adapter at once", () => {
  const reports = runJson(["delegate-doctor", "--agent", "all"]);
  assert.equal(reports.length, 2);
  assert.deepEqual(
    reports.map((report) => report.agent).sort(),
    ["claude-code", "codex"].sort(),
  );
  for (const report of reports) {
    assert.match(report.status, /^(PASS|BLOCKED)$/);
    assert.ok(Array.isArray(report.command));
    assert.equal(typeof report.executable_available, "boolean");
  }
});

test("delegate-doctor --require-pass exits zero for a passing probe", () => {
  const result = runRaw([
    "delegate-doctor",
    "--agent",
    "claude-code",
    "--adapter-command",
    adapterCommand("pass"),
    "--prompt-mode",
    "stdin",
    "--probe",
    "--require-pass",
  ]);
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "PASS");
});

test("delegate-doctor --require-pass exits nonzero but preserves JSON diagnostics", () => {
  const result = runRaw([
    "delegate-doctor",
    "--agent",
    "codex",
    "--adapter-command",
    JSON.stringify(["workflow-supervisor-definitely-missing-binary"]),
    "--prompt-mode",
    "stdin",
    "--require-pass",
  ]);
  assert.equal(result.status, 1);
  const report = JSON.parse(result.stdout);
  assert.equal(report.status, "BLOCKED");
  assert.equal(report.executable_available, false);
  assert.match(report.note, /not found/);
});

test("validate succeeds only when skills, adapters, and schema are valid", () => {
  const result = runRaw(["validate"], repoRoot);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Validated 8 skills/);
});
