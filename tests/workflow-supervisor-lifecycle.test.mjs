import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillText = fs.readFileSync(path.join(repoRoot, "skills/workflow-supervisor/SKILL.md"), "utf8");
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

test("OpenAI metadata prompt preserves complete intake behavior", () => {
  assert.match(agentPrompt, /Use \$workflow-supervisor/);
  assert.match(agentPrompt, /complete intake gate/i);
  assert.match(agentPrompt, /Ask every required intake question/i);
  assert.match(agentPrompt, /Do not infer or skip steps from keywords/i);
  assert.match(agentPrompt, /Start planning or work only after complete intake/i);
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
