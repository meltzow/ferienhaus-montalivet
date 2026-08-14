import test from "node:test";
import assert from "node:assert/strict";
import { buildWasteReminders } from "./reminder-logic.mjs";

const base = {
  wasteOverride: null,
  tomorrow: "2026-08-19",
  todayWeekday: 2,
  tomorrowYear: 2026,
  tomorrowMonth: 8,
  wasteScheduleYear: 2026
};

test("active manual pickup replaces the built-in schedule", () => {
  const reminders = buildWasteReminders({
    ...base,
    wasteOverride: {
      enabled: true,
      label: "Sonderabholung",
      message: "Morgen ist die Sonderabholung."
    }
  });

  assert.deepEqual(reminders, [{
    type: "waste-manual-2026-08-19",
    title: "Sonderabholung",
    text: "Morgen ist die Sonderabholung."
  }]);
});

test("disabled manual pickup suppresses the built-in schedule", () => {
  const reminders = buildWasteReminders({
    ...base,
    wasteOverride: { enabled: false }
  });

  assert.deepEqual(reminders, []);
});

test("Tuesday uses the built-in yellow and green pickup", () => {
  const reminders = buildWasteReminders(base);
  assert.equal(reminders[0].type, "waste-yellow-green");
});

test("Wednesday in summer uses the built-in residual-waste pickup", () => {
  const reminders = buildWasteReminders({
    ...base,
    tomorrow: "2026-08-20",
    todayWeekday: 3
  });
  assert.equal(reminders[0].type, "waste-black");
});

test("no built-in reminder is created outside the configured year", () => {
  const reminders = buildWasteReminders({
    ...base,
    tomorrow: "2027-01-06",
    tomorrowYear: 2027,
    tomorrowMonth: 1
  });
  assert.deepEqual(reminders, []);
});
