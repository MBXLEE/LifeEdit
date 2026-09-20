const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

function loadTs(file) {
  const filename = path.resolve(file);
  const mod = new Module(filename, module);
  mod._compile(ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
  return mod.exports;
}

const { defaultNotificationSettings, focusNotifications, plannerNotifications, buildNotificationSchedule } = loadTs("lib/notifications.ts");
const auth = fs.readFileSync("components/auth-card.tsx", "utf8");
const css = fs.readFileSync("app/globals.css", "utf8");
const modal = fs.readFileSync("components/workspace-ui.tsx", "utf8");

assert.match(auth, /aria-label=\{visible \? "Hide password" : "Show password"\}/);
assert.match(auth, /type=\{visible \? "text" : "password"\}/);
assert.match(auth, /Stay signed in/);
assert.match(auth, /onMouseDown=\{e => e\.preventDefault\(\)\}/);

assert.match(css, /overflow-x:hidden/);
assert.match(css, /\.le-modal /);
assert.match(css, /max-width:calc\(100vw - 28px\)/);
assert.match(modal, /document\.body\.style\.overflow = "hidden"/);
assert.match(modal, /document\.body\.style\.overflow = previous/);

const now = Date.parse("2026-09-20T10:00:00");
const focus = focusNotifications({ id: "p1", name: "Deep Work", focusMinutes: 25, breakMinutes: 5, sessions: 2, completed: 0, phase: "focus", running: true, endsAt: now + 60000, remaining: 60 }, now);
assert.deepEqual(focus.map(item => item.title), ["Focus session completed", "Break started", "Next focus session ready"]);
assert.equal(new Set(focus.map(item => item.id)).size, focus.length);

const settings = defaultNotificationSettings();
settings.categories.overdue = true;
const planner = plannerNotifications([{ id: "t1", title: "Plan launch", date: "2026-09-20", time: "10:30", minutes: 30, pillar: "Personal Growth", done: false }], settings, now);
assert.equal(planner.length, 2);
assert.equal(planner[0].title, "Upcoming time block");
assert.equal(planner[1].title, "Task due now");
assert.equal(plannerNotifications([{ id: "t1", title: "Plan launch", date: "2026-09-20", time: "10:30", minutes: 30, pillar: "Personal Growth", done: true }], settings, now).length, 0);

const empty = { notificationSettings: { ...settings, enabled: false }, tasks: [], habits: [], workouts: [], goals: [], focusPlan: null };
assert.equal(buildNotificationSchedule(empty, now).length, 0);
console.log("PASS: password visibility markup, stay-signed-in UI, modal overflow lock CSS, and notification scheduling.");
