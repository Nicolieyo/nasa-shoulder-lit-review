const { articles, guidance } = window.LITERATURE_DATA;

const els = {
  grid: document.querySelector("#article-grid"),
  matrix: document.querySelector("#matrix-panel"),
  matrixBody: document.querySelector("#matrix-body"),
  methods: document.querySelector("#method-grid"),
  template: document.querySelector("#article-template"),
  search: document.querySelector("#search"),
  theme: document.querySelector("#theme-filter"),
  priority: document.querySelector("#priority-filter"),
  contributor: document.querySelector("#contributor-filter"),
  sort: document.querySelector("#sort-filter"),
  clear: document.querySelector("#clear-filters"),
  results: document.querySelector("#results-count"),
  empty: document.querySelector("#empty-state"),
  cardView: document.querySelector("#card-view-button"),
  matrixView: document.querySelector("#matrix-view-button"),
  downloadMatrix: document.querySelector("#download-matrix")
};

const readKey = "nicole-literature-read";
const readArticles = new Set(JSON.parse(localStorage.getItem(readKey) || "[]"));
const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
let visibleArticles = [...articles];

function reviewFor(article) {
  return {
    citation: `${article["Article title"]} — ${article["Full authors"] || article["First author"]} (${article.Year})`,
    objective: article.Objective || "Not yet recorded",
    methods: article["Method / Hypothesis / Tools"] || "Not yet recorded",
    significance: article["Novelty / Significance"] || "Not yet recorded",
    gap: article["Limit / Gap"] || "Not yet recorded",
    highlights: article.Highlights || "Not yet recorded",
    keywords: article.Keywords || "Not yet recorded"
  };
}

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
  const contributor = els.contributor.value;

  let filtered = articles.filter(article => {
    const searchable = [
      article["Article title"], article["First author"], article.Theme,
      article["Evidence type"], article["Sensors / methods"],
      article["Why it matters for this project"], article["Best review section"],
       article.Contributor, article.Objective, article["Method / Hypothesis / Tools"],
       article["Novelty / Significance"], article["Limit / Gap"], article.Highlights, article.Keywords
    ].join(" ").toLowerCase();
    return (!query || searchable.includes(query))
      && (theme === "all" || article.Theme === theme)
      && (priority === "all" || priorityCode(article.Priority) === priority)
       && (contributor === "all" || article.Contributor === contributor);
  });

  filtered.sort((a, b) => {
    if (els.sort.value === "newest") return b.Year - a.Year;
    if (els.sort.value === "oldest") return a.Year - b.Year;
    if (els.sort.value === "title") return a["Article title"].localeCompare(b["Article title"]);
    return priorityCode(a.Priority).localeCompare(priorityCode(b.Priority)) || b.Year - a.Year;
  });

  visibleArticles = filtered;
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
    node.querySelector(".article-citation").textContent = `${article["Full authors"] || article["First author"]} · ${article.Year}`;
    node.querySelector(".contributor-chip").textContent = `${article.Contributor}'s Articles`;
    const review = reviewFor(article);
    node.querySelector(".review-objective").textContent = review.objective;
    node.querySelector(".review-methods").textContent = review.methods;
    node.querySelector(".review-significance").textContent = review.significance;
    node.querySelector(".review-gap").textContent = review.gap;
    node.querySelector(".review-highlights").textContent = review.highlights;
    node.querySelector(".review-keywords").textContent = review.keywords;
    node.querySelector(".verification-note").textContent = article["Citation completeness"] || "";
    node.querySelector(".access-badge").textContent = article.Access;
    const link = node.querySelector(".article-link");
    if (article["DOI / article link"]) {
      link.href = article["DOI / article link"];
      link.setAttribute("aria-label", `Open ${article["Article title"]} in a new tab`);
    } else {
      link.href = `https://scholar.google.com/scholar?q=${encodeURIComponent(article["Article title"])}`;
      link.textContent = "Find publication ↗";
      link.setAttribute("aria-label", `Search Google Scholar for ${article["Article title"]}`);
    }

    checkbox.checked = readArticles.has(id);
    card.classList.toggle("is-read", checkbox.checked);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) readArticles.add(id); else readArticles.delete(id);
      localStorage.setItem(readKey, JSON.stringify([...readArticles]));
      card.classList.toggle("is-read", checkbox.checked);
    });
    els.grid.append(node);
  });

  renderMatrix(filtered);

  els.results.textContent = filtered.length;
  els.empty.hidden = filtered.length !== 0;
}

function appendCell(row, label, value, className = "") {
  const cell = document.createElement("td");
  cell.dataset.label = label;
  if (className) cell.className = className;
  cell.textContent = value;
  row.append(cell);
  return cell;
}

function renderMatrix(filtered) {
  els.matrixBody.replaceChildren();
  filtered.forEach(article => {
    const review = reviewFor(article);
    const row = document.createElement("tr");
    const citationCell = appendCell(row, "Title / Authors / Year", "", "matrix-citation");
    const link = document.createElement("a");
    link.href = article["DOI / article link"] || `https://scholar.google.com/scholar?q=${encodeURIComponent(article["Article title"])}`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = article["Article title"];
    const citation = document.createElement("span");
    citation.textContent = `${article["Full authors"] || article["First author"]} · ${article.Year}`;
    citationCell.append(link, citation);
    appendCell(row, "Objective", review.objective);
    appendCell(row, "Method / Hypothesis / Tools", review.methods);
    appendCell(row, "Novelty / Significance", review.significance);
    appendCell(row, "Limit / Gap", review.gap);
    appendCell(row, "Highlights", review.highlights);
    appendCell(row, "Keywords", review.keywords, "matrix-keywords");
    els.matrixBody.append(row);
  });
}

function setView(view) {
  const showMatrix = view === "matrix";
  els.grid.hidden = showMatrix;
  els.matrix.hidden = !showMatrix;
  els.cardView.classList.toggle("is-active", !showMatrix);
  els.matrixView.classList.toggle("is-active", showMatrix);
  els.cardView.setAttribute("aria-pressed", String(!showMatrix));
  els.matrixView.setAttribute("aria-pressed", String(showMatrix));
  localStorage.setItem("nicole-literature-view", view);
}

function csvValue(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function downloadMatrix() {
  const headings = ["Title / Authors / Year", "Objective", "Method / Hypothesis / Tools", "Novelty / Significance", "Limit / Gap", "Highlights", "Keywords"];
  const rows = visibleArticles.map(article => {
    const review = reviewFor(article);
    return [review.citation, review.objective, review.methods, review.significance, review.gap, review.highlights, review.keywords];
  });
  const csv = [headings, ...rows].map(row => row.map(csvValue).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "shoulder-literature-review-matrix.csv";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  document.querySelector("#access-count").textContent = articles.filter(a => a.Contributor === "Nicole" && !!a["DOI / article link"]).length;

  [els.search, els.theme, els.contributor, els.priority, els.sort].forEach(input => input.addEventListener("input", renderArticles));
  els.clear.addEventListener("click", () => {
    els.search.value = "";
    els.theme.value = "all";
    els.priority.value = "all";
    els.contributor.value = "all";
    els.sort.value = "priority";
    renderArticles();
    els.search.focus();
  });
  els.cardView.addEventListener("click", () => setView("cards"));
  els.matrixView.addEventListener("click", () => setView("matrix"));
  els.downloadMatrix.addEventListener("click", downloadMatrix);

  renderArticles();
  renderGuidance();
  setView(localStorage.getItem("nicole-literature-view") === "matrix" ? "matrix" : "cards");
}

initialize();
