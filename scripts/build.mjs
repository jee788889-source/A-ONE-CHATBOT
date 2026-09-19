#!/usr/bin/env node
/**
 * Production build wrapper.
 *
 * `next build` on its own is fine on a developer machine and unreliable on
 * shared hosting, for two reasons this script removes:
 *
 *  1. **A stale `.next`.** Hosts redeploy into the same directory, so a
 *     previous half-finished build leaves chunks behind. Next reuses them, and
 *     a mismatched chunk surfaces during page generation as "<Html> should not
 *     be imported outside of pages/_document" — an error about an import this
 *     project does not contain, which sends you looking in the wrong place.
 *
 *  2. **A non-standard `NODE_ENV`.** Panels commonly set `prod`, `PRODUCTION`
 *     or leave it empty. Next warns that this "creates inconsistencies" and
 *     then behaves differently in ways that are hard to attribute.
 *
 * Crucially, the cleanup is **not destructive until the new build succeeds**.
 * The previous `.next` is moved aside and restored if the build fails, because
 * on a single-directory host the running app is served straight out of that
 * folder: deleting it up front means a failed build takes the live site down
 * with it, turning a broken deploy into an outage.
 *
 * Kept dependency-free (no `cross-env`, no `rimraf`) so it cannot itself fail
 * to install on a constrained host — the one place it needs to work.
 */
import { spawnSync } from "node:child_process";
import { existsSync, renameSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const nextDir = resolve(root, ".next");
const backupDir = resolve(root, ".next.previous");

const previousEnv = process.env.NODE_ENV;
if (previousEnv !== "production") {
  console.log(
    `[build] NODE_ENV was ${previousEnv ? `"${previousEnv}"` : "unset"} — pinning it to "production".`
  );
}
process.env.NODE_ENV = "production";

// --- Move the current build aside, rather than deleting it -------------------
let backedUp = false;
rmSync(backupDir, { recursive: true, force: true });

if (existsSync(nextDir)) {
  try {
    renameSync(nextDir, backupDir);
    backedUp = true;
    console.log("[build] set the existing .next aside; it will be restored if this build fails.");
  } catch (error) {
    // A rename can fail across filesystems or under tight permissions. Fall
    // back to clearing only the incremental cache, which is where stale chunks
    // actually live — still better than building on top of everything.
    console.warn(`[build] could not set .next aside (${error?.message ?? error}); clearing its cache instead.`);
    rmSync(resolve(nextDir, "cache"), { recursive: true, force: true });
  }
}

// --- Build -------------------------------------------------------------------
const cmd = process.platform === "win32" ? "npx" : "next";
const args = process.platform === "win32" ? ["next", "build"] : ["build"];
const result = spawnSync(cmd, args, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
  shell: true,
});

const ok = !result.error && result.status === 0;

if (result.error) {
  console.error("[build] failed to start next:", result.error.message);
}

// --- Commit or roll back -----------------------------------------------------
if (backedUp) {
  if (ok) {
    rmSync(backupDir, { recursive: true, force: true });
  } else {
    rmSync(nextDir, { recursive: true, force: true });
    try {
      renameSync(backupDir, nextDir);
      console.error(
        "[build] BUILD FAILED — restored the previous .next, so the running app is unaffected. " +
          "Fix the error above and build again."
      );
    } catch (error) {
      console.error(
        `[build] BUILD FAILED and the previous .next could not be restored (${error?.message ?? error}). ` +
          "The app will not start until a build succeeds."
      );
    }
  }
} else if (!ok) {
  // We never got a copy aside, so whatever is in .next now is whatever the
  // failed build left there — possibly half-written. Say so plainly rather
  // than letting someone restart into a partial build.
  console.error(
    "[build] BUILD FAILED. The previous build could not be set aside beforehand, so .next " +
      "may be incomplete — do not restart the app until a build succeeds."
  );
}

process.exit(ok ? 0 : 1);
