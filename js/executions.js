(function () {
  function render() {
    const root = document.getElementById("commonExecutionsTable");
    if (!root) return;
    const rows = (FH_DATA.executions || []).filter((item) => !item.hiddenOnExecutionsPage);
    root.innerHTML = FH_EXECUTIONS_TABLE.render(rows, { search: true });
    FH_EXECUTIONS_TABLE.init(root);
    FH.scrollToHash?.();
  }

  function init() {
    if (!document.getElementById("commonExecutionsTable")) return;
    render();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
