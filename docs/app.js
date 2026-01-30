async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

function escapeHTML(s) {
  return s.replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
          .replaceAll('"',"&quot;").replaceAll("'","&#39;");
}

function buildReplacer(glossary) {
  const items = [...glossary].sort((a,b) => (b.term.length - a.term.length));
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = items.map(x => esc(x.term)).join("|");
  const re = new RegExp(pattern, "g");
  const map = new Map(items.map(x => [x.term, x]));

  return (text) => {
    const safe = escapeHTML(text);
    return safe
      .replace(re, (m) => {
        const it = map.get(m);
        const simple = escapeHTML(it.simple ?? "");
        const def = escapeHTML(it.definition ?? "");
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

  document.getElementById("apply").onclick = () => {
    viewer.innerHTML = replacer(input.value || "");
  };

  document.getElementById("loadSample").onclick = async () => {
    const res = await fetch("sample.txt");
    input.value = await res.text();
    viewer.innerHTML = replacer(input.value);
  };
}

init().catch(err => {
  alert(err.message);
  console.error(err);
});
