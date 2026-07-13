import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runProcessTree } from "../lib/process-tree.mjs";

const fixture = fileURLToPath(new URL("./fixtures/process-tree-worker.mjs", import.meta.url));
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function runFixture(mode, options = {}) {
  const { args = [], ...rest } = options;
  return runProcessTree({
    command: process.execPath,
    args: [fixture, mode, ...args],
    timeoutMs: 2_000,
    maxOutputBytes: 64 * 1024,
    quiescenceMs: 40,
    ...rest,
  });
}

test("runProcessTree exchanges stdin and captures normal stdout and stderr", async () => {
  const result = await runFixture("echo", { input: "hello π\n" });

  assert.equal(result.status, 0);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, "stdout:hello π\n");
  assert.equal(result.stderr, "stderr:ok");
  assert.equal(result.error, null);
  assert.equal(result.timedOut, false);
  assert.equal(result.overflow, false);
  assert.ok(result.durationMs >= 0);
  assert.equal(result.cleanup.strategy, process.platform === "win32" ? "windows_taskkill" : "posix_process_group");
  assert.equal(result.cleanup.descendants_terminated, true);
  assert.equal(result.cleanup.quiescence_ms, 40);
  assert.ok(Array.isArray(result.cleanup.limitations));
});

test("runProcessTree preserves a nonzero direct-child exit", async () => {
  const result = await runFixture("nonzero");

  assert.equal(result.status, 7);
  assert.equal(result.signal, null);
  assert.equal(result.stdout, "stdout:nonzero");
  assert.equal(result.stderr, "stderr:nonzero");
  assert.equal(result.error, null);
  assert.equal(result.timedOut, false);
  assert.equal(result.overflow, false);
});

test("runProcessTree times out and terminates the owned process tree", async () => {
  const result = await runFixture("sleep", { timeoutMs: 80 });

  assert.equal(result.timedOut, true);
  assert.equal(result.overflow, false);
  assert.equal(result.error, null);
  assert.equal(result.cleanup.descendants_terminated, true);
  assert.ok(result.durationMs < 2_000, `timeout cleanup took ${result.durationMs}ms`);
  assert.ok(result.signal || result.status !== 0);
});

test("runProcessTree enforces one aggregate stdout and stderr byte budget", async () => {
  const maxOutputBytes = 1_024;
  const result = await runFixture("overflow", { maxOutputBytes });

  assert.equal(result.overflow, true);
  assert.equal(result.timedOut, false);
  assert.equal(result.error, null);
  assert.ok(Buffer.byteLength(result.stdout) + Buffer.byteLength(result.stderr) <= maxOutputBytes);
  assert.equal(result.cleanup.descendants_terminated, true);
  assert.ok(result.durationMs < 2_000, `overflow cleanup took ${result.durationMs}ms`);
});

test("a child-spawned delayed writer cannot mutate after runProcessTree resolves", async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-process-tree-"));
  const target = path.join(directory, "late-write.txt");
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const result = await runFixture("spawn-delayed-writer", {
    args: [target, "300"],
    quiescenceMs: 80,
  });

  assert.equal(result.status, 0);
  assert.equal(result.timedOut, false);
  assert.equal(result.overflow, false);
  assert.equal(result.cleanup.descendants_terminated, true);
  assert.equal(fs.existsSync(`${target}.armed`), true, "writer fixture must start before parent exit");
  assert.equal(fs.existsSync(target), false, "writer must not run before resolution");
  await wait(450);
  assert.equal(fs.existsSync(target), false, "writer must not run after resolution");
});
