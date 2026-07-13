import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "bin", "workflow-skills.mjs");
const legacyWorker = path.join(repoRoot, "tests", "fixtures", "mock-worker.mjs");
const reportSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, "schemas", "worker-report-v1.schema.json"), "utf8"));
const contractSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, "schemas", "delegation-contract-v1.schema.json"), "utf8"));
const resultSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, "schemas", "worker-result-v1.schema.json"), "utf8"));
const resultTransportSchema = JSON.parse(fs.readFileSync(path.join(repoRoot, "schemas", "worker-result-transport-v1.schema.json"), "utf8"));

function tempDir(label = "case") {
  return fs.mkdtempSync(path.join(os.tmpdir(), `workflow-delegate-${label}-`));
}

function runRaw(args, { cwd = tempDir(), env = process.env, timeout = 15_000, maxBuffer = 16 * 1024 * 1024 } = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    env,
    timeout,
    encoding: "utf8",
    maxBuffer,
  });
}

function parseOutput(result) {
  assert.equal(result.signal, null, result.error?.message || result.stderr);
  assert.ok(result.stdout.trim(), `expected JSON stdout; stderr: ${result.stderr}`);
  return JSON.parse(result.stdout);
}

function runDelegate(args, options = {}) {
  const result = runRaw(["delegate", ...args], options);
  return { result, report: parseOutput(result) };
}

function contractData({
  unit = "U1",
  role = "verifier",
  expectedEffect = role === "verifier" ? "read_only" : "mutation_allowed",
  writeScope = expectedEffect === "read_only" ? [] : ["touched.txt"],
  grants = [role === "verifier"
    ? "Read-only local verification inside the declared inputs; no publication, deployment, external messages, credentials, destructive actions, or scope expansion."
    : "Local workspace mutation only inside write_scope; no publication, deployment, external messages, credentials, destructive actions, or scope expansion."],
  acceptance = [{ id: "A1", outcome: "The delegated unit satisfies its bounded acceptance outcome.", evidence: ["A concrete deterministic check or inspected artifact."] }],
} = {}) {
  return {
    schema: "DelegationContractV1",
    unit,
    role,
    objective: "Exercise one bounded workflow-supervisor delegation contract.",
    authority: {
      grants,
      source: ["The local test invocation is the governing authority source."],
    },
    inputs: ["tests/fixtures/mock-worker.mjs"],
    write_scope: writeScope,
    expected_effect: expectedEffect,
    acceptance,
    checks: ["Run one deterministic local fixture check."],
    stop_conditions: ["Required evidence is unavailable or scope would expand."],
  };
}

function contractArgs(contract) {
  return ["--contract-text", JSON.stringify(contract)];
}

function writeContract(cwd, contract, name = "contract.json") {
  const file = path.join(cwd, name);
  fs.writeFileSync(file, `${JSON.stringify(contract, null, 2)}\n`);
  return file;
}

function compactResult({
  status = "PASS",
  summary = "Compact worker result completed.",
  changes,
  outcomes = [{ id: "A1", verdict: status === "PASS" ? "PASS" : status, evidence: status === "PASS" ? ["fixture evidence"] : [] }],
  checks,
  skipped,
  findings,
  blocker,
  next,
  extra,
} = {}) {
  return {
    schema: "WorkerResultV1",
    status,
    summary,
    ...(changes === undefined ? {} : { changes }),
    outcomes,
    ...(checks === undefined ? {} : { checks }),
    ...(skipped === undefined ? {} : { skipped }),
    ...(findings === undefined ? {} : { findings }),
    ...(blocker === undefined ? {} : { blocker }),
    ...(next === undefined ? {} : { next }),
    ...(extra || {}),
  };
}

function workerCommand({ result = compactResult(), before = "", after = "", stderr = "", exitCode = 0, duplicate } = {}) {
  const payload = JSON.stringify(result);
  const script = [
    "const fs=require('node:fs');",
    before,
    stderr ? `process.stderr.write(${JSON.stringify(stderr)});` : "",
    `process.stdout.write(${JSON.stringify(`${payload}\n`)});`,
    duplicate ? `process.stdout.write(${JSON.stringify(`${JSON.stringify(duplicate)}\n`)});` : "",
    after,
    exitCode ? `process.exitCode=${exitCode};` : "",
  ].join("");
  return JSON.stringify([process.execPath, "-e", script]);
}

function overrideArgs(command) {
  return ["--adapter-command", command, "--unsafe-adapter-override", "--prompt-mode", "stdin"];
}

function delegateArgs(contract, command, extras = []) {
  return [
    "--agent", "codex",
    "--role", contract.role,
    "--unit", contract.unit,
    ...contractArgs(contract),
    ...overrideArgs(command),
    ...extras,
  ];
}

function schemaTypeMatches(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  return typeof value === type;
}

function resolveSchemaRef(root, ref) {
  assert.match(ref, /^#\//, `unsupported external schema ref: ${ref}`);
  return ref.slice(2).split("/").reduce((value, segment) => value[segment.replace(/~1/g, "/").replace(/~0/g, "~")], root);
}

function schemaErrors(value, schema, root = schema, at = "$") {
  if (schema === true) return [];
  if (schema === false) return [`${at} is forbidden`];
  if (schema.$ref) return schemaErrors(value, resolveSchemaRef(root, schema.$ref), root, at);
  const errors = [];
  if (schema.anyOf) {
    const candidates = schema.anyOf.map((candidate) => schemaErrors(value, candidate, root, at));
    if (candidates.every((candidate) => candidate.length > 0)) errors.push(`${at} does not match any allowed schema`);
  }
  if (schema.const !== undefined && value !== schema.const) errors.push(`${at} must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at} is not in the allowed enum`);
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((type) => schemaTypeMatches(value, type))) errors.push(`${at} has the wrong type`);
  }
  if (typeof value === "string") {
    if (schema.minLength != null && value.length < schema.minLength) errors.push(`${at} is too short`);
    if (schema.maxLength != null && value.length > schema.maxLength) errors.push(`${at} is too long`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at} does not match ${schema.pattern}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${at} has too few items`);
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${at} has too many items`);
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) errors.push(`${at} contains duplicate items`);
    if (schema.items) value.forEach((item, index) => errors.push(...schemaErrors(item, schema.items, root, `${at}[${index}]`)));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    for (const required of schema.required || []) {
      if (!Object.hasOwn(value, required)) errors.push(`${at}.${required} is required`);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(schema.properties || {}, key)) errors.push(`${at}.${key} is not allowed`);
      }
    }
    for (const [key, child] of Object.entries(schema.properties || {})) {
      if (Object.hasOwn(value, key)) errors.push(...schemaErrors(value[key], child, root, `${at}.${key}`));
    }
  }
  for (const condition of schema.allOf || []) {
    if (condition.if) {
      const matched = schemaErrors(value, condition.if, root, at).length === 0;
      if (matched && condition.then) errors.push(...schemaErrors(value, condition.then, root, at));
      if (!matched && condition.else) errors.push(...schemaErrors(value, condition.else, root, at));
    } else {
      errors.push(...schemaErrors(value, condition, root, at));
    }
  }
  if (schema.not && schemaErrors(value, schema.not, root, at).length === 0) errors.push(`${at} matches a forbidden schema`);
  return errors;
}

test("validate-contract accepts the compact v1 contract and rejects contract drift", async (t) => {
  const cwd = tempDir("validate-contract");
  const valid = contractData({ unit: "U-contract" });
  const file = writeContract(cwd, valid);
  const accepted = runRaw(["validate-contract", file, "--json"], { cwd });
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.deepEqual(parseOutput(accepted), {
    schema: "ContractValidationV1",
    contract: file,
    valid: true,
    errors: [],
  });

  const conflictingSource = runRaw(["validate-contract", file, "--contract", file, "--json"], { cwd });
  assert.equal(conflictingSource.status, 1);
  assert.match(conflictingSource.stderr, /one path source/);

  const cases = [
    ["unknown property", { ...valid, authoritiy: "typo" }, /unsupported property: authoritiy/],
    ["loose acceptance ID", { ...valid, acceptance: [{ id: "HTTP2", outcome: "No accidental IDs.", evidence: ["proof"] }] }, /must match A1/],
    ["verifier mutation", { ...valid, expected_effect: "mutation_allowed", write_scope: ["touched.txt"] }, /verifier requires expected_effect read_only/],
    ["self authority", { ...valid, authority: { grants: ["The worker itself approved this authority."], source: valid.authority.source } }, /cannot make the delegated worker its own authority/],
    ["broad scope", { ...valid, role: "implementer", expected_effect: "mutation_allowed", write_scope: ["all files"] }, /write_scope\[0\]/],
  ];
  for (const [name, data, expected] of cases) {
    await t.test(name, () => {
      const invalidFile = writeContract(cwd, data, `${name.replaceAll(" ", "-")}.json`);
      const rejected = runRaw(["validate-contract", invalidFile, "--json"], { cwd });
      assert.equal(rejected.status, 1, rejected.stderr);
      const report = parseOutput(rejected);
      assert.equal(report.valid, false);
      assert.match(report.errors.join("; "), expected);
    });
  }
});

test("contract runtime and packaged schema share text, uniqueness, and portable-path bounds", async (t) => {
  const cwd = tempDir("contract-schema-parity");
  const valid = contractData({
    unit: "U-contract-parity",
    role: "implementer",
    writeScope: ["docs/file with space.txt"],
  });
  assert.deepEqual(schemaErrors(valid, contractSchema), []);
  const accepted = runRaw(["validate-contract", writeContract(cwd, valid, "valid.json"), "--json"], { cwd });
  assert.equal(accepted.status, 0, accepted.stderr);

  const cases = [
    ["padded objective", { ...valid, objective: " padded " }],
    ["oversized objective", { ...valid, objective: "x".repeat(1001) }],
    ["oversized input", { ...valid, inputs: ["x".repeat(1025)] }],
    ["duplicate input", { ...valid, inputs: ["same", "same"] }],
    ["oversized write path", { ...valid, write_scope: [`${"a".repeat(509)}.txt`] }],
    ["backslash write path", { ...valid, write_scope: ["docs\\file.txt"] }],
    ["unsupported write character", { ...valid, write_scope: ["docs/file%.txt"] }],
    ["duplicate write path", { ...valid, write_scope: ["one.txt", "one.txt"] }],
    ["padded authority", { ...valid, authority: { ...valid.authority, grants: [" padded "] } }],
    ["duplicate evidence", { ...valid, acceptance: [{ ...valid.acceptance[0], evidence: ["same", "same"] }] }],
    ["multiline check", { ...valid, checks: ["line one\nline two"] }],
  ];
  for (const [name, data] of cases) {
    await t.test(name, () => {
      assert.ok(schemaErrors(data, contractSchema).length > 0, `${name} must fail the packaged schema`);
      const rejected = runRaw(["validate-contract", writeContract(cwd, data, `${name.replaceAll(" ", "-")}.json`), "--json"], { cwd });
      assert.equal(rejected.status, 1, `${name} unexpectedly passed runtime validation: ${rejected.stdout}`);
      assert.equal(parseOutput(rejected).valid, false);
    });
  }
});

test("contract file reads are bounded and reject symlinks before parsing", (t) => {
  const cwd = tempDir("contract-file-safety");
  const oversized = path.join(cwd, "oversized.json");
  fs.writeFileSync(oversized, `{"padding":"${"x".repeat(64 * 1024)}"}`);
  const bounded = runRaw(["validate-contract", oversized, "--json"], { cwd });
  assert.equal(bounded.status, 1, bounded.stderr);
  assert.match(parseOutput(bounded).errors.join(" "), /exceeds 65536 bytes/);

  const real = writeContract(cwd, contractData({ unit: "U-symlink" }), "real.json");
  const link = path.join(cwd, "linked.json");
  try {
    fs.symlinkSync(real, link, "file");
  } catch (error) {
    if (["EPERM", "EACCES", "ENOTSUP"].includes(error.code)) {
      t.skip(`file symlinks unavailable: ${error.code}`);
      return;
    }
    throw error;
  }
  const linked = runRaw(["validate-contract", link, "--json"], { cwd });
  assert.equal(linked.status, 1, linked.stderr);
  assert.match(parseOutput(linked).errors.join(" "), /regular, non-symlink file/);
});

test("delegate preview is non-mutating, reports prompt cost, and enforces the prompt budget", () => {
  const cwd = tempDir("preview");
  const contract = contractData({ unit: "U-preview", role: "implementer", writeScope: ["touched.txt"] });
  const command = workerCommand({
    before: "fs.writeFileSync('touched.txt','preview must not run');",
    result: compactResult({ changes: ["touched.txt"] }),
  });
  const preview = runDelegate(delegateArgs(contract, command, ["--cwd", cwd, "--preview"]), { cwd });
  assert.equal(preview.result.status, 0, preview.result.stderr);
  assert.equal(preview.report.schema, "DelegatePreviewV1");
  assert.equal(preview.report.status, "PASS");
  assert.ok(preview.report.contract_bytes > 0);
  assert.ok(preview.report.prompt_bytes > preview.report.contract_bytes);
  assert.equal(preview.report.estimated_prompt_tokens, Math.ceil(preview.report.prompt_bytes / 4));
  assert.deepEqual(preview.report.guard.write_scope, ["touched.txt"]);
  assert.equal(fs.existsSync(path.join(cwd, "touched.txt")), false);

  const limited = runDelegate(delegateArgs(contract, command, ["--cwd", cwd, "--max-prompt-bytes", "128"]), { cwd });
  assert.equal(limited.result.status, 2, limited.result.stderr);
  assert.equal(limited.report.status, "BLOCKED");
  assert.equal(limited.report.reason, "prompt_budget_exceeded");
  assert.match(limited.report.summary, /limit is 128/);
  assert.equal(fs.existsSync(path.join(cwd, "touched.txt")), false);
});

test("built-in adapters report and use the provider transport schema budget", () => {
  const contract = contractData({ unit: "U-provider-preview" });
  const schemaBytes = Buffer.byteLength(fs.readFileSync(
    path.join(repoRoot, "schemas", "worker-result-transport-v1.schema.json"),
    "utf8",
  ));
  for (const agent of ["codex", "claude-code"]) {
    const result = runRaw([
      "delegate", "--agent", agent, "--role", "verifier", "--unit", contract.unit,
      ...contractArgs(contract), "--preview",
    ]);
    assert.equal(result.status, 0, result.stderr);
    const preview = parseOutput(result);
    assert.equal(preview.schema_bytes, schemaBytes);
    assert.match(preview.command.join(" "), /WorkerResultV1 schema/);
  }
});

test("provider transport requires one portable intersection grammar", () => {
  const allowedByType = {
    object: new Set(["type", "additionalProperties", "required", "properties"]),
    array: new Set(["type", "items"]),
    string: new Set(["type", "enum"]),
  };
  const visit = (node) => {
    assert.ok(allowedByType[node.type], `unsupported transport type ${node.type}`);
    for (const key of Object.keys(node)) assert.ok(allowedByType[node.type].has(key), `unsupported transport keyword ${key}`);
    if (node.type === "object") {
      assert.equal(node.additionalProperties, false);
      assert.deepEqual([...node.required].sort(), Object.keys(node.properties).sort());
      Object.values(node.properties).forEach(visit);
    } else if (node.type === "array") {
      visit(node.items);
    }
  };
  visit(resultTransportSchema);
  assert.deepEqual(resultTransportSchema.properties.schema.enum, ["WorkerResultV1"]);
});

test("custom adapter overrides require an explicit unsafe acknowledgement", () => {
  const contract = contractData({ unit: "U-unsafe" });
  const result = runRaw([
    "delegate", "--agent", "codex", "--role", "verifier", "--unit", contract.unit,
    ...contractArgs(contract), "--adapter-command", workerCommand(), "--prompt-mode", "stdin",
  ]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--adapter-command requires --unsafe-adapter-override/);
  assert.equal(result.stdout, "");

  const ignoredDelegateFlag = runRaw([
    "delegate", "--agent", "codex", "--role", "verifier", "--unit", contract.unit,
    ...contractArgs(contract), "--prompt-mode", "arg", "--preview",
  ]);
  assert.equal(ignoredDelegateFlag.status, 1);
  assert.match(ignoredDelegateFlag.stderr, /valid only with --adapter-command/);

  const ignoredDoctorFlag = runRaw([
    "delegate-doctor", "--agent", "claude-code", "--unsafe-adapter-override",
  ]);
  assert.equal(ignoredDoctorFlag.status, 1);
  assert.match(ignoredDoctorFlag.stderr, /valid only with --adapter-command/);
});

test("compact WorkerResultV1 is normalized into the trusted supervisor envelope", () => {
  const contract = contractData({ unit: "U-normalize" });
  const raw = compactResult({
    summary: "Compact output accepted.",
    checks: ["node fixture: PASS"],
    skipped: ["browser unavailable"],
    findings: ["No regressions observed"],
    next: "supervisor_accept",
  });
  assert.deepEqual(schemaErrors(raw, resultSchema), []);
  const { result, report } = runDelegate(delegateArgs(contract, workerCommand({ result: raw })));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(report.schema, "WorkerReportV1");
  assert.equal(report.status, "PASS");
  assert.equal(report.role, "verifier");
  assert.equal(report.unit_id, contract.unit);
  assert.equal(report.summary, "Compact output accepted.");
  assert.deepEqual(report.changed_surfaces, []);
  assert.deepEqual(report.evidence, [{ kind: "A1", detail: "fixture evidence" }]);
  assert.deepEqual(report.checks_run, ["node fixture: PASS"]);
  assert.deepEqual(report.skipped_checks, ["browser unavailable"]);
  assert.equal(report.outcome_evaluations[0].source_requirement, contract.acceptance[0].outcome);
  assert.deepEqual(report.outcome_evaluations[0].required_external_check, contract.acceptance[0].evidence);
  assert.equal(report.adapter.source, "override");
  assert.deepEqual(report.guard.allowed_surface_violations, []);
});

test("provider-required empty optional strings normalize before canonical validation", () => {
  const contract = contractData({ unit: "U-transport-normalize" });
  const raw = {
    schema: "WorkerResultV1",
    status: "PASS",
    summary: "Provider transport output accepted.",
    changes: [],
    outcomes: [{ id: "A1", verdict: "PASS", evidence: ["fixture evidence"] }],
    checks: [],
    skipped: [],
    findings: [],
    blocker: "",
    next: "",
  };
  assert.deepEqual(schemaErrors(raw, resultTransportSchema), []);
  const delegated = runDelegate(delegateArgs(contract, workerCommand({ result: raw })));
  assert.equal(delegated.result.status, 0, delegated.result.stderr);
  assert.equal(delegated.report.status, "PASS");
  assert.equal(delegated.report.blocking_question, null);
  assert.equal(delegated.report.next_action, "supervisor_verify");
});

test("WorkerResult runtime rejects every context-free schema-invalid bound", async (t) => {
  const contract = contractData({ unit: "U-result-parity" });
  const base = compactResult();
  const cases = [
    ["missing outcomes", { schema: "WorkerResultV1", status: "PASS", summary: "Missing outcomes." }],
    ["outcomes is not an array", { ...base, outcomes: null }],
    ["changes is not an array", { ...base, changes: "one.txt" }],
    ["padded summary", { ...base, summary: " padded " }],
    ["oversized summary", { ...base, summary: "x".repeat(1001) }],
    ["duplicate checks", { ...base, checks: ["same", "same"] }],
    ["multiline check", { ...base, checks: ["line one\nline two"] }],
    ["duplicate evidence", { ...base, outcomes: [{ ...base.outcomes[0], evidence: ["same", "same"] }] }],
    ["padded evidence", { ...base, outcomes: [{ ...base.outcomes[0], evidence: [" padded "] }] }],
    ["duplicate change", { ...base, changes: ["one.txt", "one.txt"] }],
    ["oversized change", { ...base, changes: [`${"a".repeat(509)}.txt`] }],
    ["backslash change", { ...base, changes: ["docs\\file.txt"] }],
    ["unsupported change character", { ...base, changes: ["file%.txt"] }],
    ["explicit null next", { ...base, next: null }],
  ];
  for (const [name, workerResult] of cases) {
    await t.test(name, () => {
      assert.ok(schemaErrors(workerResult, resultSchema).length > 0, `${name} must fail the packaged schema`);
      const delegated = runDelegate(delegateArgs(contract, workerCommand({ result: workerResult })));
      assert.equal(delegated.result.status, 2, delegated.result.stderr);
      assert.equal(delegated.report.reason, "report_validation_failed");
    });
  }
});

test("portable paths with internal spaces pass schema, runtime, and mutation reconciliation", () => {
  const cwd = tempDir("space-path");
  const target = "docs/file with space.txt";
  fs.mkdirSync(path.join(cwd, "docs"));
  const contract = contractData({
    unit: "U-space-path",
    role: "implementer",
    expectedEffect: "mutation_required",
    writeScope: [target],
  });
  const workerResult = compactResult({ changes: [target] });
  assert.deepEqual(schemaErrors(contract, contractSchema), []);
  assert.deepEqual(schemaErrors(workerResult, resultSchema), []);
  const command = workerCommand({
    before: `fs.mkdirSync('docs',{recursive:true});fs.writeFileSync(${JSON.stringify(target)},'ok');`,
    result: workerResult,
  });
  const delegated = runDelegate(delegateArgs(contract, command, ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 0, delegated.result.stderr);
  assert.equal(delegated.report.status, "PASS");
  assert.deepEqual(delegated.report.guard.observed_changed_surfaces, [target]);
});

test("PASS requires exact acceptance IDs and row-mapped evidence", async (t) => {
  const contract = contractData({
    unit: "U-evidence",
    acceptance: [
      { id: "A1", outcome: "First outcome.", evidence: ["first proof"] },
      { id: "A2", outcome: "Second outcome.", evidence: ["second proof"] },
    ],
  });
  const cases = [
    ["missing row", compactResult({ outcomes: [{ id: "A1", verdict: "PASS", evidence: ["proof"] }] }), /missing acceptance outcome A2/],
    ["unknown row", compactResult({ outcomes: [
      { id: "A1", verdict: "PASS", evidence: ["proof"] },
      { id: "A999", verdict: "PASS", evidence: ["proof"] },
    ] }), /unknown acceptance ID: A999/],
    ["empty evidence", compactResult({ outcomes: [
      { id: "A1", verdict: "PASS", evidence: [] },
      { id: "A2", verdict: "PASS", evidence: ["proof"] },
    ] }), /outcomes\[0\]\.PASS requires evidence/],
    ["duplicate row", compactResult({ outcomes: [
      { id: "A1", verdict: "PASS", evidence: ["one"] },
      { id: "A1", verdict: "PASS", evidence: ["two"] },
    ] }), /outcome IDs must be unique/],
  ];
  for (const [name, workerResult, expected] of cases) {
    await t.test(name, () => {
      const delegated = runDelegate(delegateArgs(contract, workerCommand({ result: workerResult })));
      assert.equal(delegated.result.status, 2, delegated.result.stderr);
      assert.equal(delegated.report.status, "BLOCKED");
      assert.equal(delegated.report.reason, "report_validation_failed");
      assert.match(delegated.report.summary, expected);
    });
  }
});

test("BLOCKED and FAIL results validate strictly and default to exit code 2", async (t) => {
  const contract = contractData({ unit: "U-terminal" });
  const blockedResult = compactResult({
    status: "BLOCKED",
    summary: "Required evidence is unavailable.",
    outcomes: [{ id: "A1", verdict: "BLOCKED", evidence: [] }],
    blocker: "The deterministic fixture cannot be opened.",
  });
  const blocked = runDelegate(delegateArgs(contract, workerCommand({ result: blockedResult })));
  assert.equal(blocked.result.status, 2, blocked.result.stderr);
  assert.equal(blocked.report.status, "BLOCKED");
  assert.equal(blocked.report.reason, null);
  assert.equal(blocked.report.blocking_question, "The deterministic fixture cannot be opened.");

  const failedResult = compactResult({
    status: "FAIL",
    summary: "Acceptance evidence disproves the outcome.",
    outcomes: [{ id: "A1", verdict: "FAIL", evidence: ["fixture mismatch"] }],
  });
  const failed = runDelegate(delegateArgs(contract, workerCommand({ result: failedResult })));
  assert.equal(failed.result.status, 2, failed.result.stderr);
  assert.equal(failed.report.status, "FAIL");
  assert.equal(failed.report.blocking_question, null);

  const soft = runDelegate(delegateArgs(contract, workerCommand({ result: failedResult }), ["--soft-exit"]));
  assert.equal(soft.result.status, 0, soft.result.stderr);
  assert.equal(soft.report.status, "FAIL");

  await t.test("BLOCKED requires blocker", () => {
    const invalid = runDelegate(delegateArgs(contract, workerCommand({
      result: compactResult({
        status: "BLOCKED",
        summary: "Missing blocker field.",
        outcomes: [{ id: "A1", verdict: "BLOCKED", evidence: [] }],
      }),
    })));
    assert.equal(invalid.result.status, 2, invalid.result.stderr);
    assert.equal(invalid.report.reason, "report_validation_failed");
    assert.match(invalid.report.summary, /BLOCKED requires a concrete single-line blocker/);
  });

  await t.test("PASS and FAIL forbid blocker", () => {
    const invalid = runDelegate(delegateArgs(contract, workerCommand({
      result: compactResult({ blocker: "should not exist" }),
    })));
    assert.equal(invalid.result.status, 2, invalid.result.stderr);
    assert.match(invalid.report.summary, /PASS and FAIL must omit blocker/);
  });
});

test("credential environment forwarding uses an exact, contract-authorized allowlist", () => {
  const cwd = tempDir("credentials");
  const name = "WORKFLOW_TEST_SECRET_TOKEN";
  const other = "WORKFLOW_OTHER_SECRET_TOKEN";
  const secretValue = "short-opaque-value";
  const env = { ...process.env, [name]: secretValue, [other]: "must-not-pass" };
  const inspectEnv = () => {
    const raw = compactResult();
    const script = [
      `const result=${JSON.stringify(raw)};`,
      `const seen=process.env.${name}?'named-present':'named-absent';`,
      `const other=process.env.${other}?'other-present':'other-absent';`,
      "result.summary=`${seen}:${other}`;",
      "process.stdout.write(`${JSON.stringify(result)}\\n`);",
    ].join("");
    return JSON.stringify([process.execPath, "-e", script]);
  };

  const plain = contractData({ unit: "U-env-plain" });
  const stripped = runDelegate(delegateArgs(plain, inspectEnv()), { cwd, env });
  assert.equal(stripped.result.status, 0, stripped.result.stderr);
  assert.equal(stripped.report.summary, "named-absent:other-absent");

  const unauthorized = runDelegate(delegateArgs(plain, inspectEnv(), ["--credential-env", name]), { cwd, env });
  assert.equal(unauthorized.result.status, 2, unauthorized.result.stderr);
  assert.equal(unauthorized.report.reason, "invalid_contract");
  assert.match(unauthorized.report.summary, /requires explicit named credential-environment authority/);

  const duplicate = runDelegate(delegateArgs(plain, inspectEnv(), ["--credential-env", `${name},${name}`]), { cwd, env });
  assert.equal(duplicate.result.status, 2, duplicate.result.stderr);
  assert.equal(duplicate.report.reason, "invalid_contract");
  assert.match(duplicate.report.summary, /must not contain duplicate variable names/);

  const authorized = contractData({
    unit: "U-env-authorized",
    grants: [`Credential environment variable ${name} is explicitly authorized for this local adapter.`],
  });
  const forwarded = runDelegate(delegateArgs(authorized, inspectEnv(), ["--credential-env", name]), { cwd, env });
  assert.equal(forwarded.result.status, 0, forwarded.result.stderr);
  assert.equal(forwarded.report.summary, "named-present:other-absent");
  assert.doesNotMatch(JSON.stringify(forwarded.report), /short-opaque-value|must-not-pass/);

  const echoScript = [
    `const value=process.env.${name};`,
    `const result=${JSON.stringify(compactResult())};`,
    "result.summary=value;",
    "result.outcomes[0].evidence=[value];",
    "result.checks=[value];result.skipped=[value];result.findings=[value];result.next=value;",
    "process.stdout.write(`${JSON.stringify(result)}\\n`);",
  ].join("");
  const echoed = runDelegate(delegateArgs(authorized, JSON.stringify([process.execPath, "-e", echoScript]), [
    "--credential-env", name,
  ]), { cwd, env });
  assert.equal(echoed.result.status, 0, echoed.result.stderr);
  assert.equal(echoed.report.status, "PASS");
  assert.equal(JSON.stringify(echoed.report).includes(secretValue), false);
  assert.match(JSON.stringify(echoed.report), /<redacted>/);

  const punctuationName = "WORKFLOW_JSON_SECRET_TOKEN";
  const punctuationEnv = { ...env, [punctuationName]: '"' };
  const punctuationContract = contractData({
    unit: "U-env-json-punctuation",
    grants: [`Credential environment variable ${punctuationName} is explicitly authorized for this local adapter.`],
  });
  const punctuationScript = [
    `const result=${JSON.stringify(compactResult())};`,
    `result.summary=process.env.${punctuationName};`,
    "process.stdout.write(`${JSON.stringify(result)}\\n`);",
  ].join("");
  const punctuation = runDelegate(delegateArgs(
    punctuationContract,
    JSON.stringify([process.execPath, "-e", punctuationScript]),
    ["--credential-env", punctuationName],
  ), { cwd, env: punctuationEnv });
  assert.equal(punctuation.result.status, 0, punctuation.result.stderr);
  assert.equal(punctuation.report.status, "PASS");
  assert.equal(punctuation.report.summary, "<redacted>");

  const nestedName = "WORKFLOW_NESTED_JSON_SECRET_TOKEN";
  const nestedValue = JSON.stringify(compactResult({ status: "FAIL", summary: "credential payload" }));
  const nestedEnv = { ...env, [nestedName]: nestedValue };
  const nestedContract = contractData({
    unit: "U-env-nested-json",
    grants: [`Credential environment variable ${nestedName} is explicitly authorized for this local adapter.`],
  });
  const nestedScript = [
    `const result=${JSON.stringify(compactResult())};`,
    `result.summary=process.env.${nestedName};`,
    "process.stdout.write(`${JSON.stringify(result)}\\n`);",
  ].join("");
  const nested = runDelegate(delegateArgs(
    nestedContract,
    JSON.stringify([process.execPath, "-e", nestedScript]),
    ["--credential-env", nestedName],
  ), { cwd, env: nestedEnv });
  assert.equal(nested.result.status, 0, nested.result.stderr);
  assert.equal(nested.report.status, "PASS");
  assert.equal(nested.report.summary, "<redacted>");

  const reservedName = "WORKFLOW_RESERVED_SECRET_TOKEN";
  const reservedEnv = { ...env, [reservedName]: "PASS" };
  const reservedContract = contractData({
    unit: "U-env-reserved",
    grants: [`Credential environment variable ${reservedName} is explicitly authorized for this local adapter.`],
  });
  const reserved = runDelegate(delegateArgs(reservedContract, workerCommand({
    before: "fs.writeFileSync('reserved-worker-launched','yes');",
  }), ["--cwd", cwd, "--credential-env", reservedName]), { cwd, env: reservedEnv });
  assert.equal(reserved.result.status, 2, reserved.result.stderr);
  assert.equal(reserved.report.status, "BLOCKED");
  assert.equal(reserved.report.reason, "invalid_contract");
  assert.match(reserved.report.summary, /reserved workflow protocol identifier/);
  assert.equal(fs.existsSync(path.join(cwd, "reserved-worker-launched")), false);

  const pathName = "WORKFLOW_PATH_COLLISION_SECRET_TOKEN";
  const pathEnv = { ...env, [pathName]: "touched.txt" };
  const pathContract = contractData({
    unit: "U-env-path-collision",
    role: "implementer",
    expectedEffect: "mutation_required",
    writeScope: ["touched.txt"],
    grants: [`Credential environment variable ${pathName} is explicitly authorized for this local adapter.`],
  });
  const pathCollision = runDelegate(delegateArgs(pathContract, workerCommand({
    result: compactResult({ changes: ["touched.txt"] }),
    before: "fs.writeFileSync('touched.txt','mutated');",
  }), ["--cwd", cwd, "--credential-env", pathName]), { cwd, env: pathEnv });
  assert.equal(pathCollision.result.status, 0, pathCollision.result.stderr);
  assert.equal(pathCollision.report.status, "PASS");
  assert.deepEqual(pathCollision.report.changed_surfaces, ["touched.txt"]);
  assert.deepEqual(pathCollision.report.guard.observed_changed_surfaces, ["touched.txt"]);

  const missingName = "WORKFLOW_MISSING_SECRET_TOKEN";
  const missingContract = contractData({
    unit: "U-env-missing",
    grants: [`Credential environment variable ${missingName} is explicitly authorized for this local adapter.`],
  });
  const missingEnv = { ...env };
  delete missingEnv[missingName];
  const missing = runDelegate(delegateArgs(missingContract, workerCommand({
    before: "require('node:fs').writeFileSync('credential-worker-launched','yes');",
  }), ["--cwd", cwd, "--credential-env", missingName]), { cwd, env: missingEnv });
  assert.equal(missing.result.status, 2, missing.result.stderr);
  assert.equal(missing.report.reason, "invalid_contract");
  assert.match(missing.report.summary, /is not present in the parent environment/);
  assert.equal(fs.existsSync(path.join(cwd, "credential-worker-launched")), false);

  const deprecated = runDelegate(delegateArgs(plain, inspectEnv(), ["--allow-credential-env"]), { cwd, env });
  assert.equal(deprecated.result.status, 2, deprecated.result.stderr);
  assert.match(deprecated.report.summary, /no longer supported/);
});

test("diagnostic redaction removes secrets while preserving Git hashes and UUID identity", () => {
  const sha40 = "0123456789abcdef0123456789abcdef01234567";
  const sha64 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
  const secret = "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ123456";
  const awsAccessKey = "AKIAABCDEFGHIJKLMNOP";
  const awsSessionKey = "ASIAQRSTUVWXYZABCDEF";
  const uuid = "123e4567-e89b-42d3-a456-426614174000";
  const contract = contractData({ unit: uuid });
  const raw = compactResult({
    summary: `commit ${sha40}; content ${sha64}; token=${secret}; aws=${awsAccessKey}; session=${awsSessionKey}`,
    outcomes: [{ id: "A1", verdict: "PASS", evidence: [`commit ${sha40}`, `token=${secret}`] }],
  });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({ result: raw })));
  assert.equal(delegated.result.status, 0, delegated.result.stderr);
  const output = JSON.stringify(delegated.report);
  assert.equal(output.includes(secret), false);
  assert.equal(output.includes(awsAccessKey), false);
  assert.equal(output.includes(awsSessionKey), false);
  assert.ok(output.includes(sha40));
  assert.ok(output.includes(sha64));
  assert.equal(delegated.report.unit_id, uuid);
  assert.match(delegated.report.summary, /token=<redacted>/);

  const missing = runDelegate(delegateArgs(contract, JSON.stringify([
    "workflow-supervisor-definitely-missing-binary", "--api-key", secret, sha40,
  ])));
  assert.equal(missing.result.status, 2, missing.result.stderr);
  assert.equal(missing.report.reason, "adapter_cli_missing");
  assert.equal(JSON.stringify(missing.report).includes(secret), false);
  assert.ok(JSON.stringify(missing.report).includes(sha40));
});

test("guard blocks out-of-scope and explicitly forbidden workspace changes", async (t) => {
  await t.test("out of scope", () => {
    const cwd = tempDir("outside");
    const contract = contractData({ unit: "U-outside", role: "implementer", writeScope: ["touched.txt"] });
    const result = compactResult({ changes: ["surprise.txt"] });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      result,
      before: "fs.writeFileSync('surprise.txt','outside');",
    }), ["--cwd", cwd]), { cwd });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.equal(delegated.report.reason, "report_validation_failed");
    assert.ok(delegated.report.guard.allowed_surface_violations.includes("surprise.txt"));
    assert.ok(delegated.report.guard.observed_changed_surfaces.includes("surprise.txt"));
  });

  await t.test("explicitly forbidden", () => {
    const cwd = tempDir("forbidden");
    const contract = contractData({ unit: "U-forbidden", role: "implementer", writeScope: ["touched.txt", "forbidden.txt"] });
    const result = compactResult({ changes: ["forbidden.txt"] });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      result,
      before: "fs.writeFileSync('forbidden.txt','forbidden');",
    }), ["--cwd", cwd, "--forbidden-surfaces", "forbidden.txt"]), { cwd });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.ok(delegated.report.guard.role_violations.some((item) => item.includes("forbidden.txt")));
  });
});

test("read-only and mutation-required effects reconcile reports with observed state", async (t) => {
  await t.test("read-only mutation", () => {
    const cwd = tempDir("read-only");
    const contract = contractData({ unit: "U-read-only" });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      result: compactResult(),
      before: "fs.writeFileSync('unexpected.txt','mutation');",
    }), ["--cwd", cwd]), { cwd });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.equal(delegated.report.reason, "report_validation_failed");
    assert.ok(delegated.report.guard.role_violations.some((item) => item.includes("verifier changed")));
    assert.match(delegated.report.summary, /read_only contract observed workspace mutation/);
  });

  await t.test("required mutation missing", () => {
    const cwd = tempDir("required-missing");
    const contract = contractData({
      unit: "U-required-missing",
      role: "implementer",
      expectedEffect: "mutation_required",
      writeScope: ["touched.txt"],
    });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({ result: compactResult({ changes: [] }) }), ["--cwd", cwd]), { cwd });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.match(delegated.report.summary, /mutation_required contract produced PASS without an observed workspace mutation/);
  });

  await t.test("optional mutation cannot claim an unobserved change", () => {
    const cwd = tempDir("optional-false-claim");
    const contract = contractData({ unit: "U-optional-claim", role: "implementer", writeScope: ["claimed.txt"] });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      result: compactResult({ changes: ["claimed.txt"] }),
    }), ["--cwd", cwd]), { cwd });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.match(delegated.report.summary, /reported a changed surface with no observed mutation: claimed\.txt/);
  });

  await t.test("required mutation cannot add an unobserved change claim", () => {
    const cwd = tempDir("required-extra-claim");
    const contract = contractData({
      unit: "U-required-extra-claim",
      role: "implementer",
      expectedEffect: "mutation_required",
      writeScope: ["touched.txt", "claimed.txt"],
    });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      result: compactResult({ changes: ["touched.txt", "claimed.txt"] }),
      before: "fs.writeFileSync('touched.txt','observed');",
    }), ["--cwd", cwd]), { cwd });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.match(delegated.report.summary, /reported a changed surface with no observed mutation: claimed\.txt/);
  });

  await t.test("required mutation observed and reported", () => {
    const cwd = tempDir("required-pass");
    const contract = contractData({
      unit: "U-required-pass",
      role: "implementer",
      expectedEffect: "mutation_required",
      writeScope: ["touched.txt"],
    });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      result: compactResult({ changes: ["touched.txt"] }),
      before: "fs.writeFileSync('touched.txt','expected mutation');",
    }), ["--cwd", cwd]), { cwd });
    assert.equal(delegated.result.status, 0, delegated.result.stderr);
    assert.equal(delegated.report.status, "PASS");
    assert.deepEqual(delegated.report.guard.observed_changed_surfaces, ["touched.txt"]);
  });
});

test("mutable delegation blocks dirty Git state unless explicitly acknowledged", () => {
  const cwd = tempDir("dirty");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  fs.writeFileSync(path.join(cwd, "user.txt"), "clean\n");
  assert.equal(spawnSync("git", ["-C", cwd, "add", "user.txt"]).status, 0);
  assert.equal(spawnSync("git", ["-C", cwd, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);
  fs.writeFileSync(path.join(cwd, "user.txt"), "pre-existing user edit\n");

  const contract = contractData({ unit: "U-dirty", role: "implementer", writeScope: ["touched.txt"] });
  const command = workerCommand({
    result: compactResult({ changes: ["touched.txt"] }),
    before: "fs.writeFileSync('touched.txt','worker mutation');",
  });
  const blocked = runDelegate(delegateArgs(contract, command, ["--cwd", cwd]), { cwd });
  assert.equal(blocked.result.status, 2, blocked.result.stderr);
  assert.equal(blocked.report.reason, "dirty_workspace");
  assert.equal(fs.existsSync(path.join(cwd, "touched.txt")), false);

  const allowed = runDelegate(delegateArgs(contract, command, ["--cwd", cwd, "--allow-dirty"]), { cwd });
  assert.equal(allowed.result.status, 0, allowed.result.stderr);
  assert.equal(allowed.report.status, "PASS");
  assert.deepEqual(allowed.report.guard.observed_changed_surfaces, ["touched.txt"]);
});

test("Git guard fails closed when control state exists but Git is unavailable", () => {
  const cwd = tempDir("git-unavailable");
  const gitDir = path.join(cwd, ".git");
  fs.mkdirSync(gitDir);
  fs.writeFileSync(path.join(gitDir, "HEAD"), "before\n");
  const contract = contractData({ unit: "U-git-unavailable" });
  const env = { ...process.env, PATH: tempDir("empty-path") };
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    before: "fs.writeFileSync('.git/HEAD','after\\n');",
  }), ["--cwd", cwd]), { cwd, env });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "surface_guard_unavailable");
  assert.match(delegated.report.summary, /Git control state is present but Git status could not be read/);
  assert.equal(fs.readFileSync(path.join(gitDir, "HEAD"), "utf8"), "before\n");
});

test("Git guard detects newly created control locks and object alternates", async (t) => {
  for (const [name, relative] of [
    ["index lock", ".git/index.lock"],
    ["object alternates", ".git/objects/info/alternates"],
  ]) {
    await t.test(name, () => {
      const cwd = tempDir(`git-${name.replaceAll(" ", "-")}`);
      assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
      fs.mkdirSync(path.dirname(path.join(cwd, relative)), { recursive: true });
      const contract = contractData({ unit: `U-${name.replaceAll(" ", "-")}` });
      const delegated = runDelegate(delegateArgs(contract, workerCommand({
        before: `fs.mkdirSync(${JSON.stringify(path.dirname(relative))},{recursive:true});fs.writeFileSync(${JSON.stringify(relative)},'changed');`,
      }), ["--cwd", cwd]), { cwd });
      assert.equal(delegated.result.status, 2, delegated.result.stderr);
      assert.equal(delegated.report.reason, "report_validation_failed");
      assert.ok(
        delegated.report.guard.observed_changed_surfaces.some((surface) => surface.endsWith(`:${relative.slice(5)}>`)),
        JSON.stringify(delegated.report.guard),
      );
      assert.ok(delegated.report.guard.role_violations.some((item) => /git control state/.test(item)));
    });
  }
});

test("Git guard detects mutation of the loose object backing HEAD", () => {
  const cwd = tempDir("git-head-object");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  fs.writeFileSync(path.join(cwd, "tracked.txt"), "baseline\n");
  assert.equal(spawnSync("git", ["-C", cwd, "add", "tracked.txt"]).status, 0);
  assert.equal(spawnSync("git", ["-C", cwd, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);
  const head = spawnSync("git", ["-C", cwd, "rev-parse", "HEAD"], { encoding: "utf8" }).stdout.trim();
  const objectPath = `.git/objects/${head.slice(0, 2)}/${head.slice(2)}`;
  assert.equal(fs.existsSync(path.join(cwd, objectPath)), true, "expected a loose HEAD object");
  const contract = contractData({ unit: "U-git-head-object" });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    before: `fs.chmodSync(${JSON.stringify(objectPath)},0o644);fs.appendFileSync(${JSON.stringify(objectPath)},'corrupt');`,
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "report_validation_failed");
  assert.ok(delegated.report.guard.observed_changed_surfaces.some((surface) => surface.includes(`objects/${head.slice(0, 2)}/${head.slice(2)}`)));
});

test("Git guard recursively watches registered submodule worktrees", () => {
  const source = tempDir("submodule-source");
  assert.equal(spawnSync("git", ["-C", source, "init", "-q"]).status, 0);
  fs.writeFileSync(path.join(source, "inside.txt"), "baseline\n");
  assert.equal(spawnSync("git", ["-C", source, "add", "inside.txt"]).status, 0);
  assert.equal(spawnSync("git", ["-C", source, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);

  const cwd = tempDir("submodule-super");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  const added = spawnSync("git", ["-C", cwd, "-c", "protocol.file.allow=always", "submodule", "add", "-q", source, "sub"]);
  assert.equal(added.status, 0, added.stderr?.toString());
  assert.equal(spawnSync("git", ["-C", cwd, "add", "."]).status, 0);
  assert.equal(spawnSync("git", ["-C", cwd, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);

  const contract = contractData({ unit: "U-submodule" });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    before: "fs.writeFileSync('sub/inside.txt','mutated\\n');",
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "report_validation_failed");
  assert.ok(delegated.report.guard.observed_changed_surfaces.includes("sub/inside.txt"), JSON.stringify(delegated.report.guard));
});

test("Git guard recursively watches untracked embedded repositories", () => {
  const cwd = tempDir("embedded-repo-super");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  const nested = path.join(cwd, "nested");
  fs.mkdirSync(nested);
  assert.equal(spawnSync("git", ["-C", nested, "init", "-q"]).status, 0);
  fs.writeFileSync(path.join(nested, "payload.txt"), "baseline\n");
  assert.equal(spawnSync("git", ["-C", nested, "add", "payload.txt"]).status, 0);
  assert.equal(spawnSync("git", ["-C", nested, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);

  const contract = contractData({ unit: "U-embedded-repo" });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    before: "fs.writeFileSync('nested/payload.txt','mutated\\n');",
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "report_validation_failed");
  assert.ok(delegated.report.guard.observed_changed_surfaces.includes("nested/payload.txt"), JSON.stringify(delegated.report.guard));
});

test("surface guard blocks workspace symlinks that escape the watched root", (t) => {
  if (process.platform === "win32") return t.skip("symlink privileges vary on Windows");
  const cwd = tempDir("unlisted-symlink-workspace");
  const outside = tempDir("unlisted-symlink-outside");
  fs.symlinkSync(outside, path.join(cwd, "escape"), "dir");
  const contract = contractData({
    unit: "U-unlisted-symlink",
    role: "implementer",
    expectedEffect: "mutation_allowed",
    writeScope: ["allowed.txt"],
  });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    before: "fs.writeFileSync('escape/escaped.txt','outside changed');",
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "surface_guard_unavailable");
  assert.match(delegated.report.summary, /workspace symlink escapes --cwd/);
  assert.equal(fs.existsSync(path.join(outside, "escaped.txt")), false);
});

test("Git guard scans escaping symlinks across the full repository root", (t) => {
  if (process.platform === "win32") return t.skip("symlink privileges vary on Windows");
  const root = tempDir("git-subdir-symlink-root");
  const cwd = path.join(root, "work");
  const outside = tempDir("git-subdir-symlink-outside");
  fs.mkdirSync(cwd);
  fs.writeFileSync(path.join(cwd, "tracked.txt"), "baseline\n");
  fs.symlinkSync(outside, path.join(root, "sibling"), "dir");
  assert.equal(spawnSync("git", ["-C", root, "init", "-q"]).status, 0);
  assert.equal(spawnSync("git", ["-C", root, "add", "."]).status, 0);
  assert.equal(spawnSync("git", ["-C", root, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);
  const contract = contractData({
    unit: "U-git-subdir-symlink",
    role: "implementer",
    expectedEffect: "mutation_allowed",
    writeScope: ["tracked.txt"],
  });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    before: "fs.writeFileSync('../sibling/escaped.txt','outside changed');",
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "surface_guard_unavailable");
  assert.match(delegated.report.summary, /workspace symlink escapes --cwd/);
  assert.equal(fs.existsSync(path.join(outside, "escaped.txt")), false);
});

test("Git guard rejects replacing its control marker with an escaping symlink", (t) => {
  if (process.platform === "win32") return t.skip("symlink privileges vary on Windows");
  const cwd = tempDir("git-marker-relocation");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  fs.writeFileSync(path.join(cwd, "allowed.txt"), "baseline\n");
  assert.equal(spawnSync("git", ["-C", cwd, "add", "allowed.txt"]).status, 0);
  assert.equal(spawnSync("git", ["-C", cwd, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);
  const outside = tempDir("relocated-git-control");
  const relocated = path.join(outside, "control.git");
  const contract = contractData({
    unit: "U-git-marker-relocation",
    role: "implementer",
    expectedEffect: "mutation_required",
    writeScope: ["allowed.txt"],
  });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    result: compactResult({ changes: ["allowed.txt"] }),
    before: `fs.renameSync('.git',${JSON.stringify(relocated)});fs.symlinkSync(${JSON.stringify(relocated)},'.git','dir');fs.writeFileSync('allowed.txt','mutated\\n');`,
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "report_validation_failed");
  assert.ok(delegated.report.guard.role_violations.some((item) => /surface guard could not verify/.test(item)), JSON.stringify(delegated.report.guard));
  assert.equal(fs.lstatSync(path.join(cwd, ".git")).isSymbolicLink(), true);
});

test("Git guard rejects replacing its control marker with an external gitdir file", () => {
  const cwd = tempDir("git-marker-file-relocation");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  fs.writeFileSync(path.join(cwd, "allowed.txt"), "baseline\n");
  assert.equal(spawnSync("git", ["-C", cwd, "add", "allowed.txt"]).status, 0);
  assert.equal(spawnSync("git", ["-C", cwd, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "base"]).status, 0);
  const outside = tempDir("relocated-gitdir-file-control");
  const relocated = path.join(outside, "control.git");
  const contract = contractData({
    unit: "U-git-marker-file-relocation",
    role: "implementer",
    expectedEffect: "mutation_required",
    writeScope: ["allowed.txt"],
  });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    result: compactResult({ changes: ["allowed.txt"] }),
    before: `fs.renameSync('.git',${JSON.stringify(relocated)});fs.writeFileSync('.git',${JSON.stringify(`gitdir: ${relocated}\n`)});fs.writeFileSync('allowed.txt','mutated\\n');`,
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "report_validation_failed");
  assert.ok(delegated.report.guard.observed_changed_surfaces.includes("<git:marker>"), JSON.stringify(delegated.report.guard));
  assert.ok(delegated.report.guard.role_violations.some((item) => /changed git control state/.test(item)), JSON.stringify(delegated.report.guard));
  assert.equal(fs.lstatSync(path.join(cwd, ".git")).isFile(), true);
});

test("Git control symlinks block before worker launch", (t) => {
  if (process.platform === "win32") return t.skip("symlink privileges vary on Windows");
  const cwd = tempDir("git-control-symlink");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  const external = path.join(tempDir("external-git-config"), "config");
  const config = path.join(cwd, ".git", "config");
  fs.copyFileSync(config, external);
  fs.rmSync(config);
  fs.symlinkSync(external, config);
  const contract = contractData({ unit: "U-git-control-symlink" });
  const delegated = runDelegate(delegateArgs(contract, workerCommand({
    before: "fs.writeFileSync('worker-launched','yes');",
  }), ["--cwd", cwd]), { cwd });
  assert.equal(delegated.result.status, 2, delegated.result.stderr);
  assert.equal(delegated.report.reason, "surface_guard_unavailable");
  assert.match(delegated.report.summary, /Git control tree contains an unsupported symlink/);
  assert.equal(fs.existsSync(path.join(cwd, "worker-launched")), false);
});

test("guard hashes a large ignored file without whole-file allocation semantics", () => {
  const cwd = tempDir("large-ignored");
  assert.equal(spawnSync("git", ["-C", cwd, "init", "-q"]).status, 0);
  fs.writeFileSync(path.join(cwd, ".gitignore"), "large.bin\n");
  const fd = fs.openSync(path.join(cwd, "large.bin"), "w");
  try {
    fs.ftruncateSync(fd, 16 * 1024 * 1024);
  } finally {
    fs.closeSync(fd);
  }
  const contract = contractData({ unit: "U-large-ignored" });
  const delegated = runDelegate(delegateArgs(contract, workerCommand(), ["--cwd", cwd]), { cwd, timeout: 30_000 });
  assert.equal(delegated.result.status, 0, delegated.result.stderr);
  assert.equal(delegated.report.status, "PASS");
});

test("timeouts, output overflow, and multiple result objects fail closed", async (t) => {
  const contract = contractData({ unit: "U-process" });

  await t.test("timeout", () => {
    const script = "setTimeout(()=>{},10000)";
    const delegated = runDelegate(delegateArgs(contract, JSON.stringify([process.execPath, "-e", script]), ["--timeout-ms", "100"]));
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.equal(delegated.report.reason, "adapter_timeout");
    assert.equal(delegated.report.adapter.timed_out, true);
  });

  await t.test("overflow still finalizes guard", () => {
    const cwd = tempDir("overflow");
    const mutable = contractData({ unit: "U-overflow", role: "implementer", writeScope: ["touched.txt"] });
    const script = "require('node:fs').writeFileSync('surprise.txt','before overflow');process.stdout.write('x'.repeat(11*1024*1024));";
    const delegated = runDelegate(delegateArgs(mutable, JSON.stringify([process.execPath, "-e", script]), ["--cwd", cwd]), { cwd, timeout: 20_000 });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.equal(delegated.report.reason, "adapter_output_overflow");
    assert.ok(delegated.report.guard.observed_changed_surfaces.includes("surprise.txt"));
    assert.ok(delegated.report.guard.allowed_surface_violations.includes("surprise.txt"));
  });

  await t.test("valid result followed by overflow cannot pass", () => {
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      after: "process.stdout.write('x'.repeat(11*1024*1024));",
    })), { timeout: 20_000 });
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.equal(delegated.report.reason, "adapter_output_overflow");
  });

  await t.test("valid result followed by graceful timeout cannot pass", () => {
    const delegated = runDelegate(delegateArgs(contract, workerCommand({
      after: "process.on('SIGTERM',()=>process.exit(0));setInterval(()=>{},1000);",
    }), ["--timeout-ms", "100"]));
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.equal(delegated.report.reason, "adapter_timeout");
    assert.equal(delegated.report.adapter.timed_out, true);
  });

  await t.test("multiple outputs", () => {
    const first = compactResult({ summary: "first" });
    const second = compactResult({ summary: "second" });
    const delegated = runDelegate(delegateArgs(contract, workerCommand({ result: first, duplicate: second })));
    assert.equal(delegated.result.status, 2, delegated.result.stderr);
    assert.equal(delegated.report.reason, "multiple_worker_reports");
  });
});

test("worker result extraction trusts only recognized terminal carriers", () => {
  const contract = contractData({ unit: "U-terminal-carrier" });
  const raw = compactResult();

  const commandLogEnvelope = {
    type: "item.completed",
    item: {
      type: "command_execution",
      aggregated_output: JSON.stringify(raw),
      status: "completed",
    },
  };
  const spoof = runDelegate(delegateArgs(contract, workerCommand({ result: commandLogEnvelope })));
  assert.equal(spoof.result.status, 2, spoof.result.stderr);
  assert.equal(spoof.report.reason, "invalid_worker_report");

  const agentMessageEnvelope = {
    type: "item.completed",
    item: {
      type: "agent_message",
      text: JSON.stringify(raw),
    },
  };
  const terminal = runDelegate(delegateArgs(contract, workerCommand({ result: agentMessageEnvelope })));
  assert.equal(terminal.result.status, 0, terminal.result.stderr);
  assert.equal(terminal.report.status, "PASS");

  const directProse = runDelegate(delegateArgs(contract, workerCommand({
    before: "process.stdout.write('prefix prose\\n');",
    after: "process.stdout.write('suffix prose\\n');",
  })));
  assert.equal(directProse.result.status, 2, directProse.result.stderr);
  assert.equal(directProse.report.reason, "invalid_worker_report");

  const proseAgentMessage = {
    type: "item.completed",
    item: {
      type: "agent_message",
      text: `prefix prose\n${JSON.stringify(raw)}\nsuffix prose`,
    },
  };
  const wrappedProse = runDelegate(delegateArgs(contract, workerCommand({ result: proseAgentMessage })));
  assert.equal(wrappedProse.result.status, 2, wrappedProse.result.stderr);
  assert.equal(wrappedProse.report.reason, "invalid_worker_report");
});

test("delegate-doctor exposes compact schemas and probes a safe custom adapter", () => {
  const codex = parseOutput(runRaw(["delegate-doctor", "--agent", "codex"]));
  const claude = parseOutput(runRaw(["delegate-doctor", "--agent", "claude-code"]));
  assert.equal(codex.schema_mode, "file");
  assert.match(codex.command.join(" "), /--output-schema.*WorkerResultV1 schema/);
  assert.equal(claude.schema_mode, "json");
  assert.match(claude.command.join(" "), /--json-schema.*WorkerResultV1 schema/);
  assert.doesNotMatch(claude.command.join(" "), /\"properties\"/);

  const probe = runRaw([
    "delegate-doctor", "--agent", "codex",
    ...overrideArgs(workerCommand()),
    "--probe", "--require-pass",
  ]);
  assert.equal(probe.status, 0, probe.stderr);
  const report = parseOutput(probe);
  assert.equal(report.status, "PASS");
  assert.equal(report.probe.status, "PASS");
  assert.equal(report.probe.adapter.source, "override");

  const missing = runRaw([
    "delegate-doctor", "--agent", "codex",
    ...overrideArgs(JSON.stringify(["workflow-supervisor-definitely-missing-binary"])),
    "--require-pass",
  ]);
  assert.equal(missing.status, 1, missing.stderr);
  const missingReport = parseOutput(missing);
  assert.equal(missingReport.status, "BLOCKED");
  assert.equal(missingReport.executable_available, false);

  if (process.platform !== "win32") {
    const cwd = tempDir("doctor-relative-command");
    const worker = path.join(cwd, "worker");
    const script = [
      `#!${process.execPath}`,
      "process.stdin.resume();",
      `process.stdin.on('end',()=>process.stdout.write(${JSON.stringify(`${JSON.stringify(compactResult())}\n`)}));`,
      "",
    ].join("\n");
    fs.writeFileSync(worker, script, { mode: 0o755 });
    const relative = runRaw([
      "delegate-doctor", "--agent", "codex", "--cwd", cwd,
      ...overrideArgs(JSON.stringify(["./worker"])),
      "--probe", "--require-pass",
    ], { cwd: repoRoot });
    assert.equal(relative.status, 0, relative.stderr);
    const relativeReport = parseOutput(relative);
    assert.equal(relativeReport.executable_available, true);
    assert.equal(relativeReport.probe.status, "PASS");
  }
});

test("delegate-doctor validates and exact-redacts forwarded credential values", (t) => {
  if (process.platform === "win32") return t.skip("portable executable shim coverage runs on POSIX");
  const shimDir = tempDir("doctor-credential-shim");
  const shim = path.join(shimDir, "codex");
  const name = "WORKFLOW_TEST_SECRET_TOKEN";
  const value = "short-doctor-opaque";
  fs.writeFileSync(shim, `#!${process.execPath}\nprocess.stdout.write(process.env.${name});\n`, { mode: 0o755 });
  const env = { ...process.env, PATH: `${shimDir}${path.delimiter}${process.env.PATH || ""}`, [name]: value };
  const result = runRaw(["delegate-doctor", "--agent", "codex", "--credential-env", name], { env });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.includes(value), false);
  assert.match(result.stdout, /<redacted>/);

  const missing = runRaw(["delegate-doctor", "--agent", "codex", "--credential-env", "WORKFLOW_MISSING_DOCTOR_TOKEN"], { env });
  assert.notEqual(missing.status, 0);
  assert.match(missing.stderr, /is not present in the parent environment/);
});

test("legacy WorkerReportV1 remains readable with an explicit deprecation warning", () => {
  // The frozen v0.3 fixture predates the compact prompt and falls back to U0.
  const contract = contractData({ unit: "U0" });
  const delegated = runDelegate(delegateArgs(contract, JSON.stringify([process.execPath, legacyWorker, "pass"])));
  assert.equal(delegated.result.status, 0, delegated.result.stderr);
  assert.equal(delegated.report.status, "PASS");
  assert.ok(delegated.report.guard.warnings.some((warning) => /Legacy WorkerReportV1.*deprecated/.test(warning)));
});

test("successful and blocked supervisor envelopes conform to the packaged schema", () => {
  const contract = contractData({ unit: "U-schema" });
  const success = runDelegate(delegateArgs(contract, workerCommand())).report;
  const blocked = runDelegate(delegateArgs(contract, workerCommand({
    result: compactResult({ outcomes: [{ id: "A1", verdict: "PASS", evidence: [] }] }),
  }))).report;
  assert.deepEqual(schemaErrors(success, reportSchema), []);
  assert.deepEqual(schemaErrors(blocked, reportSchema), []);

  const validation = runRaw(["validate"], { cwd: repoRoot, timeout: 30_000 });
  assert.equal(validation.status, 0, validation.stderr);
  assert.match(validation.stdout, /Validated 1 skills: workflow-supervisor/);
});

test("delegate validates contract, identifiers, timeout, cwd, and duplicate options before execution", async (t) => {
  const cwd = tempDir("cli-inputs");
  const file = path.join(cwd, "not-a-directory");
  fs.writeFileSync(file, "x");
  const contract = contractData({ unit: "U-input" });
  const command = workerCommand({ before: "fs.writeFileSync('must-not-exist.txt','ran');" });
  const cases = [
    [["delegate", "--agent", "codex", "--role", "verifier", "--unit", "bad unit"], /safe identifier/],
    [["delegate", "--agent", "codex", "--role", "verifier", "--unit", "U1", "--timeout-ms", "12oops"], /positive integer/],
    [["delegate", "--agent", "codex", "--role", "verifier", "--unit", "U1", "--cwd", file], /must be a directory/],
    [["delegate", "--agent", "codex", "--role", "verifier", "--role", "verifier", "--unit", "U1"], /Duplicate option: --role/],
  ];
  for (const [args, expected] of cases) {
    await t.test(expected.source, () => {
      const result = runRaw(args, { cwd });
      assert.equal(result.status, 1);
      assert.match(result.stderr, expected);
    });
  }

  const badContract = { ...contract, unexpected: true };
  const invalid = runDelegate(delegateArgs(badContract, command, ["--cwd", cwd]), { cwd });
  assert.equal(invalid.result.status, 2, invalid.result.stderr);
  assert.equal(invalid.report.reason, "invalid_contract");
  assert.equal(fs.existsSync(path.join(cwd, "must-not-exist.txt")), false);

  const contractFile = writeContract(cwd, contract, "trusted-contract.json");
  const conflicting = runDelegate([
    "--agent", "codex",
    "--role", contract.role,
    "--unit", contract.unit,
    "--contract", contractFile,
    "--contract-text", JSON.stringify({ ...contract, objective: "Conflicting inline source." }),
    ...overrideArgs(command),
    "--cwd", cwd,
  ], { cwd });
  assert.equal(conflicting.result.status, 2, conflicting.result.stderr);
  assert.equal(conflicting.report.reason, "invalid_contract");
  assert.match(conflicting.report.summary, /exactly one delegation input source/);
  assert.equal(fs.existsSync(path.join(cwd, "must-not-exist.txt")), false);
});
