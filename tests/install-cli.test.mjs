import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(repoRoot, "bin", "workflow-skills.mjs");

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "workflow-install-"));
}

function runRaw(args, cwd = tempDir()) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd,
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function workflowIgnoreCount(project) {
  return fs
    .readFileSync(path.join(project, ".gitignore"), "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim() === ".workflow/").length;
}

test("project install adds .workflow to the target project gitignore once", () => {
  const project = tempDir();
  fs.writeFileSync(path.join(project, ".gitignore"), "node_modules/\n");

  const result = runRaw([
    "install",
    "--agent",
    "all",
    "--scope",
    "project",
    "--project",
    project,
    "--skills",
    "workflow-docs",
  ], project);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(workflowIgnoreCount(project), 1);
  assert.match(fs.readFileSync(path.join(project, ".gitignore"), "utf8"), /node_modules\/\n\.workflow\/\n/);
  assert.ok(fs.existsSync(path.join(project, ".agents", "skills", "workflow-docs", "SKILL.md")));
  assert.ok(fs.existsSync(path.join(project, ".claude", "skills", "workflow-docs", "SKILL.md")));

  const repeat = runRaw([
    "install",
    "--agent",
    "codex",
    "--scope",
    "project",
    "--project",
    project,
    "--skills",
    "workflow-docs",
    "--force",
  ], project);

  assert.equal(repeat.status, 0, repeat.stderr);
  assert.equal(workflowIgnoreCount(project), 1);
});

test("project install dry run reports the gitignore update without writing it", () => {
  const project = tempDir();
  const result = runRaw([
    "install",
    "--agent",
    "codex",
    "--scope",
    "project",
    "--project",
    project,
    "--skills",
    "workflow-docs",
    "--dry-run",
  ], project);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Would add \.workflow\/ in /);
  assert.equal(fs.existsSync(path.join(project, ".gitignore")), false);
});
