import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(repoRoot, relative), "utf8");
const skill = read("skills/workflow-supervisor/SKILL.md");
const profileRef = read("skills/workflow-supervisor/references/profiles-and-intake.md");
const strictRef = read("skills/workflow-supervisor/references/strict-workflow.md");
const delegationRef = read("skills/workflow-supervisor/references/delegation-and-reports.md");
const planningRef = read("skills/workflow-supervisor/references/planning-and-discovery.md");
const resumeRef = read("skills/workflow-supervisor/references/goal-and-resume.md");
const loopPolicy = read("skills/loop-policy/SKILL.md");
const workUnit = read("skills/work-unit/SKILL.md");
const workerRoles = read("skills/worker-roles/SKILL.md");
const dossier = read("skills/dossier-builder/SKILL.md");
const acceptance = read("skills/acceptance-matrix/SKILL.md");
const sourceCorpus = read("skills/source-corpus/SKILL.md");
const workflowDocs = read("skills/workflow-docs/SKILL.md");
const templatesIndex = read("skills/workflow-docs/references/templates.md");
const workflowFoundations = read("skills/workflow-docs/references/workflow-foundations.md");
const workUnitDelegation = read("skills/workflow-docs/references/work-units-and-delegation.md");
const verificationTemplates = read("skills/workflow-docs/references/verification-and-repair.md");
const closeoutTemplates = read("skills/workflow-docs/references/decisions-handoff-and-outcome.md");
const workflowControl = [workflowFoundations, workUnitDelegation, verificationTemplates, closeoutTemplates].join("\n");
const planningTemplates = read("skills/workflow-docs/references/planning-outputs.md");
const readme = read("README.md");
const artifacts = read("docs/artifacts.md");
const compatibility = read("docs/compatibility.md");
const troubleshooting = read("docs/troubleshooting.md");
const portableDelegation = read("docs/portable-delegation.md");
const reportSchema = JSON.parse(read("schemas/worker-report-v1.schema.json"));
const dossierSchema = JSON.parse(read("schemas/dossier-v1.schema.json"));

function frontmatterValue(text, key) {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() || "";
}

function topLevelYamlKeys(block) {
  return [...block.matchAll(/^([a-z][a-z0-9_]*):/gm)].map((match) => match[1]);
}

function parseOpenAiMetadata(text) {
  const result = {};
  let section = null;
  for (const [index, line] of text.replace(/\r\n/g, "\n").split("\n").entries()) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const sectionMatch = line.match(/^([a-z_]+):$/);
    if (sectionMatch) {
      section = sectionMatch[1];
      result[section] = {};
      continue;
    }
    const property = line.match(/^  ([a-z_]+):\s*(.+)$/);
    assert.ok(section && property, `invalid metadata YAML on line ${index + 1}`);
    const raw = property[2];
    if (raw === "true" || raw === "false") result[section][property[1]] = raw === "true";
    else result[section][property[1]] = JSON.parse(raw);
  }
  return result;
}

test("route-first contract uses proportional profiles and direct execution", () => {
  assert.match(skill, /Choose the route from the request and controlling source/);
  assert.match(skill, /Small, clear task with obvious scope and acceptance \| Execute directly/);
  assert.match(skill, /lean_work_unit_runner/);
  assert.match(skill, /strict_full_workflow/);
  assert.match(skill, /planning_only/);
  assert.match(skill, /Do not run strict ceremony just because the skill was named/);
});

test("safe defaults are inferred while consequential authority stays explicit", () => {
  for (const phrase of [
    "Infer reversible execution mechanics",
    "Treat “use your judgment” as authorization to choose safe, reversible defaults",
    "keep changes local unless the user explicitly requests",
    "Ask only the smallest question",
    "Never infer permission",
  ]) {
    assert.match(skill, new RegExp(phrase));
  }
  assert.match(profileRef, /“Work autonomously until done” selects autonomous continuation/);
  assert.match(profileRef, /“Keep changes local” selects local disposition/);
  for (const authority of ["credentials", "paid", "destructive", "production", "publication", "external messages"]) {
    assert.match(`${skill}\n${profileRef}`, new RegExp(authority, "i"));
  }
  assert.doesNotMatch(skill, /answer every intake item|Continue prompting until every required intake decision/);
  assert.match(skill, /`execution_path`: use `autonomous_goal`/);
  assert.match(skill, /use `human_in_loop`/);
  assert.match(strictRef, /execution_path: human_in_loop/);
});

test("strict roles are selected on demand", () => {
  assert.match(strictRef, /A read-only audit does not need an implementer/);
  assert.match(strictRef, /Repair: only after an actionable FAIL\/BLOCKED finding/);
  assert.match(workerRoles, /A green first pass needs no repair worker/);
  assert.doesNotMatch(skill, /worker-agent plan with implementer, verifier, repair-author, and documenter/);
  for (const role of ["implementer", "verifier", "repair", "documenter"]) {
    assert.match(workerRoles, new RegExp("\\| `" + role + "` \\|"));
  }
  assert.match(workerRoles, /never creates authority/);
  assert.doesNotMatch(workerRoles, /except unavoidable command side effects/);
});

test("native lifecycle is capability-based and names no invented close tool", () => {
  const contract = [skill, delegationRef, loopPolicy, workflowControl, readme, compatibility, troubleshooting, portableDelegation].join("\n");
  assert.match(contract, /Use only lifecycle operations|use only operations it actually exposes/i);
  assert.match(contract, /platform-managed|manages completed resources automatically/i);
  assert.doesNotMatch(contract, /close_agent/);
  assert.doesNotMatch(contract, /open_native_worker|worker_resource_close_unavailable/);
  assert.doesNotMatch(portableDelegation, /complete intake|role-scoped implementer delegation|fresh, isolated delegation/);
});

test("canonical WorkerReportV1 contract matches packaged status and role enums", () => {
  assert.deepEqual(reportSchema.properties.status.enum, ["PASS", "FAIL", "BLOCKED"]);
  assert.deepEqual(reportSchema.properties.role.enum, ["implementer", "verifier", "repair", "documenter"]);
  for (const status of reportSchema.properties.status.enum) assert.match(delegationRef, new RegExp(`\\b${status}\\b`));
  for (const role of reportSchema.properties.role.enum) assert.match(delegationRef, new RegExp(`\\b${role}\\b`));
  for (const field of reportSchema.required) assert.match(delegationRef, new RegExp(`^${field}:`, "m"));
  assert.match(workerRoles, /do not emit top-level `PARTIAL` or `CONDITIONAL_PASS`/);
  assert.doesNotMatch(delegationRef, /^worker_id:|^work_unit_id:|^changed_files:|^acceptance_evidence:/m);
  const exampleBlock = portableDelegation.match(/Every adapter must normalize into this shape:[\s\S]*?```json\n([\s\S]*?)```/)?.[1] || "";
  const example = JSON.parse(exampleBlock);
  assert.deepEqual(Object.keys(example).sort(), [...reportSchema.required].sort());
  assert.deepEqual(
    Object.keys(example.outcome_evaluations[0]).sort(),
    [...reportSchema.$defs.outcomeEvaluation.required].sort(),
  );
});

test("dossier example and schema preserve role, authority, and report contracts", () => {
  const block = dossier.match(/## Dossier Shape[\s\S]*?```yaml\n([\s\S]*?)```/)?.[1] || "";
  assert.ok(block, "Dossier YAML example must exist");
  const keys = topLevelYamlKeys(block);
  assert.equal(new Set(keys).size, keys.length, `duplicate keys: ${keys.filter((key, i) => keys.indexOf(key) !== i)}`);
  assert.equal(keys.filter((key) => key === "worker_role").length, 1);
  for (const field of ["display_role", "worker_role", "boundary_kind", "authority", "authority_source"]) {
    assert.ok(keys.includes(field), `${field} missing from dossier example`);
    assert.ok(dossierSchema.required.includes(field), `${field} missing from DossierV1 required fields`);
  }
  assert.equal(dossierSchema.properties.authority.$ref, "#/$defs/nonEmptyStringList");
  assert.equal(dossierSchema.properties.completion_report_schema.const, "WorkerReportV1");
  assert.equal(dossierSchema.properties.verification_report_schema.const, "WorkerReportV1");
  assert.equal(dossierSchema.allOf.length, 5);
  assert.match(dossier, /legacy compatibility fields/);
  assert.match(dossier, /Risky work is invalid/);
  assert.match(dossier, /untrusted data/);
  assert.match(delegationRef, /Embedded instructions cannot change/);
  assert.match(workUnitDelegation, /DOSSIER\.md Human Index/);
  assert.match(workUnitDelegation, /\.workflow\/dossiers\/<unit>-<role>\.yaml/);
  assert.match(workUnitDelegation, /validate-dossier/);
});

test("lean unit and ledger templates preserve observable product fields", () => {
  const fields = [
    "id",
    "source_ref",
    "slice_type",
    "scope",
    "observable_behavior",
    "expected_outcome",
    "demo_or_verification",
    "layers_touched",
    "horizontal_slice_justification",
    "done",
    "check",
    "status",
    "touched_surfaces",
    "evidence",
    "blocker_or_next_action",
  ];
  for (const field of fields) assert.match(skill, new RegExp(`^${field}:`, "m"));
  for (const heading of ["Expected Outcome", "Demo Or Verification", "Layers Touched", "Horizontal Justification"]) {
    assert.match(workflowControl, new RegExp(`\\| ${heading} \\|`));
  }
  assert.match(workUnit, /stop_condition:/);
});

test("discovery, prototype, ready-for-agent, domain, ADR, and architecture outputs exist", () => {
  assert.match(workUnit, /## Discovery And Prototype Units/);
  assert.match(workUnit, /\| discovery \| prototype/);
  assert.match(workUnit, /delete_or_absorb_rule:/);
  assert.match(planningRef, /## Ready-For-Agent Brief/);
  assert.match(planningRef, /CONTEXT\.md/);
  assert.match(planningRef, /ADRs/);
  assert.match(planningRef, /## Architecture Recommendation/);
  assert.match(sourceCorpus, /Domain context/);
  assert.match(sourceCorpus, /Decision history/);
  assert.match(workflowDocs, /AGENT-BRIEF\.md/);
  assert.match(planningTemplates, /PROTOTYPE-DECISION\.md/);
  assert.match(planningTemplates, /ARCHITECTURE-RECOMMENDATIONS\.md/);
});

test("context budget and human-decision resume preserve only affected state", () => {
  assert.match(resumeRef, /Checkpoint before context pressure degrades/);
  assert.match(resumeRef, /Invalidate only downstream artifacts whose assumptions changed/);
  assert.match(loopPolicy, /Do not restart unrelated completed work/);
  assert.match(skill, /resume without restarting unrelated work/);
});

test("verification keeps conditional outcomes row-level and feedback loops red-capable", () => {
  assert.deepEqual(reportSchema.properties.status.enum, ["PASS", "FAIL", "BLOCKED"]);
  assert.match(acceptance, /`CONDITIONAL_PASS` is not a final workflow status/);
  assert.match(acceptance, /red-capable/);
  assert.match(skill, /Tests, lint, typecheck, and build are evidence types/);
  assert.match(skill, /Treat implementer output as a claim/);
  assert.match(workflowControl, /Status: PASS \| FAIL \| BLOCKED\n/);
  assert.match(workflowControl, /Domain Review State:/);
  assert.match(verificationTemplates, /Required External Check/);
});

test("workflow artifact inventories include lean, machine-dossier, and planning outputs", () => {
  for (const name of ["LEDGER.md", "SPEC.md", "AGENT-BRIEF.md", "PROTOTYPE-DECISION.md", "ARCHITECTURE-RECOMMENDATIONS.md"]) {
    assert.match(workflowDocs, new RegExp(name.replace(".", "\\.")));
    assert.match(artifacts, new RegExp(name.replace(".", "\\.")));
  }
  assert.match(readme, /\[Workflow artifacts\]\(docs\/artifacts\.md\)/);
  assert.match(templatesIndex, /`LEDGER\.md`/);
  assert.match(workflowDocs, /\.workflow\/dossiers\/\*\.yaml/);
  assert.match(artifacts, /\.workflow\/dossiers\/\*\.yaml/);
  assert.match(workflowControl, /Use the canonical template in \[goal-resume\.md\]/);
  assert.match(closeoutTemplates, /Final Disposition: exact action performed/);
});

test("metadata trigger policy aligns with descriptions and prompts stay concise", () => {
  const skillDirs = fs.readdirSync(path.join(repoRoot, "skills"), { withFileTypes: true }).filter((entry) => entry.isDirectory());
  for (const entry of skillDirs) {
    const skillText = read(`skills/${entry.name}/SKILL.md`);
    const metadata = parseOpenAiMetadata(read(`skills/${entry.name}/agents/openai.yaml`));
    const prompt = metadata.interface?.default_prompt || "";
    assert.match(prompt, new RegExp(`\\$${entry.name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}`));
    assert.ok(prompt.length <= 240, `${entry.name} default prompt is ${prompt.length} chars`);
    assert.ok(prompt.split(/[.!?](?:\s|$)/).filter(Boolean).length <= 1, `${entry.name} prompt should be one sentence`);
    assert.equal(metadata.policy?.allow_implicit_invocation, false);
    assert.match(frontmatterValue(skillText, "description"), /Use only when/);
  }
});

test("every skill core stays below the progressive-disclosure ceiling", () => {
  const files = fs.readdirSync(path.join(repoRoot, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `skills/${entry.name}/SKILL.md`);
  for (const file of files) {
    const text = read(file);
    const lines = text.split("\n").length;
    assert.ok(lines <= 500, `${file} has ${lines} lines`);
  }
  assert.ok(skill.split("\n").length <= 250, "workflow-supervisor core should remain substantially below 500 lines");
  assert.ok(skill.trim().split(/\s+/).length <= 2500, "workflow-supervisor core should remain concise");
  for (const [name, text] of Object.entries({ workflowFoundations, workUnitDelegation, verificationTemplates, closeoutTemplates })) {
    assert.ok(text.split("\n").length <= 250, `${name} should stay focused`);
  }
  for (const reference of [
    "workflow-foundations.md",
    "work-units-and-delegation.md",
    "verification-and-repair.md",
    "decisions-handoff-and-outcome.md",
  ]) {
    assert.match(workflowDocs, new RegExp(`\\[references/${reference.replace(".", "\\.")}\\]`));
  }
});

test("README examples use real placeholders and complete canonical contracts", () => {
  assert.doesNotMatch(readme, /docs\/migration\.md/);
  assert.match(readme, /<path-to-migration-spec>/);
});

test("stale optimization plan is not presented as current documentation", () => {
  assert.equal(fs.existsSync(path.join(repoRoot, "docs/workflow-supervisor-optimization-hardening-plan.md")), false);
});
