<script>
(() => {
  const initFilters = () => {
    const buttons = [...document.querySelectorAll(".filter-button")];
    const items = [...document.querySelectorAll("[data-methods]")];
    if (!buttons.length || !items.length) return false;

    const setFilter = (filter) => {
      buttons.forEach((button) => {
        const active = button.dataset.filter === filter;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", String(active));
      });

      items.forEach((item) => {
        const methods = (item.dataset.methods || "").split(" ");
        item.hidden = filter !== "all" && !methods.includes(filter);
      });

      const url = new URL(window.location);
      if (filter === "all") url.searchParams.delete("method");
      else url.searchParams.set("method", filter);
      history.replaceState({}, "", url);
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => setFilter(button.dataset.filter));
    });

    const initial = new URL(window.location).searchParams.get("method");
    setFilter(buttons.some((button) => button.dataset.filter === initial) ? initial : "all");
    return true;
  };

  if (!initFilters()) {
    document.addEventListener("portfolio:ready", initFilters, { once: true });
  }
})();
</script>
