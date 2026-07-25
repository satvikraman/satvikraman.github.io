<script>
(() => {
  const root = document.querySelector('[data-portfolio-root="record"]');
  const homeStories = document.querySelector("[data-home-stories]");
  const homeProof = document.querySelector("[data-home-proof]");
  const atlasGrid = document.querySelector("[data-atlas-grid]");
  if (!root && !homeStories && !homeProof && !atlasGrid) return;

  const base = document.documentElement.dataset.siteRoot ||
    (window.location.pathname.includes("/projects/") ? ".." : "");
  const dataUrl = `${base}/assets/data/portfolio.json`.replace(/^\/\//, "/");

  const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    })[character]);

  const safeUrl = (url = "") => {
    if (/^https?:\/\//i.test(url)) return url;
    return `${base}/${url}`.replace(/([^:]\/)\/+/g, "$1");
  };

  const itemLink = (item, label = "Open case study") => {
    if (!item.atlasUrl) return "";
    return `<a class="record-link" href="${safeUrl(item.atlasUrl)}">${escapeHtml(label)} →</a>`;
  };

  const proofMarkup = (item) => `
    <a class="hero-proof" href="${safeUrl(item.atlasUrl || "record-en.html")}">
      <span>${escapeHtml(item.categoryLabel)}</span>
      <strong>${escapeHtml(item.outcome)}</strong>
    </a>`;

  const storyMarkup = (item) => `
    <article class="story-card">
      <p class="story-meta">${escapeHtml(item.categoryLabel)} · ${escapeHtml(item.year)}</p>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary)}</p>
      <div class="story-outcome">${escapeHtml(item.outcome)}</div>
      ${itemLink(item)}
    </article>`;

  const atlasMarkup = (item, index) => `
    <article class="atlas-card" data-methods="${escapeHtml(item.category)}">
      <div class="atlas-card-number">${String(index + 1).padStart(2, "0")}</div>
      <div>
        <p class="story-meta">${escapeHtml(item.categoryLabel)} · ${escapeHtml(item.year)}</p>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.summary)}</p>
      </div>
      <div class="atlas-card-proof">
        <span>${escapeHtml(item.status)}</span>
        <strong>${escapeHtml(item.outcome)}</strong>
        ${itemLink(item)}
      </div>
    </article>`;

  const evidenceMarkup = (item) => {
    if (!item.evidence?.length) return "";
    return `<div class="record-evidence">${item.evidence.map((evidence) =>
      `<a href="${safeUrl(evidence.url)}"${/^https?:/.test(evidence.url) ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(evidence.label)}</a>`
    ).join("")}</div>`;
  };

  const recordMarkup = (item) => `
    <details class="record-row" data-record-category="${escapeHtml(item.category)}">
      <summary>
        <span class="record-year">${escapeHtml(item.year)}</span>
        <span class="record-title">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.organization)}</small>
        </span>
        <span class="record-category">${escapeHtml(item.categoryLabel)}</span>
        <span class="record-status">${escapeHtml(item.status)}</span>
      </summary>
      <div class="record-detail">
        <div>
          <p class="record-role">${escapeHtml(item.role)}</p>
          <p>${escapeHtml(item.summary)}</p>
        </div>
        <div>
          <span class="panel-label">Outcome</span>
          <p><strong>${escapeHtml(item.outcome)}</strong></p>
          ${evidenceMarkup(item)}
          ${itemLink(item)}
        </div>
      </div>
    </details>`;

  const dataPromise = window.__PORTFOLIO_DATA__
    ? Promise.resolve(window.__PORTFOLIO_DATA__)
    : fetch(dataUrl).then((response) => {
        if (!response.ok) throw new Error(`Portfolio data unavailable (${response.status})`);
        return response.json();
      });

  dataPromise
    .then((data) => {
      const items = data.items.filter((item) => item.published);
      const byId = new Map(items.map((item) => [item.id, item]));

      if (homeProof) {
        homeProof.innerHTML = data.highlights.slice(0, 3)
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map(proofMarkup)
          .join("");
      }

      if (homeStories) {
        homeStories.innerHTML = data.featuredStories
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map(storyMarkup)
          .join("");
      }

      if (atlasGrid) {
        const atlasIds = [
          "gig-literacy", "literature-review", "tenacity", "stockengineering",
          "systematick", "icici-trading", "vernacular-chatbot", "bizkit", "bfc-football"
        ];
        atlasGrid.innerHTML = atlasIds
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map(atlasMarkup)
          .join("");
      }

      if (root) {
        const highlightRoot = root.querySelector("[data-record-highlights]");
        const ledgerRoot = root.querySelector("[data-record-ledger]");
        const countRoot = root.querySelector("[data-record-count]");
        const filters = [...root.querySelectorAll("[data-record-filter]")];

        highlightRoot.innerHTML = data.highlights
          .map((id) => byId.get(id))
          .filter(Boolean)
          .map(storyMarkup)
          .join("");
        ledgerRoot.innerHTML = items
          .sort((a, b) => a.priority - b.priority)
          .map(recordMarkup)
          .join("");

        const rows = [...ledgerRoot.querySelectorAll(".record-row")];
        const applyFilter = (category) => {
          let visible = 0;
          rows.forEach((row) => {
            const show = category === "all" || row.dataset.recordCategory === category;
            row.hidden = !show;
            if (show) visible += 1;
          });
          filters.forEach((button) => {
            const active = button.dataset.recordFilter === category;
            button.classList.toggle("is-active", active);
            button.setAttribute("aria-pressed", String(active));
          });
          countRoot.textContent = `${visible} ${visible === 1 ? "entry" : "entries"}`;
        };

        filters.forEach((button) =>
          button.addEventListener("click", () => applyFilter(button.dataset.recordFilter))
        );
        applyFilter("all");
      }

      document.dispatchEvent(new CustomEvent("portfolio:ready"));
    })
    .catch((error) => {
      [root, homeStories, homeProof, atlasGrid].filter(Boolean).forEach((element) => {
        element.innerHTML = `<p class="data-error">The portfolio record could not be loaded. ${escapeHtml(error.message)}</p>`;
      });
    });
})();
</script>
