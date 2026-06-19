import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skillText = fs.readFileSync(path.join(repoRoot, "skills/workflow-supervisor/SKILL.md"), "utf8");
const loopPolicyText = fs.readFileSync(path.join(repoRoot, "skills/loop-policy/SKILL.md"), "utf8");
const workUnitText = fs.readFileSync(path.join(repoRoot, "skills/work-unit/SKILL.md"), "utf8");
const acceptanceText = fs.readFileSync(path.join(repoRoot, "skills/acceptance-matrix/SKILL.md"), "utf8");
const workflowDocsText = fs.readFileSync(path.join(repoRoot, "skills/workflow-docs/SKILL.md"), "utf8");
const workflowControlText = fs.readFileSync(path.join(repoRoot, "skills/workflow-docs/references/workflow-control.md"), "utf8");
const goalResumeText = fs.readFileSync(path.join(repoRoot, "skills/workflow-docs/references/goal-resume.md"), "utf8");
const readmeText = fs.readFileSync(path.join(repoRoot, "README.md"), "utf8");
const troubleshootingText = fs.readFileSync(path.join(repoRoot, "docs/troubleshooting.md"), "utf8");
const agentPrompt = fs.readFileSync(
  path.join(repoRoot, "skills/workflow-supervisor/agents/openai.yaml"),
  "utf8",
);

const intakeFields = [
  { id: "objective_and_source", label: "Objective and source" },
  { id: "profile", label: "Profile" },
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

test("workflow-supervisor explicit invocation selects a proportional execution profile", () => {
  assert.match(skillText, /first classify the workflow profile/);
  assert.match(skillText, /lean_work_unit_runner/);
  assert.match(skillText, /strict_full_workflow/);
  assert.match(skillText, /planning_only/);
  assert.match(skillText, /Do not run strict ceremony just because the skill was named/);
  assert.match(skillText, /Lean mode optimizes for large-unit throughput while preserving non-ambiguity/);
  assert.match(skillText, /Do not start a lean unit unless its boundary and done signal are clear/);
  assert.match(skillText, /one compact ledger/);
  assert.match(skillText, /Escalate a lean unit to `strict_full_workflow`/);
});

test("workflow-supervisor strict profile retains worker-agent governance", () => {
  assert.match(skillText, /Strict mode always requires:/);
  assert.match(skillText, /source-requirement coverage ledger before work-unit finalization/);
  assert.match(skillText, /SPEC review packet or `\.workflow\/SPEC\.md` before work-unit finalization/);
  assert.match(skillText, /At least one bounded work unit, even for a tiny change/);
  assert.match(skillText, /worker-agent plan with implementer, verifier, repair-author, and documenter agents/);
  assert.match(skillText, /planned -> handed_off -> acknowledged -> reported -> verified -> resource_closed -> closed/);
  assert.match(skillText, /Do not silently collapse worker agents into same-session work/);
  assert.match(skillText, /Every worker report back to the supervisor must use this schema/);
  assert.match(skillText, /role: implementer \| verifier \| repair-author \| documenter/);
});

test("workflow-supervisor requires native worker resources to be closed", () => {
  assert.match(skillText, /## Native Worker Resource Lifecycle/);
  assert.match(skillText, /A worker is not `closed` until its native resource has also been released/);
  assert.match(skillText, /Record the native resource id immediately after creation/);
  assert.match(skillText, /For Codex subagents, call `close_agent` with the recorded `agent_id`/);
  assert.match(skillText, /open_native_worker/);
  assert.match(skillText, /worker_resource_close_unavailable/);
  assert.match(skillText, /worker_resource_close_failed/);
  assert.match(skillText, /Do not use native thread or native subagent workers unless the environment exposes a close operation/);
  assert.match(loopPolicyText, /native_worker_lifecycle:/);
  assert.match(loopPolicyText, /codex_close_action: close_agent/);
  assert.match(loopPolicyText, /blocked if any native worker lacks close_result/);
  assert.match(workflowControlText, /Native Resource ID/);
  assert.match(workflowControlText, /Close Action/);
  assert.match(workflowControlText, /Close Result/);
  assert.match(workflowControlText, /record the `spawn_agent` id as Native Resource ID and `close_agent` as Close Action/);
  assert.match(readmeText, /A native worker is not closed just because it returned a report/);
  assert.match(readmeText, /Final outcome is blocked while any native worker lacks a close result/);
});

test("workflow-supervisor baseline hardening contract is preserved", () => {
  assert.match(skillText, /lean_work_unit_runner/);
  assert.match(skillText, /strict_full_workflow/);
  assert.match(skillText, /planning_only/);
  assert.match(skillText, /one compact ledger/);
  assert.match(skillText, /source-requirement coverage ledger before work-unit finalization/);
  assert.match(skillText, /Acceptance matrix or acceptance draft with evidence expectations/i);
  assert.match(skillText, /Native Worker Resource Lifecycle/);
  assert.match(skillText, /ensure `<workspace>\/\.gitignore` contains `\.workflow\/`/);
  assert.match(readmeText, /overhead is profile-dependent/);
  assert.match(readmeText, /coverage ledger is the guardrail against "green but incomplete" outcomes/);
  assert.match(workflowControlText, /## LEDGER\.md/);
  assert.match(workflowControlText, /## WORKER-MAP\.md/);
  assert.match(workflowControlText, /Close Result/);
  assert.match(troubleshootingText, /Unsupported external gauntlet summaries are not validation evidence/);
  assert.match(troubleshootingText, /per-scenario reports, commands, artifacts, and expected outcomes/);
  assert.match(troubleshootingText, /Use repo-native tests, fixtures, `npm run validate`, and live adapter probes/);
});

test("workflow-supervisor documents the complete intake question", () => {
  assert.match(skillText, /Before I start the supervisor loop, answer every intake item:/);
  assert.match(skillText, /1\. Objective and source: what artifact, spec, repo path, document, ticket, or source set controls the work\?/);
  assert.match(skillText, /2\. Profile: lean_work_unit_runner, strict_full_workflow, or planning_only\?/);
  assert.match(skillText, /3\. Execution path: autonomous_goal or human_in_loop\?/);
  assert.match(skillText, /4\. Mode: sequential, parallel where safe, or staged parallel\?/);
  assert.match(skillText, /5\. Delegation: same-session phased, automated worker delegation, or native threads\/subagents if available\?/);
  assert.match(skillText, /6\. Final disposition: keep local, open PR, push main, deploy\/publish, or ask at the end\?/);
  assert.match(skillText, /7\. Boundaries: may I install dependencies, call external services, use credentials, or only edit local files\?/);
  assert.match(skillText, /8\. State artifacts: compact ledger, `\.workflow\/` docs, another artifact directory, or inline state\?/);
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
  assert.match(agentPrompt, /select the execution profile first/i);
  assert.match(agentPrompt, /lean_work_unit_runner/i);
  assert.match(agentPrompt, /avoid subagents unless explicitly authorized/i);
  assert.match(agentPrompt, /record each native resource id/i);
  assert.match(agentPrompt, /close_agent/i);
  assert.match(agentPrompt, /block final outcome if any native worker lacks a close result/i);
  assert.match(agentPrompt, /Ask required intake questions/i);
  assert.match(agentPrompt, /Do not infer path, mode, delegation, final disposition, or boundaries/i);
  assert.match(agentPrompt, /source-requirement coverage ledger and SPEC review gate/i);
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

test("workflow-supervisor requires SPEC Q&A approval before human-in-loop work units", () => {
  assert.match(skillText, /## SPEC Review And Q&A Gate/);
  assert.match(skillText, /The SPEC must include:/);
  assert.match(skillText, /Q&A log/);
  assert.match(skillText, /human verification decision with reviewer, decision, notes, and date/);
  assert.match(skillText, /In `human_in_loop`, stop after presenting the draft SPEC and ask for review/);
  assert.match(skillText, /Continue to final work units, dossiers, or implementation only after the SPEC has `Decision: Approved`/);
  assert.match(skillText, /If the human asks questions, answer them and update the Q&A log before proceeding/);
  assert.match(skillText, /Do not fabricate human approval/);
  assert.match(skillText, /human-in-loop SPEC approval is missing, marked Needs Revision, marked Blocked, or has unanswered Q&A/);
});

test("workflow-supervisor resumes after human decisions without restarting autonomous goals", () => {
  assert.match(skillText, /## Resume After Human Decision/);
  assert.match(skillText, /Ask the smallest decision that can unblock progress/);
  assert.match(skillText, /Do not re-ask complete intake unless a required intake decision is missing, contradicted, or directly changed by the blocker/);
  assert.match(skillText, /Do not mark the Codex goal terminal `blocked` for a first material blocker/);
  assert.match(skillText, /Re-run only the affected downstream steps/);
  assert.match(skillText, /Invalidate stale work units, acceptance rows, dossiers, or worker reports whose assumptions changed/);
  assert.match(skillText, /Continue from the recorded `Next Action`/);
  assert.match(skillText, /If the prior Codex goal is terminal `blocked old`, do not assume it can be reopened/);
  assert.match(skillText, /After the human answers, resume from the recorded next action and refresh only the affected downstream artifacts/);
});

test("loop-policy defines human-decision resume behavior", () => {
  assert.match(loopPolicyText, /human_decision_resume_rule/);
  assert.match(loopPolicyText, /ask the smallest blocking decision/);
  assert.match(loopPolicyText, /resume without restarting intake unless intake changed/);
  assert.match(loopPolicyText, /record blocker and next action before asking/);
  assert.match(loopPolicyText, /continue from recorded next action/);
});

test("workflow-docs defines SPEC.md as the human review artifact", () => {
  assert.match(workflowDocsText, /\.workflow\/SPEC\.md/);
  assert.match(workflowDocsText, /human-reviewable interpretation contract, requirement coverage, Q&A, and approval decision/);
  assert.match(workflowControlText, /## SPEC\.md/);
  assert.match(workflowControlText, /Status: Draft \| Approved \| Needs Revision \| Blocked/);
  assert.match(workflowControlText, /Proposed Disposition/);
  assert.match(workflowControlText, /Final Disposition/);
  assert.match(workflowControlText, /## Q&A Log/);
  assert.match(workflowControlText, /## Human Verification/);
});

test("workflow-docs defines a compact lean runner ledger", () => {
  assert.match(workflowDocsText, /\.workflow\/LEDGER\.md/);
  assert.match(workflowDocsText, /compact lean-runner state/);
  assert.match(workflowControlText, /## LEDGER\.md/);
  assert.match(workflowControlText, /Profile: lean_work_unit_runner/);
  assert.match(workflowControlText, /Source Ref \| Scope \| Done Signal \| Check \| Status/);
  assert.match(readmeText, /Lean mode keeps work units but removes per-unit ceremony/);
  assert.match(readmeText, /same-session phased execution is the default/);
});

test("workflow-docs defines resume checkpoints for human decisions and blocked goals", () => {
  assert.match(workflowDocsText, /terminal blocked-goal history, and human-decision resume checkpoints/);
  assert.match(workflowControlText, /## Blocking Decision/);
  assert.match(workflowControlText, /## Resume Checkpoint/);
  assert.match(workflowControlText, /Stale Artifacts Invalidated/);
  assert.match(workflowControlText, /## GOAL-STATE\.md/);
  assert.match(workflowControlText, /blocked old/);
  assert.match(goalResumeText, /## Human Decision Resume Rule/);
  assert.match(goalResumeText, /Do not restart complete intake unless the answer changes a required intake decision/);
  assert.match(goalResumeText, /terminal blocked and cannot be reopened/);
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
  assert.match(readmeText, /`SPEC\.md` review gate where humans can ask questions, request revisions, block, defer, or approve before work units are finalized/);
  assert.match(readmeText, /guardrail against "green but incomplete" outcomes/);
  assert.match(readmeText, /The workflow continues only after explicit approval/);
  assert.match(readmeText, /In `autonomous_goal`, a human clarification pause is not automatically a terminal failed goal/);
  assert.match(readmeText, /continues from the saved `Next Action`/);
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
      "profile",
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
      "profile",
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
      "Profile: strict_full_workflow.",
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
      "Profile: strict_full_workflow.",
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
