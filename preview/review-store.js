(function () {
  const STORAGE_KEY = "okuboClinicPreviewContentV2";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const defaults = clone(window.OKUBO_REVIEW_DEFAULTS || { topics: [], fees: [] });

  function normalize(value) {
    if (!value || !Array.isArray(value.topics) || !Array.isArray(value.fees)) {
      return clone(defaults);
    }

    return {
      topics: value.topics.filter(Boolean),
      fees: value.fees.filter(Boolean),
    };
  }

  function readDraft() {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (!parsed || !Array.isArray(parsed.topics) || !Array.isArray(parsed.fees)) return null;
      return normalize(parsed);
    } catch (error) {
      return null;
    }
  }

  function read() {
    return readDraft() || clone(defaults);
  }

  function save(value) {
    const normalized = normalize(value);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return clone(normalized);
  }

  function reset() {
    window.localStorage.removeItem(STORAGE_KEY);
    return clone(defaults);
  }

  function renderFees(fees) {
    const list = document.querySelector("[data-fee-list]");
    if (!list) return;

    list.replaceChildren();
    fees
      .filter((fee) => fee.status !== "hide")
      .forEach((fee) => {
        const details = document.createElement("details");
        details.className = "fee-item-quiet";

        const summary = document.createElement("summary");
        summary.textContent = fee.title || "名称未設定";
        details.append(summary);

        const content = document.createElement("div");
        content.className = "fee-item-content";
        String(fee.body || "")
          .split(/\n\s*\n/)
          .filter(Boolean)
          .forEach((paragraph) => {
            const element = document.createElement("p");
            element.textContent = paragraph;
            content.append(element);
          });
        details.append(content);
        list.append(details);
      });
  }

  const state = read();
  window.OKUBO_TOPICS = state.topics;
  window.OKUBO_REVIEW_STORE = {
    key: STORAGE_KEY,
    defaults: clone(defaults),
    get: read,
    hasDraft() {
      return readDraft() !== null;
    },
    save,
    reset,
    makeId(prefix) {
      if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return `${prefix}-${window.crypto.randomUUID()}`;
      }
      return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    },
  };

  renderFees(state.fees);
})();
