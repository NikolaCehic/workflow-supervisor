# Evaluation Protocol

## Purpose

Evaluate whether the packaged workflow skills behave like useful process artifacts before publishing, installing, or using them broadly.

## Manual Forward-Test Procedure

1. Start a fresh thread with only the skill path and one smoke prompt.
2. Ask the agent to use the named skill from the packaged `skills/<skill-name>/SKILL.md` directory.
3. Do not reveal the expected behavior or evil metrics during the run.
4. Save the response or artifacts.
5. Score relevant metrics from `evil-metrics.md`.
6. Mark automatic fails before averaging scores.
7. Revise the skill only after scoring.

## Implicit Trigger Procedure

To test install-readiness, also run prompts that do not name any skill. Score whether the correct skill triggers naturally, whether no skill triggers for direct work, and whether `workflow-supervisor` stays opt-in for supervised/open-ended loops.

## Static Validation

Run:

```bash
python3 eval/static_validate.py
```

This checks structure, frontmatter, missing TODO text, required skill concepts, workflow-doc templates, and smoke prompt coverage.

## Production Promotion Bar

Do not install the skills globally until:

- static validation passes from the package root
- all relevant smoke scenarios score at least 2
- no automatic fail appears
- trigger descriptions are tightened after observing false positives
- workflow-doc outputs can be used by a fresh agent without the original chat
