import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { prepareProcessInvocation, runProcessTree } from "../lib/process-tree.mjs";

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

test("Windows npm command shims resolve without shell interpolation", (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-command-shim-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const target = path.join(directory, "node_modules", "fixture", "cli.js");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, "#!/usr/bin/env node\n");
  const shim = path.join(directory, "fixture.CMD");
  fs.writeFileSync(shim, '@ECHO off\r\n"%~dp0\\node_modules\\fixture\\cli.js" %*\r\n');
  const forwarded = ["--json-schema", '{"type":"object","literal":"&|%"}'];

  const invocation = prepareProcessInvocation({
    command: "fixture",
    args: forwarded,
    cwd: directory,
    env: { PATH: directory, PATHEXT: ".EXE;.CMD" },
    platform: "win32",
  });
  assert.equal(invocation.command, process.execPath);
  assert.deepEqual(invocation.args, [fs.realpathSync(target), ...forwarded]);

  const nativeTarget = path.join(directory, "node_modules", "fixture", "native.exe");
  fs.writeFileSync(nativeTarget, "native fixture placeholder");
  const nativeShim = path.join(directory, "native.CMD");
  fs.writeFileSync(nativeShim, '@ECHO off\r\n"%dp0%\\node_modules\\fixture\\native.exe" %*\r\n');
  const nativeInvocation = prepareProcessInvocation({
    command: "native",
    args: forwarded,
    cwd: directory,
    env: { PATH: directory, PATHEXT: ".EXE;.CMD" },
    platform: "win32",
  });
  assert.equal(nativeInvocation.command, fs.realpathSync(nativeTarget));
  assert.deepEqual(nativeInvocation.args, forwarded);

  if (process.platform !== "win32") {
    const linkedNative = path.join(directory, "linked-native.EXE");
    fs.symlinkSync(nativeTarget, linkedNative);
    const linkedInvocation = prepareProcessInvocation({
      command: linkedNative,
      args: forwarded,
      cwd: directory,
      env: { PATH: directory, PATHEXT: ".EXE;.CMD" },
      platform: "win32",
    });
    assert.equal(linkedInvocation.command, fs.realpathSync(nativeTarget));
    assert.deepEqual(linkedInvocation.args, forwarded);

    const dangling = path.join(directory, "dangling.EXE");
    fs.symlinkSync(path.join(directory, "missing.exe"), dangling);
    assert.throws(
      () => prepareProcessInvocation({
        command: dangling,
        args: [],
        cwd: directory,
        env: { PATH: directory, PATHEXT: ".EXE;.CMD" },
        platform: "win32",
      }),
      (error) => error?.code === "ENOENT",
    );

    const linkedDirectory = path.join(directory, "directory.EXE");
    fs.symlinkSync(path.join(directory, "node_modules"), linkedDirectory, "dir");
    assert.throws(
      () => prepareProcessInvocation({
        command: linkedDirectory,
        args: [],
        cwd: directory,
        env: { PATH: directory, PATHEXT: ".EXE;.CMD" },
        platform: "win32",
      }),
      (error) => error?.code === "ENOENT",
    );
  }

  const unknown = path.join(directory, "unknown.CMD");
  fs.writeFileSync(unknown, "@ECHO off\r\necho unsafe\r\n");
  assert.throws(
    () => prepareProcessInvocation({
      command: unknown,
      args: [],
      cwd: directory,
      env: { PATH: directory, PATHEXT: ".CMD" },
      platform: "win32",
    }),
    (error) => error?.code === "EUNSUPPORTEDCMD" && /only standard npm \.cmd shims/.test(error.message),
  );
});

test("runProcessTree executes a standard npm command shim on Windows", {
  skip: process.platform !== "win32" ? "Windows command shim regression" : false,
}, async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "workflow-command-shim-runtime-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const target = path.join(directory, "node_modules", "fixture", "cli.js");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, [
    "#!/usr/bin/env node",
    "let input = '';",
    "process.stdin.setEncoding('utf8');",
    "process.stdin.on('data', (chunk) => { input += chunk; });",
    "process.stdin.on('end', () => process.stdout.write(JSON.stringify({ args: process.argv.slice(2), input })));",
    "",
  ].join("\n"));
  const shim = path.join(directory, "fixture.cmd");
  fs.writeFileSync(shim, '@ECHO off\r\n"%~dp0\\node_modules\\fixture\\cli.js" %*\r\n');
  const args = ["--json-schema", '{"literal":"&|%"}'];
  const result = await runProcessTree({
    command: shim,
    args,
    cwd: directory,
    input: "prompt & literal\n",
    timeoutMs: 2_000,
    maxOutputBytes: 64 * 1024,
    quiescenceMs: 40,
  });

  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.deepEqual(JSON.parse(result.stdout), { args, input: "prompt & literal\n" });

  const sentinel = path.join(directory, "batch-ran.txt");
  const unknown = path.join(directory, "unknown.cmd");
  fs.writeFileSync(unknown, `@ECHO off\r\necho unsafe>"${sentinel}"\r\n`);
  const rejected = await runProcessTree({
    command: unknown,
    args: [],
    cwd: directory,
    timeoutMs: 2_000,
    maxOutputBytes: 64 * 1024,
    quiescenceMs: 40,
  });
  assert.equal(rejected.error?.code, "EUNSUPPORTEDCMD");
  assert.equal(fs.existsSync(sentinel), false, "unrecognized batch command must not execute");
});

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
