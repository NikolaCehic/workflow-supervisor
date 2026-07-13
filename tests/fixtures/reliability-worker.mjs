import fs from "node:fs";
import path from "node:path";

let prompt = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) prompt += chunk;

const mode = process.argv[2] || "pass";
const target = process.argv[3] || "touched.txt";
const role = prompt.match(/^Role: (.+)$/m)?.[1] || "verifier";
const unitId = prompt.match(/^Work unit: (.+)$/m)?.[1] || "U0";

function report(overrides = {}) {
  return {
    schema: "WorkerReportV1",
    status: "PASS",
    role,
    unit_id: unitId,
    summary: "Reliability fixture completed.",
    changed_surfaces: [],
    evidence: [{ kind: "fixture", detail: "deterministic reliability evidence" }],
    checks_run: [{ kind: "command", detail: "reliability-fixture: PASS" }],
    skipped_checks: [],
    findings: [],
    blocking_question: null,
    next_action: "supervisor_review",
    verification_environment: null,
    outcome_evaluations: [outcomeRow()],
    adapter: null,
    guard: null,
    reason: null,
    stdout_excerpt: null,
    stderr_excerpt: null,
    ...overrides,
  };
}

function outcomeRow(overrides = {}) {
  return {
    id: "A1",
    source_requirement: "The assigned reliability behavior is observed.",
    expected_outcome: "The deterministic local fixture produces the expected result.",
    preferred_verification: ["integration_test"],
    available_verification: ["integration_test"],
    evidence_strength: {
      strongest_possible: ["integration_test"],
      strongest_available: ["integration_test"],
      limitation: null,
    },
    evidence: [{ kind: "fixture", detail: "row-mapped reliability evidence" }],
    invalid_pass_conditions: ["missing fixture observation"],
    verdict: "PASS",
    limitation: null,
    capability_limitations: [],
    required_external_check: [],
    finding: "",
    ...overrides,
  };
}

function writeTarget() {
  fs.writeFileSync(path.resolve(process.cwd(), target), "changed by reliability worker\n");
}

if (mode === "edit") {
  writeTarget();
  console.log(JSON.stringify(report()));
} else if (mode === "mkdir-empty") {
  fs.mkdirSync(path.resolve(process.cwd(), target));
  console.log(JSON.stringify(report()));
} else if (mode === "mark-launched") {
  writeTarget();
  console.log(JSON.stringify(report()));
} else if (mode === "invalid-types") {
  console.log(JSON.stringify(report({
    summary: 7,
    evidence: [null],
    checks_run: [false],
    next_action: 42,
  })));
} else if (mode === "extra-property") {
  console.log(JSON.stringify(report({ unexpected_property: "not allowed by WorkerReportV1" })));
} else if (mode === "structured-output") {
  console.log(JSON.stringify({ type: "result", subtype: "success", structured_output: report() }));
} else if (mode === "secret-pass") {
  console.log(JSON.stringify(report({
    evidence: [{ kind: "fixture", detail: "OPENAI_API_KEY=valid-report-secret-value" }],
  })));
} else if (mode === "blank-evidence") {
  console.log(JSON.stringify(report({
    evidence: ["   "],
    outcome_evaluations: [outcomeRow({ evidence: [{ kind: "fixture", detail: "   " }] })],
  })));
} else if (mode === "secret-invalid") {
  process.stdout.write("OPENAI_API_KEY=review-secret-value\n");
  process.stderr.write("Authorization: Bearer stderr-secret-value\n");
  console.log(JSON.stringify(report({ evidence: [] })));
} else if (mode === "split-secret-invalid") {
  process.stdout.write("AUTH_TOKEN=");
  process.stderr.write("split-secret-value");
} else if (mode === "conflicting-reports") {
  console.log(JSON.stringify(report({ status: "PASS", summary: "First report says pass." })));
  console.log(JSON.stringify(report({
    status: "FAIL",
    summary: "Second report says fail.",
    evidence: [{ kind: "fixture", detail: "conflicting terminal result" }],
  })));
} else if (mode === "edit-then-overflow") {
  writeTarget();
  process.stdout.write("x".repeat(12 * 1024 * 1024));
} else if (mode === "symlink-escape") {
  const link = path.resolve(process.cwd(), "allowed", "escape");
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(path.resolve(target), link, "dir");
  fs.writeFileSync(path.join(link, "escaped.txt"), "escaped workspace boundary\n");
  console.log(JSON.stringify(report({ changed_surfaces: ["allowed/escape"] })));
} else {
  console.log(JSON.stringify(report()));
}
