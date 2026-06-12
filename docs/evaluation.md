# Evaluation

Evaluation assets live in `eval/`.

## Files

- `smoke-prompts-only.md`: prompts for fresh-thread tests without expected answers.
- `smoke-answer-key.md`: evaluator-only expected skills, metrics, and behavior.
- `evil-metrics.md`: adversarial scoring rubric.
- `adversarial-report.md`: current review findings and promotion posture.
- `evaluation-protocol.md`: how to run and score tests.

## Commands

```bash
npm test
npm run validate:tests
```

## Evil Metrics

The evaluation suite checks:

- trigger precision
- grounding pressure
- concreteness
- boundary control
- verification independence
- repair quality
- stop-gate sensitivity
- loop discipline
- documentation usefulness
- resume resilience
- domain neutrality
- documentation production fitness
- minimal artifact selection
- finding linkage
- goal lifecycle discipline

## Live Forward-Test Bar

Before enabling implicit invocation or cutting a production release:

- run prompts from `smoke-prompts-only.md` in fresh sessions
- score with `smoke-answer-key.md` and `evil-metrics.md`
- record automatic fails
- keep every relevant metric at least 2
- target an average score of 2.6 or higher
- verify no tiny task triggers the supervisor
- verify Codex goal behavior for no active goal, matching active goal, unrelated active goal, tool unavailable, and no-goal requested
