import { loadPublishedData } from "./content-client.js?v=2.2";

const published = await loadPublishedData(window.HOUSE_DATA);
const data = published.content;
const wastePickups = published.wastePickups;
document.getElementById("house-name").textContent = data.houseName;
document.title = data.houseName;

const siteMeta = document.getElementById("site-meta");
if (siteMeta) {
  siteMeta.textContent = `Version ${data.siteVersion} · zuletzt aktualisiert ${data.lastUpdated}`;
}

const departureStand = document.getElementById("departure-stand");
if (departureStand && data.departureUpdatedAt) {
  departureStand.textContent = `Stand ${data.departureUpdatedAt}`;
}

const topicGrid = document.getElementById("topic-grid");
const dialog = document.getElementById("topic-dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogEyebrow = document.getElementById("dialog-eyebrow");
const dialogBody = document.getElementById("dialog-body");

function renderTopics() {
  topicGrid.innerHTML = "";
  for (const topic of data.topics) {
    const btn = document.createElement("button");
    btn.className = "topic-card";
    btn.innerHTML = `
      <div class="topic-card__icon">${escapeHtml(topic.icon)}</div>
      <h3>${escapeHtml(topic.title)}</h3>
      <p>${escapeHtml(topic.teaser)}</p>
      ${topic.updatedAt ? `<div class="topic-card__meta">Stand ${escapeHtml(topic.updatedAt)}</div>` : ""}
    `;
    btn.addEventListener("click", () => openTopic(topic));
    topicGrid.appendChild(btn);
  }
}

function openTopic(topic) {
  dialogEyebrow.textContent = topic.eyebrow || "";
  dialogTitle.textContent = `${topic.icon || ""} ${topic.title || ""}`.trim();
  const freshness = topic.updatedAt ? `<div class="info-stand">Stand ${escapeHtml(topic.updatedAt)}</div>` : "";
  const callout = topic.callout ? `<div class="callout">${escapeHtml(topic.callout)}</div>` : "";
  const troubleshooting = (topic.troubleshooting || []).map(issue => `
    <details class="troubleshooting">
      <summary>⚠️ ${escapeHtml(issue.title)}</summary>
      <div class="troubleshooting__body">
        ${issue.trigger ? `<p class="troubleshooting__trigger">${escapeHtml(issue.trigger)}</p>` : ""}
        <ol class="troubleshooting__steps">${(issue.steps || []).map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        ${issue.warning ? `<div class="troubleshooting__warning"><strong>Wichtig:</strong> ${escapeHtml(issue.warning)}</div>` : ""}
      </div>
    </details>
  `).join("");
  const sourceImage = safeUrl(topic.sourceImage);
  const image = sourceImage
    ? `<details><summary>Originalübersicht anzeigen</summary><img src="${escapeHtml(sourceImage)}" alt="Originalseite aus dem Hausbuch" style="width:100%;margin-top:10px;border-radius:12px"></details>`
    : "";
  const sourceUrl = safeUrl(topic.sourceUrl, true);
  const source = sourceUrl
    ? `<p class="small muted"><a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(topic.sourceLabel || "Offizielle Quelle öffnen")} ↗</a></p>`
    : "";
  dialogBody.innerHTML = `
    ${freshness}
    ${callout}
    <ul class="dialog-list">${(topic.items || []).map(x => `<li>${escapeHtml(x)}</li>`).join("")}</ul>
    ${troubleshooting}
    ${source}
    ${image}
  `;
  dialog.showModal();
}

renderTopics();

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function dateOnlyLocal(input) {
  const [y, m, d] = input.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function dayDiff(a, b) {
  const oneDay = 86400000;
  const aa = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bb = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bb - aa) / oneDay);
}

const departureInput = document.getElementById("departure-date");
const savedDeparture = localStorage.getItem("houseDepartureDate");
if (savedDeparture) departureInput.value = savedDeparture;

document.getElementById("save-departure").addEventListener("click", () => {
  if (departureInput.value) localStorage.setItem("houseDepartureDate", departureInput.value);
  else localStorage.removeItem("houseDepartureDate");
  renderToday();
  window.dispatchEvent(new CustomEvent("stay-updated", {
    detail: { departureDate: departureInput.value || "" }
  }));
});

function renderToday() {
  const now = new Date();
  const weekday = now.getDay(); // Sun=0
  const week = getISOWeek(now);
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const notes = [];
  const todayIso = localDateString(now);
  const tomorrowIso = localDateString(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  const todayOverride = wastePickups[todayIso];
  const tomorrowOverride = wastePickups[tomorrowIso];

  if (todayOverride?.enabled) {
    notes.push(`🗑️ Heute: ${todayOverride.label}.`);
  }
  if (tomorrowOverride?.enabled) {
    notes.push(`🗑️ Morgen: ${tomorrowOverride.label}. Bitte heute Abend rausstellen.`);
  }

  // Müllplan 2026, offiziell geprüft bei Mairie Vendays-Montalivet / Smicotom.
  if (year === data.wasteScheduleYear) {
    const summerMontalivet = month === 7 || month === 8;
    const residualWasteThisWeek = summerMontalivet || (week % 2 === 1);

    if (weekday === 2 && !tomorrowOverride) {
      notes.push("🗑️ Morgen (Mittwoch): gelbe + grüne Tonne. Bitte heute Abend rausstellen.");
    }
    if (weekday === 3 && !todayOverride) {
      notes.push("🗑️ Heute (Mittwoch): Verpackungen/Papier + Bioabfall.");
    }
    if (weekday === 3 && !tomorrowOverride) {
      if (residualWasteThisWeek) {
        notes.push("🗑️ Morgen (Donnerstag): Restmüll. Bitte heute Abend die schwarze Tonne rausstellen.");
      }
    }
    if (weekday === 4 && residualWasteThisWeek && !todayOverride) {
      notes.push("🗑️ Heute (Donnerstag): Restmüll.");
    }
  } else if (!todayOverride && !tomorrowOverride) {
    notes.push(`⚠️ Der hinterlegte Müllplan gilt für ${data.wasteScheduleYear}. Bitte den aktuellen Plan der Gemeinde prüfen.`);
  }

  const dep = localStorage.getItem("houseDepartureDate");
  if (dep) {
    const d = dateOnlyLocal(dep);
    const diff = dayDiff(now, d);
    if (diff === 1) notes.push("🚪 Ihr reist morgen ab. Am besten die Abreise-Checkliste schon einmal öffnen.");
    if (diff === 0) notes.push("🚪 Heute ist Abreisetag. Bitte die Abreise-Checkliste vollständig durchgehen.");
    if (diff > 1 && diff <= 3) notes.push(`🏡 Noch ${diff} Tage bis zur Abreise.`);
  }

  const card = document.getElementById("today-card");
  card.classList.toggle("is-important", notes.length > 0);
  if (notes.length) {
    card.innerHTML = `
      <div class="eyebrow">Heute wichtig</div>
      <h2>${now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })}</h2>
      <ul class="today-list">${notes.map(n => `<li>${n}</li>`).join("")}</ul>
    `;
  } else {
    card.innerHTML = `
      <div class="eyebrow">Heute wichtig</div>
      <h2>Alles entspannt 👋</h2>
      <p>Für heute ist aus dem Hausguide nichts Besonderes fällig.</p>
    `;
  }
}
renderToday();

const checklist = document.getElementById("departure-checklist");
function renderChecklist() {
  const state = JSON.parse(localStorage.getItem("departureChecklist") || "{}");
  checklist.innerHTML = "";
  data.departureChecklist.forEach((text, idx) => {
    const label = document.createElement("label");
    label.className = "check-item" + (state[idx] ? " is-done" : "");
    label.innerHTML = `<input type="checkbox" ${state[idx] ? "checked" : ""}><span>${text}</span>`;
    const cb = label.querySelector("input");
    cb.addEventListener("change", () => {
      const next = JSON.parse(localStorage.getItem("departureChecklist") || "{}");
      next[idx] = cb.checked;
      localStorage.setItem("departureChecklist", JSON.stringify(next));
      renderChecklist();
    });
    checklist.appendChild(label);
  });
}
renderChecklist();

document.getElementById("reset-checklist").addEventListener("click", () => {
  localStorage.removeItem("departureChecklist");
  renderChecklist();
});

const waBtn = document.getElementById("whatsapp-btn");
const contactHint = document.getElementById("contact-hint");

function refreshContactState() {
  if (!data.ownerWhatsApp) {
    contactHint.textContent = "Die WhatsApp-Nummer ist noch nicht in der Verwaltung hinterlegt.";
  } else {
    contactHint.textContent = "WhatsApp öffnet sich mit einer vorbereiteten Nachricht.";
  }
}
refreshContactState();

waBtn.addEventListener("click", () => {
  const area = document.getElementById("question-area").value;
  const text = document.getElementById("question-text").value.trim();
  if (!data.ownerWhatsApp) {
    alert("Die WhatsApp-Nummer des Hauseigentümers ist noch nicht hinterlegt.");
    return;
  }
  const message = `Hallo, ich habe eine Frage zum Ferienhaus.\nBereich: ${area}\n\n${text || "(keine weitere Beschreibung)"}`;
  window.open(`https://wa.me/${data.ownerWhatsApp}?text=${encodeURIComponent(message)}`, "_blank", "noopener");
});

const gallery = document.getElementById("source-gallery");
data.sourceImages.forEach((src, i) => {
  const a = document.createElement("a");
  a.href = src;
  a.target = "_blank";
  a.rel = "noopener";
  a.innerHTML = `<img src="${src}" alt="Hausbuch – Originalseite ${i + 1}">`;
  gallery.appendChild(a);
});

// Installable PWA
let deferredPrompt;
const installBtn = document.getElementById("install-btn");
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn.hidden = false;
});
installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  installBtn.hidden = true;
});

if ("serviceWorker" in navigator) {
  const registerServiceWorker = () => navigator.serviceWorker.register("./sw.js?v=2.2");
  if (document.readyState === "complete") registerServiceWorker();
  else window.addEventListener("load", registerServiceWorker, { once: true });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeUrl(value, httpOnly = false) {
  if (!value) return "";
  try {
    const url = new URL(value, window.location.href);
    if (httpOnly && !["http:", "https:"].includes(url.protocol)) return "";
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return url.href;
  } catch {
    return "";
  }
}

function localDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
