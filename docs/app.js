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

function buildReplacer(glossary) {
  const items = [...glossary].sort((a, b) => (b.term.length - a.term.length));
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = items.map(x => esc(x.term)).join("|");
  const re = new RegExp(pattern, "g");
  const map = new Map(items.map(x => [x.term, x]));

  return (text) => {
    const safe = escapeHTML(text);
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

let replacer = null;

async function init() {
  const dict = await loadJSON("glossary.json");
  replacer = buildReplacer(dict.glossary);

  const input = document.getElementById("input");
  const viewer = document.getElementById("viewer");
  const toggle = document.getElementById("toggleTooltip");

  // toggleTooltip이 HTML에 없으면(혹시 빼먹었을 때) 에러 메시지
  if (!toggle) {
    throw new Error('toggleTooltip element not found. Check index.html for id="toggleTooltip".');
  }

  // 저장된 상태 불러오기
  const saved = localStorage.getItem("tooltipEnabled");
  if (saved !== null) toggle.checked = (saved === "true");

  function applyTooltipMode() {
    const enabled = toggle.checked;
    localStorage.setItem("tooltipEnabled", String(enabled));

    // viewer에 클래스 붙여서 CSS로 툴팁 표시/숨김 제어
    viewer.classList.toggle("tooltip-off", !enabled);

    // 라벨 텍스트 업데이트 (label 안에 input 다음에 span이 있다고 가정)
    const labelSpan = toggle.nextElementSibling;
    if (labelSpan) labelSpan.textContent = enabled ? "툴팁 ON" : "툴팁 OFF";
  }

  // ✅ 토글 변경될 때마다 모드 적용
  toggle.addEventListener("change", applyTooltipMode);

  // ✅ 최초 로딩 시에도 모드 적용(중요!)
  applyTooltipMode();

  document.getElementById("apply").onclick = () => {
    viewer.innerHTML = replacer(input.value || "");
    // 텍스트를 새로 렌더링한 뒤에도 현재 모드 유지
    applyTooltipMode();
  };

  document.getElementById("loadSample").onclick = async () => {
    const res = await fetch("sample.txt");
    input.value = await res.text();
    viewer.innerHTML = replacer(input.value);
    // 샘플 로드 후에도 현재 모드 유지
    applyTooltipMode();
  };
}

init().catch(err => {
  alert(err.message);
  console.error(err);
});
