(function () {
  const store = window.OKUBO_REVIEW_STORE;
  let state = store.get();
  let activeSection = "topics";

  const frame = document.querySelector("[data-preview-frame]");
  const previewTitle = document.querySelector("[data-preview-title]");
  const previewUrls = {
    topics: "./preview/index.html#topics-title",
    fees: "./preview/guide.html#fees",
  };
  const publishIssueUrl = "https://github.com/makoban/okubo-naika-renewal/issues/new";
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

  function createButton(label, action, className = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `cms-small-button ${className}`.trim();
    button.textContent = label;
    button.dataset.itemAction = action;
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
      help.textContent = options.help;
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
    controls.append(createButton("↑", "up"), createButton("↓", "down"), createButton("削除", "delete", "danger"));
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
        createField("日付", item, "date", { placeholder: "2026.07.21" }),
        createField("分類", item, "label"),
        createField("見出し", item, "title", { wide: true }),
        createField("本文", item, "body", { type: "textarea", wide: true }),
        createField("リンク先", item, "link", {
          choices: topicLinkChoices,
          help: "サイト内のページから選択",
        }),
        createField("リンク文字", item, "linkText"),
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
        createField("項目名", item, "title", { wide: true }),
        createField("本文", item, "body", { type: "textarea", wide: true, rows: 6 })
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

  function refreshPreview() {
    frame.src = cacheBustedUrl(previewUrls[activeSection]);
  }

  function showMessage(text) {
    document.querySelectorAll("[data-message]").forEach((element) => {
      element.textContent = element.closest(`[data-editor-panel="${activeSection}"]`) ? text : "";
    });
  }

  function saveDraft() {
    store.save(state);
  }

  function discardChanges() {
    if (!window.confirm("保存していない編集内容を取り消して、直前の保存状態に戻しますか？")) return;
    state = store.get();
    renderAll();
    showMessage("編集内容を取り消し、直前の保存状態に戻しました。");
    refreshPreview();
  }

  function previewChanges() {
    saveDraft();
    showMessage("変更内容をブラウザ内に保存し、別画面でプレビューを開きました。");
    window.open(cacheBustedUrl(previewUrls[activeSection]), "_blank", "noopener");
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
    const confirmed = window.confirm(
      "変更内容を保存し、GitHubの本番反映確認画面を開きます。\nGitHubで内容を送信すると公開処理が始まります。"
    );
    if (!confirmed) return;

    saveDraft();
    const payload = encodePublishData({ version: 1, topics: state.topics, fees: state.fees });
    const issueBody = [
      "おおくぼ内科クリニックの本番反映用データです。下記のデータは編集しないでください。",
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

    showMessage("GitHubの確認画面を開きました。内容を送信すると本番反映が始まります。");
    window.open(`${publishIssueUrl}?${params.toString()}`, "_blank", "noopener");
  }

  function switchSection(type) {
    activeSection = type;
    document.querySelectorAll("[data-cms-tab]").forEach((tab) => {
      tab.setAttribute("aria-selected", String(tab.dataset.cmsTab === type));
    });
    document.querySelectorAll("[data-editor-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.editorPanel !== type;
    });
    previewTitle.textContent = type === "topics" ? "TOPの表示" : "診療報酬欄の表示";
    refreshPreview();
  }

  document.querySelectorAll("[data-cms-tab]").forEach((tab) => {
    tab.addEventListener("click", () => switchSection(tab.dataset.cmsTab));
  });
  document.querySelectorAll("[data-add-item]").forEach((button) => {
    button.addEventListener("click", () => addItem(button.dataset.addItem));
  });
  document.querySelectorAll("[data-discard]").forEach((button) => button.addEventListener("click", discardChanges));
  document.querySelectorAll("[data-preview-new]").forEach((button) => button.addEventListener("click", previewChanges));
  document.querySelectorAll("[data-publish]").forEach((button) => button.addEventListener("click", publishChanges));

  renderAll();
})();
