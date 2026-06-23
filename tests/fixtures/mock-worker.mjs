import fs from "node:fs";
import path from "node:path";

let prompt = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) prompt += chunk;

const mode = process.argv[2] || "pass";
const writePath = process.argv[3] || "touched.txt";
const role = prompt.match(/^Role: (.+)$/m)?.[1] || "verifier";
const unitId = prompt.match(/^Work unit: (.+)$/m)?.[1] || "U0";

function report(overrides = {}) {
  return {
    schema: "WorkerReportV1",
    status: "PASS",
    role,
    unit_id: unitId,
    summary: "Mock worker completed.",
    changed_surfaces: [],
    evidence: [{ kind: "mock", detail: "fixture evidence" }],
    checks_run: [{ command: "mock-check", status: "PASS" }],
    skipped_checks: [],
    findings: [],
    blocking_question: null,
    next_action: "supervisor_review",
    verification_environment: null,
    outcome_evaluations: [],
    ...overrides,
  };
}

function outcomeRow(overrides = {}) {
  return {
    id: "A-outcome-1",
    source_requirement: "User can create a workflow and see it in the task board.",
    expected_outcome: "Created workflow is persisted and rendered as a board item.",
    preferred_verification: ["browser_snapshot", "jsdom_render", "api_probe", "static_diff_inspection"],
    available_verification: ["jsdom_render", "api_probe", "static_diff_inspection"],
    evidence_strength: {
      strongest_possible: ["browser_snapshot"],
      strongest_available: ["jsdom_render", "api_probe", "static_diff_inspection"],
      limitation: "Browser snapshot capability is unavailable in this fixture.",
    },
    evidence: [{ kind: "fixture", detail: "row-mapped outcome evidence" }],
    invalid_pass_conditions: ["tests only", "typecheck only", "hardcoded fixture"],
    verdict: "PASS",
    finding: "",
    ...overrides,
  };
}

if (mode === "invalid") {
  console.log("I did the work, trust me.");
} else if (mode === "auth") {
  console.error("not authenticated: please login");
  process.exit(2);
} else if (mode === "pass-no-evidence") {
  console.log(JSON.stringify(report({ evidence: [] })));
} else if (mode === "conditional-status") {
  console.log(JSON.stringify(report({ status: "CONDITIONAL_PASS" })));
} else if (mode === "pass-conditional-outcome") {
  console.log(JSON.stringify(report({
    outcome_evaluations: [
      outcomeRow({
        verdict: "CONDITIONAL_PASS",
        limitation: "Responsive visual layout was not verified because browser capability is unavailable.",
      }),
    ],
  })));
} else if (mode === "blocked-conditional-outcome") {
  console.log(JSON.stringify(report({
    status: "BLOCKED",
    summary: "Outcome is strongly inferred but not fully observable.",
    outcome_evaluations: [
      outcomeRow({
        verdict: "CONDITIONAL_PASS",
        limitation: "Responsive visual layout was not verified because browser capability is unavailable.",
      }),
    ],
  })));
} else if (mode === "pass-outcome-no-row-evidence") {
  console.log(JSON.stringify(report({ outcome_evaluations: [outcomeRow({ evidence: [] })] })));
} else if (mode === "pass-outcome-unknown-capability") {
  console.log(JSON.stringify(report({
    outcome_evaluations: [
      outcomeRow({ available_verification: ["telepathy_probe"] }),
    ],
  })));
} else if (mode === "question-pass") {
  console.log(JSON.stringify(report({ blocking_question: "Can the human approve this?", next_action: "ask_user" })));
} else if (mode === "edit") {
  fs.writeFileSync(path.resolve(process.cwd(), writePath), "changed by mock worker\n");
  console.log(JSON.stringify(report()));
} else {
  console.log("worker log before JSON");
  console.log(JSON.stringify(report()));
  console.log("worker log after JSON");
}
