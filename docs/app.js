async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

function escapeHTML(s) {
  return s.replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#39;");
}

/**
 * 입력 텍스트에 실제로 등장한 term만 골라서 "이번 글 전용" glossary를 만든다.
 * - 빠르고 재현 가능(실험 통제에 유리)
 * - 맥락(rule) 기반 확장은 여기서 추가 가능
 */
function generateGlossaryForText(text, baseGlossary) {
  const t = text ?? "";
  // term 앞뒤 공백/빈 term 방지
  const cleaned = (baseGlossary ?? [])
    .map(x => ({ ...x, term: (x.term ?? "").trim() }))
    .filter(x => x.term.length > 0);

  // 긴 term이 먼저 잡히게 길이 내림차순 정렬
  cleaned.sort((a, b) => b.term.length - a.term.length);

  // 단순 포함 여부로 필터링 (MVP)
  const used = [];
  for (const entry of cleaned) {
    if (t.includes(entry.term)) used.push(entry);
  }

  return used;
}

function buildReplacer(glossary) {
  const items = [...(glossary ?? [])].sort((a, b) => (b.term.length - a.term.length));
  if (items.length === 0) {
    // glossary가 비어도 안전하게 동작
    return (text) => escapeHTML(text ?? "").replaceAll("\n", "<br/>");
  }

  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = items.map(x => esc(x.term)).join("|");
  const re = new RegExp(pattern, "g");
  const map = new Map(items.map(x => [x.term, x]));

  return (text) => {
    const safe = escapeHTML(text ?? "");
    return safe
      .replace(re, (m) => {
        const it = map.get(m);
        const simple = escapeHTML(it?.simple ?? "");
        const def = escapeHTML(it?.definition ?? "");
        return `<span class="tooltip-term">${m}<span class="tooltip-box"><div class="tooltip-simple">${simple}</div><div class="tooltip-def">${def}</div></span></span>`;
      })
      .replaceAll("\n", "<br/>");
  };
}

let baseGlossary = []; // 전체 단어장(고정)
let replacer = null;

async function init() {
  const dict = await loadJSON("glossary.json");
  baseGlossary = dict.glossary ?? [];

  const input = document.getElementById("input");
  const viewer = document.getElementById("viewer");
  const toggle = document.getElementById("toggleTooltip");

  if (!toggle) {
    throw new Error('toggleTooltip element not found. Check index.html for id="toggleTooltip".');
  }

  const saved = localStorage.getItem("tooltipEnabled");
  if (saved !== null) toggle.checked = (saved === "true");

  function applyTooltipMode() {
    const enabled = toggle.checked;
    localStorage.setItem("tooltipEnabled", String(enabled));
    viewer.classList.toggle("tooltip-off", !enabled);

    const labelSpan = toggle.nextElementSibling;
    if (labelSpan) labelSpan.textContent = enabled ? "툴팁 ON" : "툴팁 OFF";
  }

  toggle.addEventListener("change", applyTooltipMode);
  applyTooltipMode();

  function renderText(text) {
    // ✅ 입력 텍스트를 기반으로 "이번 글 전용" glossary 재구성
    const tailoredGlossary = generateGlossaryForText(text, baseGlossary);

    // ✅ 그 glossary로 replacer 재생성
    replacer = buildReplacer(tailoredGlossary);

    // 렌더
    viewer.innerHTML = replacer(text);

    // 토글 상태 유지
    applyTooltipMode();

    // (선택) 디버그: 이번 글에서 사용된 term 개수 확인
    // console.log("tailored glossary size:", tailoredGlossary.length);
  }

  document.getElementById("apply").onclick = () => {
    renderText(input.value || "");
  };

  document.getElementById("loadSample").onclick = async () => {
    const res = await fetch("sample.txt");
    const text = await res.text();
    input.value = text;
    renderText(text);
  };
}

init().catch(err => {
  alert(err.message);
  console.error(err);
});
