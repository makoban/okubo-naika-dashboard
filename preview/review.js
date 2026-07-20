(function () {
  const adminLink = document.createElement("a");
  adminLink.className = "review-admin-fab";
  adminLink.href = "https://makoban.github.io/okubo-naika-dashboard/";
  adminLink.textContent = "編集画面";
  adminLink.setAttribute("aria-label", "確認用の編集画面を開く");
  document.body.append(adminLink);

  const visibleTopics = (window.OKUBO_TOPICS || []).filter((topic) => topic.status !== "hide").slice(0, 6);
  document.querySelectorAll(".topic-card").forEach((card, index) => {
    const topic = visibleTopics[index];
    if (!topic) return;
    card.classList.add(`topic-tone-${topic.tone || "normal"}`);
    card.classList.add(`topic-font-${topic.font || "gothic"}`);
  });

  const thumbnails = Array.from(document.querySelectorAll("[data-gallery-thumb]"));
  if (!thumbnails.length) return;

  const firstImage = thumbnails[0].querySelector("img");
  const dialog = document.createElement("dialog");
  dialog.className = "review-gallery-dialog";
  dialog.setAttribute("aria-label", "院内写真の拡大表示");

  const closeButton = document.createElement("button");
  closeButton.className = "review-gallery-close";
  closeButton.type = "button";
  closeButton.textContent = "×";
  closeButton.setAttribute("aria-label", "拡大表示を閉じる");

  const figure = document.createElement("figure");
  const largeImage = document.createElement("img");
  largeImage.src = firstImage.src;
  largeImage.alt = firstImage.alt;
  const caption = document.createElement("figcaption");
  figure.append(largeImage, caption);
  dialog.append(closeButton, figure);
  document.body.append(dialog);

  let lastTrigger = null;
  thumbnails.forEach((thumbnail) => {
    thumbnail.addEventListener("click", () => {
      const image = thumbnail.querySelector("img");
      const label = thumbnail.querySelector(".review-gallery-caption");
      lastTrigger = thumbnail;
      largeImage.src = image.src;
      largeImage.alt = image.alt;
      caption.textContent = label ? label.textContent : image.alt;
      dialog.showModal();
    });
  });

  closeButton.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    if (lastTrigger) lastTrigger.focus();
  });
})();
