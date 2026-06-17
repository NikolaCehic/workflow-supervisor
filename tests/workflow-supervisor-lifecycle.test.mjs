import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillText = fs.readFileSync(path.join(repoRoot, "skills/workflow-supervisor/SKILL.md"), "utf8");
const workUnitText = fs.readFileSync(path.join(repoRoot, "skills/work-unit/SKILL.md"), "utf8");
const acceptanceText = fs.readFileSync(path.join(repoRoot, "skills/acceptance-matrix/SKILL.md"), "utf8");
const readmeText = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
const agentPrompt = fs.readFileSync(
  path.join(repoRoot, "skills/workflow-supervisor/agents/openai.yaml"),
  "utf8",
);

const intakeFields = [
  { id: "objective_and_source", label: "Objective and source" },
  { id: "execution_path", label: "Execution path" },
  { id: "mode", label: "Mode" },
  { id: "delegation", label: "Delegation" },
  { id: "final_disposition", label: "Final disposition" },
  { id: "mutation_boundaries", label: "Boundaries" },
  { id: "state_artifacts", label: "State artifacts" },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isUnanswered(value) {
  const normalized = value.trim().replace(/[.!?]+$/, "");
  return !normalized || /^(use your judgment|you decide|whatever|default|n\/a)$/i.test(normalized);
}

function evaluateIntakeCompletion(prompt) {
  const lines = prompt.split(/\r?\n/).map((line) => line.trim());
  const answers = {};

  for (const field of intakeFields) {
    const pattern = new RegExp(`^(?:\\d+\\.\\s*)?${escapeRegExp(field.label)}\\s*:\\s*(.+)$`, "i");
    const line = lines.find((candidate) => pattern.test(candidate));
    const answer = line?.match(pattern)?.[1] || "";
    if (!isUnanswered(answer)) answers[field.id] = answer;
  }

  const missingDecisions = intakeFields.map((field) => field.id).filter((id) => !answers[id]);
  if (missingDecisions.length > 0) {
    return {
      status: "requires_intake",
      nextAction: "ask_unanswered_intake_items_then_stop",
      missingDecisions,
    };
  }

  return {
    status: "intake_complete",
    nextAction: "record_plan_from_completed_intake",
    path: answers.execution_path,
    missingDecisions: [],
  };
}

test("workflow-supervisor contract requires complete intake before work starts", () => {
  assert.match(skillText, /Run the complete intake gate before goal creation, worker delegation, implementation/);
  assert.match(skillText, /1\. Run the complete intake gate/);
  assert.match(skillText, /Do not use keywords to skip intake/);
  assert.match(skillText, /Continue prompting until every required intake decision has an explicit user answer/);
  assert.match(skillText, /Classify the workflow as `autonomous_goal` or `human_in_loop` only from completed intake answers/);
});

test("workflow-supervisor explicit invocation requires strict worker-agent workflow", () => {
  assert.match(skillText, /strict_full_workflow/);
  assert.match(skillText, /Task size is irrelevant/);
  assert.match(skillText, /source-requirement coverage ledger before work-unit finalization/);
  assert.match(skillText, /At least one bounded work unit, even for a tiny change/);
  assert.match(skillText, /worker-agent plan with implementer, verifier, repair-author, and documenter agents/);
  assert.match(skillText, /planned -> handed_off -> acknowledged -> reported -> verified -> closed/);
  assert.match(skillText, /Do not silently collapse worker agents into same-session work/);
  assert.match(skillText, /Every worker report back to the supervisor must use this schema/);
  assert.match(skillText, /role: implementer \| verifier \| repair-author \| documenter/);
});

test("workflow-supervisor documents the complete intake question", () => {
  assert.match(skillText, /Before I start the supervisor loop, answer every intake item:/);
  assert.match(skillText, /1\. Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work\?/);
  assert.match(skillText, /2\. Execution path: autonomous_goal or human_in_loop\?/);
  assert.match(skillText, /3\. Mode: sequential, parallel where safe, or staged parallel\?/);
  assert.match(skillText, /4\. Delegation: automated worker delegation, native threads\/subagents if available, or same-session phased\?/);
  assert.match(skillText, /5\. Final disposition: keep local, open PR, push main, deploy\/publish, or ask at the end\?/);
  assert.match(skillText, /6\. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files\?/);
  assert.match(skillText, /7\. State artifacts: create `\.workflow\/` docs, use another artifact directory, or keep state inline\?/);
});

test("workflow-supervisor intake does not offer manual handoff prompts as a delegation mode", () => {
  assert.match(skillText, /automated_worker_delegation/);
  assert.match(skillText, /native_threads_or_subagents_if_available/);
  assert.match(skillText, /same_session_phased/);
  assert.doesNotMatch(skillText, /handoff_prompts_only/);
  assert.doesNotMatch(skillText, /same_thread_only/);
  assert.match(skillText, /Do not use manual copy\/paste handoff as the primary path/);
});

test("workflow-supervisor keeps .workflow state out of git by default", () => {
  assert.match(skillText, /ensure `<workspace>\/\.gitignore` contains `\.workflow\/` before creating those artifacts/);
  assert.match(skillText, /must not be staged, committed, pushed, or included in a PR unless the user explicitly names workflow state as a final deliverable/);
  assert.match(skillText, /ensure `\.gitignore` contains `\.workflow\/` before writing them/);
});

test("OpenAI metadata prompt preserves complete intake behavior", () => {
  assert.match(agentPrompt, /Use \$workflow-supervisor/);
  assert.match(agentPrompt, /complete intake gate/i);
  assert.match(agentPrompt, /Ask every required intake question/i);
  assert.match(agentPrompt, /Do not infer or skip steps from keywords/i);
  assert.match(agentPrompt, /source-requirement coverage ledger/i);
  assert.match(agentPrompt, /do not hide unimplemented material requirements in residual risks or future work/i);
});

test("workflow-supervisor requires source coverage before units and closeout", () => {
  assert.match(skillText, /## Source Requirement Coverage Gate/);
  assert.match(skillText, /source deliverables, roadmap phases, exit criteria, named integrations, scale targets/);
  assert.match(skillText, /in_current_scope/);
  assert.match(skillText, /explicit_user_deferred/);
  assert.match(skillText, /blocked_needs_decision/);
  assert.match(skillText, /Do not weaken requirements while translating them into units or acceptance rows/);
  assert.match(skillText, /Create exactly one implementation work unit only when all current-scope material requirements can be implemented and verified inside that one unit/);
  assert.match(skillText, /Audit skipped checks, residual risks, future work, and next recommended actions against the source-requirement coverage ledger/);
  assert.match(skillText, /workflow may be PASS only when every material requirement is mapped to a PASS acceptance row/);
});

test("workflow-supervisor forbids generic requirement downgrades that cause incomplete green runs", () => {
  for (const phrase of [
    "live service import and query verification",
    "required validation corpus size",
    "named providers A and B",
    "required batch analysis and report generation",
    "provider-backed extraction and indexing",
  ]) {
    assert.match(skillText, new RegExp(escapeRegExp(phrase)));
  }

  for (const phrase of [
    "live service load/query verification",
    "required validation corpus size",
    "named provider support",
    "required analysis and report generation",
    "provider-backed extraction or indexing",
  ]) {
    assert.match(acceptanceText, new RegExp(escapeRegExp(phrase)));
  }
});

test("work-unit guard prevents broad roadmap collapse into a single WU", () => {
  assert.match(workUnitText, /## One-Pass Collapse Guard/);
  assert.match(workUnitText, /Do not collapse a multi-phase roadmap, spec, or "source of truth" corpus into one broad implementation unit/);
  assert.match(workUnitText, /roadmap phases or milestones/);
  assert.match(workUnitText, /numeric targets such as corpus size, eval question count, latency budget, or coverage threshold/);
  assert.match(workUnitText, /Create exactly one `WU-001` only when the task is genuinely tiny/);
  assert.match(workUnitText, /source_requirements_covered/);
  assert.match(workUnitText, /deferred_or_out_of_scope_requirements/);
});

test("acceptance-matrix preserves source requirement strength and rejects residual-risk hiding", () => {
  assert.match(acceptanceText, /Acceptance rows must preserve the source requirement's strength/);
  assert.match(acceptanceText, /A weaker proxy check is not equivalent evidence unless the user explicitly waives or narrows/);
  assert.match(acceptanceText, /If residual risks, skipped checks, future work, or next recommended actions contain an unimplemented material source requirement, the matrix status is FAIL or BLOCKED, not PASS/);
  assert.match(acceptanceText, /Source Ref/);
  assert.match(acceptanceText, /source requirement weakened or omitted/);
  assert.match(acceptanceText, /roadmap exit criteria demoted to future work/);
  assert.match(acceptanceText, /material requirement hidden in residual risks/);
});

test("README documents the coverage ledger as the green-but-incomplete guardrail", () => {
  assert.match(readmeText, /source-requirement coverage ledger so roadmap items and exit criteria cannot disappear/);
  assert.match(readmeText, /guardrail against "green but incomplete" outcomes/);
  assert.match(readmeText, /Residual risks and future-work notes cannot contain unimplemented material source requirements in a PASS workflow/);
});

test("screenshot prompt cannot start work because complete intake is missing", () => {
  const result = evaluateIntakeCompletion(
    "Using Workflow Supervisor generate a postgres DB and a API for cats and their traits, create the project in python using FAST API",
  );

  assert.deepEqual(result, {
    status: "requires_intake",
    nextAction: "ask_unanswered_intake_items_then_stop",
    missingDecisions: [
      "objective_and_source",
      "execution_path",
      "mode",
      "delegation",
      "final_disposition",
      "mutation_boundaries",
      "state_artifacts",
    ],
  });
});

test("autonomy keywords do not skip the complete intake", () => {
  const result = evaluateIntakeCompletion(
    "Use $workflow-supervisor to work autonomously until done. Keep changes local and do not wait for approval.",
  );

  assert.deepEqual(result, {
    status: "requires_intake",
    nextAction: "ask_unanswered_intake_items_then_stop",
    missingDecisions: [
      "objective_and_source",
      "execution_path",
      "mode",
      "delegation",
      "final_disposition",
      "mutation_boundaries",
      "state_artifacts",
    ],
  });
});

test("partial intake repeats every missing item and still stops", () => {
  const result = evaluateIntakeCompletion(
    [
      "Objective and source: migrate docs in ./docs using docs/new-api.md as source.",
      "Execution path: human_in_loop.",
      "Mode: use your judgment.",
    ].join("\n"),
  );

  assert.deepEqual(result, {
    status: "requires_intake",
    nextAction: "ask_unanswered_intake_items_then_stop",
    missingDecisions: ["mode", "delegation", "final_disposition", "mutation_boundaries", "state_artifacts"],
  });
});

test("work can proceed only after every intake field has an explicit answer", () => {
  const result = evaluateIntakeCompletion(
    [
      "Objective and source: create the cats API in ./outputs/cat-traits-api from this conversation.",
      "Execution path: autonomous_goal.",
      "Mode: sequential.",
      "Delegation: automated worker delegation.",
      "Final disposition: keep local.",
      "Boundaries: local file edits only; no credentials, no external services, no destructive operations.",
      "State artifacts: create `.workflow/` docs.",
    ].join("\n"),
  );

  assert.deepEqual(result, {
    status: "intake_complete",
    nextAction: "record_plan_from_completed_intake",
    path: "autonomous_goal.",
    missingDecisions: [],
  });
});
