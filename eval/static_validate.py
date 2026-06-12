from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKILL_ROOT = ROOT / "skills"
TEST_ROOT = ROOT / "eval"

EXPECTED = {
    "workflow-supervisor": ["source", "work unit", "dossier", "verification", "repair", "Stop Gates", "automatic cascade", "Codex Goal Lifecycle", "active unrelated"],
    "source-corpus": ["authority", "freshness", "contradictions", "evidence_gaps", "allowed_next_action", "ordinary repo inspection"],
    "work-unit": ["dependencies", "in_scope", "out_of_scope", "done_criteria", "verification", "document section", "coarse done criteria"],
    "dossier-builder": ["allowed_surfaces", "forbidden_surfaces", "acceptance_matrix", "stop_gates", "work_points", "verification finding", "provisional dossier"],
    "worker-roles": ["Implementer", "Verifier", "Repair-Ticket", "role", "forbidden", "Editor", "Solo Mode"],
    "acceptance-matrix": ["Evidence Required", "PASS", "FAIL", "BLOCKED", "Rubber-Stamp", "unsupported claim", "Ready To Publish", "matrix row ID", "Ownership Boundary"],
    "loop-policy": ["repair_limit", "No-Progress", "approval", "completion", "resume", "No-Prerequisite", "Parallel Safety", "Goal Policy", "codex_goal_tool_actions"],
    "workflow-docs": ["WORKFLOW.md", "SOURCE-CORPUS.md", "HANDOFF.md", "templates.md", "State Artifact Medium", "DOCUMENTATION-BRIEF.md", "GOAL-STATE.md"],
}

PROMPT_COVERAGE = [
    "Happy Path",
    "Ambiguous",
    "Contradictory",
    "Over-Broad",
    "Role Contamination",
    "Rubber-Stamp",
    "Infinite Loop",
    "Documentation",
    "Resume",
    "No Repository",
    "Documentation-Only",
    "Research Memo",
    "Prerequisite",
    "Documentation Brief",
    "Editorial Review",
    "Tiny Task",
    "Over-Documentation",
    "False Independence",
    "Narrow Repair",
    "Parallel Mutation",
    "Missing Boundaries",
    "Waiver",
    "Failed Verification",
    "Small Unit Test",
    "Stack Trace",
    "Small Diff",
    "README Wording",
    "Source-Corpus",
    "Acceptance Ownership",
    "Goal-Oriented",
    "No Goal",
    "Explicit Supervisor Tiny",
    "Active Goal",
    "Goal Completion",
    "Implicit Tiny",
    "Implicit Medium",
    "Implicit Design",
    "Implicit Spreadsheet",
    "Implicit Ops",
    "Implicit Research",
    "Implicit Broad",
]


def fail(msg):
    print(f"FAIL: {msg}")
    return False


def parse_frontmatter(text):
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---\n", 4)
    if end == -1:
        return None
    raw = text[4:end].strip().splitlines()
    data = {}
    for line in raw:
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        data[key.strip()] = value.strip()
    return data


def main():
    ok = True
    actual_skills = {p.name for p in SKILL_ROOT.iterdir() if p.is_dir()}
    expected_skills = set(EXPECTED)
    if actual_skills != expected_skills:
        ok = fail(f"skill dir mismatch actual={sorted(actual_skills)} expected={sorted(expected_skills)}") and ok

    for name, required_terms in EXPECTED.items():
        path = SKILL_ROOT / name / "SKILL.md"
        if not path.exists():
            ok = fail(f"missing {path}") and ok
            continue
        text = path.read_text()
        fm = parse_frontmatter(text)
        if not fm:
            ok = fail(f"{name}: invalid frontmatter") and ok
            continue
        if set(fm) != {"name", "description"}:
            ok = fail(f"{name}: frontmatter must contain only name and description") and ok
        if fm.get("name") != name:
            ok = fail(f"{name}: frontmatter name mismatch") and ok
        desc = fm.get("description", "")
        if len(desc) < 80 or "TODO" in desc:
            ok = fail(f"{name}: weak description") and ok
        if "TODO" in text or "[TODO" in text:
            ok = fail(f"{name}: leftover scaffold TODO") and ok
        for term in required_terms:
            if term not in text:
                ok = fail(f"{name}: missing required term {term!r}") and ok
        agent_yaml = SKILL_ROOT / name / "agents" / "openai.yaml"
        if not agent_yaml.exists():
            ok = fail(f"{name}: missing agents/openai.yaml") and ok
        else:
            agent_text = agent_yaml.read_text()
            if f"Use ${name}" not in agent_text:
                ok = fail(f"{name}: default_prompt must mention ${name}") and ok
            if "allow_implicit_invocation: false" not in agent_text:
                ok = fail(f"{name}: skill must opt out of implicit invocation until trigger precision is proven") and ok

    templates = SKILL_ROOT / "workflow-docs" / "references" / "templates.md"
    references_dir = SKILL_ROOT / "workflow-docs" / "references"
    if not templates.exists() or not references_dir.exists():
        ok = fail("workflow-docs missing template index or references dir") and ok
    else:
        template_text = "\n".join(p.read_text() for p in references_dir.glob("*.md"))
        for artifact in [
            "WORKFLOW.md",
            "SOURCE-CORPUS.md",
            "WORK-UNITS.md",
            "DOSSIER.md",
            "ACCEPTANCE-MATRIX.md",
            "VERIFICATION-REPORT.md",
            "REPAIR-TICKETS.md",
            "DECISIONS.md",
            "HANDOFF.md",
            "OUTCOME.md",
            "DOCUMENTATION-BRIEF.md",
            "CONTENT-INVENTORY.md",
            "OUTLINE.md",
            "STYLE-GUIDE.md",
            "GLOSSARY.md",
            "REVIEW-PLAN.md",
            "REVISION-QUEUE.md",
            "PUBLISHING-CHECKLIST.md",
            "MAINTENANCE-PLAN.md",
            "CONTENT-DRAFT.md",
            "CLAIMS-REGISTER.md",
            "ASSET-REGISTER.md",
            "PUBLICATION-LOG.md",
            "GOAL-STATE.md",
        ]:
            if artifact not in template_text:
                ok = fail(f"workflow-docs references missing {artifact}") and ok

    prompts = (TEST_ROOT / "smoke-prompts.md").read_text()
    for label in PROMPT_COVERAGE:
        if not re.search(label, prompts, re.IGNORECASE):
            ok = fail(f"smoke prompts missing {label}") and ok

    metrics = (TEST_ROOT / "evil-metrics.md").read_text()
    for metric in [f"M{i}" for i in range(1, 16)]:
        if metric not in metrics:
            ok = fail(f"evil metrics missing {metric}") and ok

    prompts_only_path = TEST_ROOT / "smoke-prompts-only.md"
    answer_key_path = TEST_ROOT / "smoke-answer-key.md"
    if not prompts_only_path.exists() or not answer_key_path.exists():
        ok = fail("smoke suite must be split into prompts-only and answer-key files") and ok
    else:
        prompts_only = prompts_only_path.read_text()
        if "Expected skills:" in prompts_only or "Expected behavior:" in prompts_only or "Evil metrics:" in prompts_only:
            ok = fail("prompts-only file leaks the answer key") and ok
        answer_key = answer_key_path.read_text()
        if "Expected skills:" not in answer_key or "Evil metrics:" not in answer_key:
            ok = fail("answer key missing expected metadata") and ok

    if ok:
        print("PASS: packaged workflow skills and smoke-test artifacts validated")
        return 0
    return 1


if __name__ == "__main__":
    sys.exit(main())
