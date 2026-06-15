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
