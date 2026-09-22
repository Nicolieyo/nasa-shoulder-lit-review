const { articles, guidance } = window.LITERATURE_DATA;

const els = {
  grid: document.querySelector("#article-grid"),
  methods: document.querySelector("#method-grid"),
  template: document.querySelector("#article-template"),
  search: document.querySelector("#search"),
  theme: document.querySelector("#theme-filter"),
  priority: document.querySelector("#priority-filter"),
  sort: document.querySelector("#sort-filter"),
  clear: document.querySelector("#clear-filters"),
  results: document.querySelector("#results-count"),
  empty: document.querySelector("#empty-state")
};

const readKey = "nicole-literature-read";
const readArticles = new Set(JSON.parse(localStorage.getItem(readKey) || "[]"));
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function priorityCode(value) {
  if (value.startsWith("A")) return "A";
  if (value.startsWith("B")) return "B";
  return "C";
}

function priorityLabel(value) {
  return value.replace(/^A\s*[–-]\s*/, "").replace(/^B\s*[–-]\s*/, "").replace(/^C\s*[–-]\s*/, "");
}

function renderArticles() {
  const query = els.search.value.trim().toLowerCase();
  const theme = els.theme.value;
  const priority = els.priority.value;

  let filtered = articles.filter(article => {
    const searchable = [
      article["Article title"], article["First author"], article.Theme,
      article["Evidence type"], article["Sensors / methods"],
      article["Why it matters for this project"], article["Best review section"]
    ].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (theme === "all" || article.Theme === theme)
      && (priority === "all" || priorityCode(article.Priority) === priority);
  });

  filtered.sort((a, b) => {
    if (els.sort.value === "newest") return b.Year - a.Year;
    if (els.sort.value === "oldest") return a.Year - b.Year;
    if (els.sort.value === "title") return a["Article title"].localeCompare(b["Article title"]);
    return priorityCode(a.Priority).localeCompare(priorityCode(b.Priority)) || b.Year - a.Year;
  });

  els.grid.replaceChildren();
  filtered.forEach(article => {
    const node = els.template.content.cloneNode(true);
    const card = node.querySelector(".article-card");
    const id = slug(`${article["First author"]}-${article.Year}-${article["Article title"]}`);
    const pCode = priorityCode(article.Priority);
    const checkbox = node.querySelector("input[type=checkbox]");

    node.querySelector(".priority-badge").textContent = priorityLabel(article.Priority);
    node.querySelector(".priority-badge").classList.add(`priority-${pCode.toLowerCase()}`);
    node.querySelector(".article-theme").textContent = article.Theme;
    node.querySelector("h3").textContent = article["Article title"];
    node.querySelector(".article-citation").textContent = `${article["First author"]} · ${article.Year}`;
    node.querySelector(".article-evidence").textContent = article["Evidence type"];
    node.querySelector(".article-method").textContent = article["Sensors / methods"];
    node.querySelector(".relevance p").textContent = article["Why it matters for this project"];
    node.querySelector(".access-badge").textContent = article.Access;
    const link = node.querySelector(".article-link");
    link.href = article["DOI / article link"];
    link.setAttribute("aria-label", `Open ${article["Article title"]} in a new tab`);

    checkbox.checked = readArticles.has(id);
    card.classList.toggle("is-read", checkbox.checked);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) readArticles.add(id); else readArticles.delete(id);
      localStorage.setItem(readKey, JSON.stringify([...readArticles]));
      card.classList.toggle("is-read", checkbox.checked);
    });
    els.grid.append(node);
  });

  els.results.textContent = filtered.length;
  els.empty.hidden = filtered.length !== 0;
}

function renderGuidance() {
  guidance.forEach(item => {
    const card = document.createElement("article");
    card.className = "method-card";
    if (item["Review status"] === "Preprint") card.classList.add("preprint");

    const source = document.createElement("p");
    source.className = "source-type";
    source.textContent = item["Source type"];
    const title = document.createElement("h3");
    title.textContent = item.Title;
    const meta = document.createElement("p");
    meta.className = "method-meta";
    meta.textContent = `${item["Method / topic"]} · ${item["Author / agency"]} · ${item.Year}`;
    const use = document.createElement("p");
    use.className = "method-use";
    use.textContent = item["How to use it"];
    const link = document.createElement("a");
    link.href = item.Link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View source ↗";
    card.append(source, title, meta, use, link);
    els.methods.append(card);
  });
}

function initialize() {
  const themes = [...new Set(articles.map(article => article.Theme))].sort();
  themes.forEach(theme => {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = theme;
    els.theme.append(option);
  });

  document.querySelector("#article-count").textContent = articles.length;
  document.querySelector("#priority-count").textContent = articles.filter(a => priorityCode(a.Priority) === "A").length;
  document.querySelector("#access-count").textContent = articles.filter(a => !a.Access.toLowerCase().includes("needed")).length;

  [els.search, els.theme, els.priority, els.sort].forEach(input => input.addEventListener("input", renderArticles));
  els.clear.addEventListener("click", () => {
    els.search.value = "";
    els.theme.value = "all";
    els.priority.value = "all";
    els.sort.value = "priority";
    renderArticles();
    els.search.focus();
  });

  renderArticles();
  renderGuidance();
}

initialize();
