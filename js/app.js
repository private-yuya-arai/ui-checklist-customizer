// Main application logic
import { SCREENS, CHECKLIST } from './data.js';

// ========== State ==========
const state = {
  device: "web",            // web | mobile
  current: SCREENS[0].id,   // current screen id
  mode: "screen",           // screen | all | selected
  query: "",
  selected: new Set(),      // item IDs
};

// ========== Utils ==========
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function badgeClass(cat) { return "chk-badge-" + cat.replace("・", ""); }
function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 1500);
}
function screenLabel(id) {
  const s = SCREENS.find(x => x.id === id);
  return s ? s.label : id;
}

// ========== Device + Screen switching ==========
function applyDeviceClass() {
  document.body.classList.toggle("device-web", state.device === "web");
  document.body.classList.toggle("device-mobile", state.device === "mobile");
  $$(".device-btn").forEach(b => {
    const active = b.dataset.device === state.device;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-pressed", active ? "true" : "false");
  });
}

function switchDevice(device, { preserveScreen = true } = {}) {
  if (device !== "web" && device !== "mobile") return;
  state.device = device;
  applyDeviceClass();
  // Keep the same screen id, just show the matching device's section
  switchScreen(state.current);
}

function switchScreen(id) {
  state.current = id;
  $$(".screen-tab").forEach(t => {
    t.setAttribute("aria-current", t.dataset.screen === id ? "true" : "false");
  });
  $$(".screen").forEach(s => {
    const match = s.dataset.screen === id && s.dataset.device === state.device;
    s.hidden = !match;
  });
  const urls = {
    "intro": "https://example.city.jp/apply",
    "login": "https://example.city.jp/login",
    "form-personal": "https://example.city.jp/apply/step-2",
    "form-address": "https://example.city.jp/apply/step-3",
    "form-upload": "https://example.city.jp/apply/step-4",
    "confirm": "https://example.city.jp/apply/confirm",
    "error": "https://example.city.jp/apply/step-2",
    "complete": "https://example.city.jp/apply/done"
  };
  const urlEl = $("#sampleUrl");
  if (urlEl) urlEl.textContent = urls[id] || "";
  renderSidebar();
  // scroll sample area to top
  const layout = document.querySelector('.layout');
  if (layout) window.scrollTo({top: layout.offsetTop - 20, behavior: 'smooth'});
}

// ========== Filtering ==========
function getVisibleItems() {
  const q = state.query.trim().toLowerCase();
  return CHECKLIST.filter(item => {
    if (state.mode === "screen") {
      if (!item.screens.includes(state.current)) return false;
    } else if (state.mode === "selected") {
      if (!state.selected.has(item.id)) return false;
    }
    if (q) {
      const hay = (item.content + " " + item.category + " " + item.subcategory + " " + item.no + " " + item.r5no).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

// ========== Sidebar rendering ==========
function cardHtml(item) {
  const selected = state.selected.has(item.id);
  const numText = item.no || item.r5no || "—";
  const screensLabel = item.screens.length >= SCREENS.length
    ? "全画面共通"
    : item.screens.map(screenLabel).join(" / ");
  return `
    <article class="chk-card ${selected ? 'is-selected' : ''}" data-id="${item.id}" data-anchor="${item.anchor}" tabindex="0" role="button" aria-label="クリックでサンプル上の該当UIへ移動">
      <div class="chk-card-check" data-action="toggle" role="checkbox" aria-checked="${selected}" tabindex="0" title="採用に追加／解除">${selected ? '✓' : ''}</div>
      <div class="chk-card-body">
        <div class="chk-card-top">
          <span class="chk-card-no">${escapeHtml(numText)}</span>
          <span class="chk-badge ${badgeClass(item.category)}">${escapeHtml(item.category)}</span>
        </div>
        <p class="chk-card-sub">${escapeHtml(item.subcategory)}</p>
        <div class="chk-card-content">${escapeHtml(item.content)}</div>
        <div class="chk-card-locate">📍 ${escapeHtml(screensLabel)}</div>
      </div>
    </article>
  `;
}

function renderSidebar() {
  const items = getVisibleItems();
  const list = $("#sidebarList");
  if (items.length === 0) {
    list.innerHTML = `<div class="empty-msg">表示できる項目がありません</div>`;
  } else {
    list.innerHTML = items.map(cardHtml).join("");
    attachCardEvents();
  }
  $("#visibleCount").textContent = items.length;
  $("#selectedCount").textContent = state.selected.size;
  $("#totalCount").textContent = CHECKLIST.length;
  $("#currentScreenLabel").textContent = state.mode === "screen" ? screenLabel(state.current) : (state.mode === "all" ? "全画面" : "採用済み");
  $("#exportBtn").disabled = state.selected.size === 0;
  $("#clearBtn").disabled = state.selected.size === 0;
}

function attachCardEvents() {
  $$(".chk-card").forEach(card => {
    const id = card.dataset.id;
    const item = CHECKLIST.find(c => c.id === id);
    card.addEventListener("click", (e) => {
      if (e.target.closest('[data-action="toggle"]')) return;
      navigateToItem(item);
    });
    card.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        if (e.target.closest('[data-action="toggle"]')) return;
        e.preventDefault();
        navigateToItem(item);
      }
    });
    const check = card.querySelector('[data-action="toggle"]');
    check.addEventListener("click", e => {
      e.stopPropagation();
      toggleSelect(id);
    });
    check.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        toggleSelect(id);
      }
    });
  });
}

function toggleSelect(id) {
  if (state.selected.has(id)) {
    state.selected.delete(id);
    showToast("採用解除しました");
  } else {
    state.selected.add(id);
    showToast("採用リストに追加しました");
  }
  renderSidebar();
  updateGlobalGridStates();
}

function updateGlobalGridStates() {
  document.querySelectorAll('.ds-global-grid [data-anchor]').forEach(card => {
    const items = CHECKLIST.filter(i => i.anchor === card.dataset.anchor);
    card.classList.toggle('is-selected', items.some(i => state.selected.has(i.id)));
  });
}

function attachGlobalGridEvents() {
  document.querySelectorAll('.ds-global-grid [data-anchor]').forEach(card => {
    card.addEventListener('click', () => {
      const items = CHECKLIST.filter(i => i.anchor === card.dataset.anchor);
      if (items.length === 0) return;
      const allSelected = items.every(i => state.selected.has(i.id));
      items.forEach(i => {
        if (allSelected) state.selected.delete(i.id);
        else state.selected.add(i.id);
      });
      showToast(allSelected ? "採用解除しました" : "採用リストに追加しました");
      renderSidebar();
      updateGlobalGridStates();
    });
  });
}

// ========== Navigation: find the right screen / device for an anchor ==========
function findAnchorLocation(anchorId, preferredScreen, preferredDevice) {
  // Returns {screen, device} where this anchor exists. Priority:
  //   1. preferredScreen in preferredDevice
  //   2. any screen in preferredDevice
  //   3. any screen in the other device
  if (!anchorId) return null;
  const sections = document.querySelectorAll('.screen[data-screen][data-device]');
  // Build index: anchor -> [{screen, device}, ...]
  const matches = [];
  sections.forEach(sec => {
    if (sec.querySelector(`[data-anchor="${anchorId}"]`)) {
      matches.push({ screen: sec.dataset.screen, device: sec.dataset.device });
    }
  });
  if (matches.length === 0) return null;
  // Priority 1
  const pri1 = matches.find(m => m.screen === preferredScreen && m.device === preferredDevice);
  if (pri1) return pri1;
  // Priority 2
  const pri2 = matches.find(m => m.device === preferredDevice);
  if (pri2) return pri2;
  // Priority 3
  return matches[0];
}

function navigateToItem(item) {
  if (!item) return;
  const anchorId = item.anchor;

  // Prefer a screen that's in the item's declared screens array AND has the anchor
  const sections = document.querySelectorAll('.screen[data-screen][data-device]');
  const availableMatches = [];
  sections.forEach(sec => {
    if (sec.querySelector(`[data-anchor="${anchorId}"]`)) {
      availableMatches.push({ screen: sec.dataset.screen, device: sec.dataset.device });
    }
  });

  if (availableMatches.length === 0) {
    showToast("ハイライト対象が見つかりません");
    return;
  }

  // Ranking: prefer current device > item's declared screens > already at current screen
  const inCurrentDeviceAndScreen = availableMatches.find(m =>
    m.device === state.device && m.screen === state.current && item.screens.includes(m.screen)
  );
  const inCurrentDeviceAndDeclared = availableMatches.find(m =>
    m.device === state.device && item.screens.includes(m.screen)
  );
  const inCurrentDevice = availableMatches.find(m => m.device === state.device);
  const inDeclared = availableMatches.find(m => item.screens.includes(m.screen));

  const target = inCurrentDeviceAndScreen
              || inCurrentDeviceAndDeclared
              || inCurrentDevice
              || inDeclared
              || availableMatches[0];

  // Device switch if needed
  if (target.device !== state.device) {
    state.device = target.device;
    applyDeviceClass();
    showToast(target.device === "mobile" ? "モバイル表示に切替" : "Web表示に切替");
  }

  // Screen switch if needed
  if (target.screen !== state.current) {
    switchScreen(target.screen);
  } else {
    // Still need to refresh visibility in case device changed
    $$(".screen").forEach(s => {
      s.hidden = !(s.dataset.screen === state.current && s.dataset.device === state.device);
    });
  }

  // After screen switch, scroll+highlight the anchor
  // Use a short timeout to let the DOM update + smooth scroll settle
  setTimeout(() => highlightAnchor(anchorId), target.screen !== state.current ? 350 : 50);
}

function highlightAnchor(anchorId) {
  if (!anchorId) return;
  const visible = document.querySelector(
    `.screen[data-screen="${state.current}"][data-device="${state.device}"]:not([hidden])`
  );
  if (!visible) return;

  // Prefer the element that is NOT inside a collapsed <details>
  // (so prominent UI like the ? FAB button is picked over a grid item in an accordion)
  const candidates = visible.querySelectorAll(`[data-anchor="${anchorId}"]`);
  if (candidates.length === 0) return;
  let el = null;
  for (const c of candidates) {
    const det = c.closest('details');
    if (!det || det.open) { el = c; break; }
  }
  if (!el) el = candidates[0];

  // Auto-open any ancestor <details> so content is visible before scrolling
  let p = el.parentElement;
  while (p) {
    if (p.tagName === "DETAILS" && !p.open) p.open = true;
    p = p.parentElement;
  }

  $$(".highlight-target").forEach(e => e.classList.remove("highlight-target"));
  // Scroll into view within the phone viewport (if mobile) or window (web)
  if (state.device === "mobile") {
    const scroller = visible.querySelector(".ios-scroll");
    if (scroller && scroller.contains(el)) {
      // Compute target Y relative to scroller
      const elRect = el.getBoundingClientRect();
      const scRect = scroller.getBoundingClientRect();
      const delta = elRect.top - scRect.top - 40;
      scroller.scrollTo({ top: scroller.scrollTop + delta, behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  setTimeout(() => {
    el.classList.add("highlight-target");
    setTimeout(() => el.classList.remove("highlight-target"), 2200);
  }, 260);
}

// ========== Export ==========
function exportExcel() {
  const items = CHECKLIST.filter(i => state.selected.has(i.id));
  if (items.length === 0) return;
  const header = ["No.", "分類", "分類", "R5緊急点検時No.", "内容", "要件定義\n・設計時", "画面デザイン\n・実装時", "フロントエンド\n更新（改修）時"];
  const rows = [header];
  items.forEach(i => {
    rows.push([i.no || "", i.category, i.subcategory, i.r5no || "", i.content, i.phase1, i.phase2, i.phase3]);
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [{wch:10},{wch:12},{wch:16},{wch:14},{wch:70},{wch:18},{wch:20},{wch:22}];
  ws["!rows"] = [{hpx: 44}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "UIチェックリスト");
  const d = new Date();
  const ymd = d.getFullYear() + String(d.getMonth()+1).padStart(2,"0") + String(d.getDate()).padStart(2,"0");
  XLSX.writeFile(wb, `custom_ui_checklist_${ymd}.xlsx`);
  showToast(`ダウンロードしました (${items.length}件)`);
}

// ========== Init ==========
document.addEventListener("DOMContentLoaded", () => {
  // Device toggle
  $$(".device-btn").forEach(btn => {
    btn.addEventListener("click", () => switchDevice(btn.dataset.device));
  });

  // Screen tabs
  $$(".screen-tab").forEach(tab => {
    tab.addEventListener("click", () => switchScreen(tab.dataset.screen));
  });

  // Mode buttons
  const modes = [["modeScreen","screen"],["modeAll","all"],["modeSelected","selected"]];
  modes.forEach(([id, m]) => {
    $("#" + id).addEventListener("click", () => {
      state.mode = m;
      modes.forEach(([mid, mm]) => {
        $("#" + mid).setAttribute("aria-pressed", mm === m ? "true" : "false");
      });
      renderSidebar();
    });
  });

  // Search
  $("#search").addEventListener("input", e => {
    state.query = e.target.value;
    renderSidebar();
  });

  // Export
  $("#exportBtn").addEventListener("click", exportExcel);

  // Clear
  $("#clearBtn").addEventListener("click", () => {
    if (!confirm("採用済みをすべて解除しますか？")) return;
    state.selected.clear();
    renderSidebar();
    showToast("解除しました");
  });

  // Initialize
  applyDeviceClass();
  switchScreen(SCREENS[0].id);
  attachGlobalGridEvents();
});
