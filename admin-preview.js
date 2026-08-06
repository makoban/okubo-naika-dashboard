(function () {
  const store = window.OKUBO_REVIEW_STORE;
  let state = store.get();
  let activeSection = "topics";

  const frame = document.querySelector("[data-preview-frame]");
  const previewTitle = document.querySelector("[data-preview-title]");
  const sourceStatus = document.querySelector("[data-source-status]");
  const reloadPublishedButton = document.querySelector("[data-reload-published]");
  const publishedSourceLoaded =
    window.OKUBO_REVIEW_SOURCE === "published" || window.OKUBO_REVIEW_DEFAULTS !== window.OKUBO_BUNDLED_DEFAULTS;
  const previewUrls = {
    topics: "./preview/index.html#topics-title",
    fees: "./preview/guide.html#fees",
  };
  const publishIssueUrl = "https://github.com/makoban/okubo-naika-renewal/issues/new";
  const itemLimits = { topics: 20, fees: 30 };
  const fieldLimits = {
    topics: { date: 40, label: 60, title: 160, body: 4000, linkText: 100 },
    fees: { title: 200, body: 12000 },
  };
  const topicLinkChoices = [
    ["", "リンクなし"],
    ["./index.html", "トップページ"],
    ["./guide.html#hours", "診療時間"],
    ["./access.html", "交通案内"],
    ["./doctor.html", "医師の紹介"],
    ["./guide.html", "医院案内"],
    ["./emergency.html", "院内緊急検査"],
    ["./endoscopy.html", "内視鏡検査"],
    ["./pylori.html", "ピロリ菌"],
  ];

  function createButton(label, action, className = "", accessibleLabel = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cms-small-button ${className}`.trim();
    button.textContent = label;
    button.dataset.itemAction = action;
    if (accessibleLabel) button.setAttribute("aria-label", accessibleLabel);
    return button;
  }

  function createField(labelText, item, key, options = {}) {
    const wrapper = document.createElement("div");
    wrapper.className = `cms-field${options.wide ? " wide" : ""}`;

    const label = document.createElement("label");
    label.textContent = labelText;
    wrapper.append(label);

    let control;
    if (options.type === "textarea") {
      control = document.createElement("textarea");
      control.rows = options.rows || 4;
    } else if (options.choices) {
      control = document.createElement("select");
      options.choices.forEach(([value, text]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        control.append(option);
      });
    } else {
      control = document.createElement("input");
      control.type = options.type || "text";
      if (options.placeholder) control.placeholder = options.placeholder;
    }

    control.value = item[key] || "";
    control.id = `cms-${String(item.id || "item").replace(/[^A-Za-z0-9_-]/g, "-")}-${key}`;
    label.htmlFor = control.id;
    if (options.maxLength && "maxLength" in control) control.maxLength = options.maxLength;
    control.dataset.field = key;
    control.addEventListener("input", () => {
      item[key] = control.value;
      if (key === "title") {
        const card = control.closest(".cms-item");
        const heading = card && card.querySelector(".cms-item-header strong");
        if (heading) heading.textContent = control.value || "名称未設定";
      }
    });
    control.addEventListener("change", () => {
      item[key] = control.value;
    });
    wrapper.append(control);

    if (options.help) {
      const help = document.createElement("small");
      help.className = "cms-help";
      help.id = `${control.id}-help`;
      help.textContent = options.help;
      control.setAttribute("aria-describedby", help.id);
      wrapper.append(help);
    }
    return wrapper;
  }

  function createItemCard(item, type, index) {
    const card = document.createElement("article");
    card.className = "cms-item";
    card.dataset.itemId = item.id;

    const header = document.createElement("header");
    header.className = "cms-item-header";
    const heading = document.createElement("strong");
    heading.textContent = item.title || "名称未設定";
    const controls = document.createElement("div");
    controls.className = "cms-item-controls";
    controls.append(
      createButton("↑", "up", "", "この項目を上へ移動"),
      createButton("↓", "down", "", "この項目を下へ移動"),
      createButton("削除", "delete", "danger", "この項目を削除")
    );
    header.append(heading, controls);
    card.append(header);

    const fields = document.createElement("div");
    fields.className = "cms-fields";
    fields.append(
      createField("表示状態", item, "status", {
        choices: [["show", "表示する"], ["hide", "非表示"]],
      })
    );

    if (type === "topics") {
      fields.append(
        createField("日付", item, "date", { placeholder: "2026.07.21", maxLength: fieldLimits.topics.date }),
        createField("分類", item, "label", { maxLength: fieldLimits.topics.label }),
        createField("見出し", item, "title", { wide: true, maxLength: fieldLimits.topics.title }),
        createField("本文", item, "body", { type: "textarea", wide: true, maxLength: fieldLimits.topics.body }),
        createField("リンク先", item, "link", {
          choices: topicLinkChoices,
          help: "サイト内のページから選択",
        }),
        createField("リンク文字", item, "linkText", { maxLength: fieldLimits.topics.linkText }),
        createField("表示色", item, "tone", {
          choices: [["normal", "通常"], ["important", "重要（淡いオレンジ）"], ["soft", "補足（グレー）"]],
          help: "通常版の配色を崩さない3種類に限定",
        }),
        createField("見出し書体", item, "font", {
          choices: [["gothic", "標準ゴシック"], ["mincho", "明朝"]],
          help: "見出しのみ2種類から選択",
        })
      );
    } else {
      fields.append(
        createField("項目名", item, "title", { wide: true, maxLength: fieldLimits.fees.title }),
        createField("本文", item, "body", { type: "textarea", wide: true, rows: 6, maxLength: fieldLimits.fees.body })
      );
    }

    card.append(fields);
    card.addEventListener("click", (event) => {
      const button = event.target.closest("[data-item-action]");
      if (!button) return;
      handleItemAction(type, index, button.dataset.itemAction);
    });
    return card;
  }

  function render(type) {
    const container = document.querySelector(`[data-items="${type}"]`);
    container.replaceChildren();
    state[type].forEach((item, index) => container.append(createItemCard(item, type, index)));
  }

  function renderAll() {
    render("topics");
    render("fees");
  }

  function handleItemAction(type, index, action) {
    const items = state[type];
    if (action === "up" && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    }
    if (action === "down" && index < items.length - 1) {
      [items[index + 1], items[index]] = [items[index], items[index + 1]];
    }
    if (action === "delete") {
      const title = items[index].title || "この項目";
      if (!window.confirm(`「${title}」を削除しますか？`)) return;
      items.splice(index, 1);
    }
    render(type);
  }

  function addItem(type) {
    if (state[type].length >= itemLimits[type]) {
      showMessage(`${type === "topics" ? "お知らせ" : "項目"}は${itemLimits[type]}件までです。`, "error");
      return;
    }

    if (type === "topics") {
      state.topics.push({
        id: store.makeId("topic"),
        status: "show",
        date: "",
        label: "お知らせ",
        title: "新しいお知らせ",
        body: "",
        link: "",
        linkText: "",
        tone: "normal",
        font: "gothic",
      });
    } else {
      state.fees.push({ id: store.makeId("fee"), status: "show", title: "新しい項目", body: "" });
    }
    render(type);
  }

  function cacheBustedUrl(url) {
    const [base, hash] = url.split("#");
    return `${base}?preview=${Date.now()}${hash ? `#${hash}` : ""}`;
  }

  function openSafeWindow(url) {
    const nextWindow = window.open("", "_blank");
    if (!nextWindow) return false;
    nextWindow.opener = null;
    nextWindow.location.replace(url);
    return true;
  }

  function refreshPreview() {
    frame.src = cacheBustedUrl(previewUrls[activeSection]);
  }

  function showMessage(text, type = "success") {
    document.querySelectorAll("[data-message]").forEach((element) => {
      element.textContent = element.closest(`[data-editor-panel="${activeSection}"]`) ? text : "";
      element.classList.toggle("is-error", type === "error" && Boolean(element.textContent));
    });
  }

  function updateSourceStatus() {
    const hasDraft = typeof store.hasDraft === "function" && store.hasDraft();
    sourceStatus.classList.remove("is-warning", "is-draft");

    if (!publishedSourceLoaded) {
      sourceStatus.textContent = hasDraft
        ? "このブラウザの下書きを表示中（公開データは取得できませんでした）"
        : "公開中のデータを取得できませんでした";
      sourceStatus.classList.add("is-warning");
      reloadPublishedButton.disabled = true;
      return;
    }

    reloadPublishedButton.disabled = false;
    if (hasDraft) {
      sourceStatus.textContent = "このブラウザに保存した下書きを表示中";
      sourceStatus.classList.add("is-draft");
      return;
    }

    sourceStatus.textContent = "公開中の最新データを表示中";
  }

  function saveDraft() {
    try {
      store.save(state);
      updateSourceStatus();
      return true;
    } catch (error) {
      showMessage("ブラウザへ保存できませんでした。空き容量や閲覧設定を確認してください。", "error");
      return false;
    }
  }

  function validationError() {
    for (const type of ["topics", "fees"]) {
      if (state[type].length > itemLimits[type]) {
        return `${type === "topics" ? "お知らせ" : "項目"}は${itemLimits[type]}件までです。`;
      }

      for (const [index, item] of state[type].entries()) {
        for (const [key, maxLength] of Object.entries(fieldLimits[type])) {
          if (String(item[key] || "").length > maxLength) {
            return `${index + 1}件目の「${key === "body" ? "本文" : key === "title" ? "見出し・項目名" : key}」が${maxLength}文字を超えています。`;
          }
        }
      }
    }
    return "";
  }

  function validateBeforeSave() {
    const error = validationError();
    if (!error) return true;
    showMessage(error, "error");
    return false;
  }

  function discardChanges() {
    if (!window.confirm("保存していない編集内容を取り消して、直前の保存状態に戻しますか？")) return;
    state = store.get();
    renderAll();
    showMessage("編集内容を取り消し、直前の保存状態に戻しました。");
    refreshPreview();
  }

  function previewChanges() {
    if (!validateBeforeSave() || !saveDraft()) return;
    showMessage("変更内容をブラウザ内に保存し、別画面でプレビューを開きました。");
    if (!openSafeWindow(cacheBustedUrl(previewUrls[activeSection]))) {
      showMessage("プレビューを開けませんでした。ポップアップを許可して、もう一度お試しください。", "error");
    }
  }

  function reloadPublishedContent() {
    if (!publishedSourceLoaded) {
      showMessage("公開中の内容を取得できていません。通信を確認してページを再読み込みしてください。", "error");
      return;
    }
    if (!window.confirm("ブラウザに保存した下書きを消して、公開確認サイトの最新内容を読み直しますか？")) return;
    try {
      state = store.reset();
    } catch (error) {
      showMessage("ブラウザの下書きを消せませんでした。閲覧設定を確認してください。", "error");
      return;
    }
    renderAll();
    updateSourceStatus();
    showMessage("公開確認サイトの最新内容を読み直しました。");
    refreshPreview();
  }

  function encodePublishData(value) {
    const bytes = new TextEncoder().encode(JSON.stringify(value));
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return window.btoa(binary);
  }

  function publishChanges() {
    if (!publishedSourceLoaded) {
      showMessage("公開中の内容を取得できていないため、反映を開始できません。ページを再読み込みしてください。", "error");
      return;
    }
    if (!validateBeforeSave()) return;

    const confirmed = window.confirm(
      "変更内容を保存し、GitHubの公開確認画面を開きます。\nGitHubで内容を送信すると、公開確認サイトの更新処理が始まります。"
    );
    if (!confirmed) return;

    if (!saveDraft()) return;
    const payload = encodePublishData({ version: 1, topics: state.topics, fees: state.fees });
    const issueBody = [
      "おおくぼ内科クリニックの公開確認サイト反映用データです。下記のデータは編集しないでください。",
      "",
      "<!-- OKUBO_CMS_DATA_BEGIN -->",
      payload,
      "<!-- OKUBO_CMS_DATA_END -->",
      "",
      "ダッシュボードから送信されました。",
    ].join("\n");
    const params = new URLSearchParams({
      title: `[CMS Publish] おおくぼ内科クリニック ${new Date().toLocaleString("ja-JP")}`,
      body: issueBody,
    });
    const issueUrl = `${publishIssueUrl}?${params.toString()}`;
    if (issueUrl.length > 60000) {
      showMessage("入力内容が多く、GitHub確認画面へ渡せません。長い本文を分けるか短くしてください。", "error");
      return;
    }

    if (!openSafeWindow(issueUrl)) {
      showMessage("GitHub確認画面を開けませんでした。ポップアップを許可して、もう一度お試しください。", "error");
      return;
    }
    showMessage("GitHubの確認画面を開きました。内容を送信すると公開処理が始まります。");
  }

  function switchSection(type) {
    activeSection = type;
    document.querySelectorAll("[data-cms-tab]").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.cmsTab === type));
      tab.tabIndex = tab.dataset.cmsTab === type ? 0 : -1;
    });
    document.querySelectorAll("[data-editor-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.editorPanel !== type;
    });
    previewTitle.textContent = type === "topics" ? "TOPの表示" : "診療報酬欄の表示";
    refreshPreview();
  }

  document.querySelectorAll("[data-cms-tab]").forEach((tab) => {
    tab.addEventListener("click", () => switchSection(tab.dataset.cmsTab));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const nextType = tab.dataset.cmsTab === "topics" ? "fees" : "topics";
      switchSection(nextType);
      document.querySelector(`[data-cms-tab="${nextType}"]`).focus();
    });
  });
  document.querySelectorAll("[data-add-item]").forEach((button) => {
    button.addEventListener("click", () => addItem(button.dataset.addItem));
  });
  document.querySelectorAll("[data-discard]").forEach((button) => button.addEventListener("click", discardChanges));
  document.querySelectorAll("[data-preview-new]").forEach((button) => button.addEventListener("click", previewChanges));
  document.querySelectorAll("[data-publish]").forEach((button) => button.addEventListener("click", publishChanges));
  reloadPublishedButton.addEventListener("click", reloadPublishedContent);

  updateSourceStatus();
  renderAll();
  switchSection(activeSection);
})();
