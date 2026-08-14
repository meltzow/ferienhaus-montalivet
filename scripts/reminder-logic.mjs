export function buildWasteReminders({
  wasteOverride,
  tomorrow,
  todayWeekday,
  tomorrowYear,
  tomorrowMonth,
  wasteScheduleYear
}) {
  if (wasteOverride) {
    if (wasteOverride.enabled !== true) return [];
    return [{
      type: `waste-manual-${tomorrow}`,
      text: wasteOverride.message || `Morgen früh: ${wasteOverride.label || "Müllabholung"}. Bitte heute Abend rausstellen.`,
      title: wasteOverride.label || "Müll morgen"
    }];
  }

  if (tomorrowYear !== wasteScheduleYear) return [];

  if (todayWeekday === 2) {
    return [{
      type: "waste-yellow-green",
      text: "Morgen früh: gelbe und grüne Tonne. Bitte heute Abend rausstellen."
    }];
  }

  if (todayWeekday === 3) {
    const summerMontalivet = tomorrowMonth === 7 || tomorrowMonth === 8;
    const residualWasteWeek = summerMontalivet || isoWeek(tomorrow) % 2 === 1;
    if (residualWasteWeek) {
      return [{
        type: "waste-black",
        text: "Morgen früh: Restmüll. Bitte heute Abend die schwarze Tonne rausstellen."
      }];
    }
  }

  return [];
}

export function isoWeek(isoDate) {
  const date = new Date(`${isoDate}T12:00:00Z`);
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
