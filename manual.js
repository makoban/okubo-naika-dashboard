(function () {
  const dialog = document.querySelector("[data-manual-dialog]");
  const dialogImage = document.querySelector("[data-manual-dialog-image]");
  const dialogCaption = document.querySelector("[data-manual-dialog-caption]");
  const closeButton = document.querySelector("[data-manual-close]");
  let lastTrigger = null;

  if (!dialog || !dialogImage || !dialogCaption || !closeButton) return;

  document.querySelectorAll("[data-manual-zoom]").forEach((button) => {
    button.addEventListener("click", () => {
      const thumbnail = button.querySelector("img");
      lastTrigger = button;
      dialogImage.src = button.dataset.fullSrc || thumbnail.src;
      dialogImage.alt = thumbnail.alt;
      dialogCaption.textContent = button.dataset.caption || "";
      dialog.showModal();
      closeButton.focus();
    });
  });

  function closeDialog() {
    if (dialog.open) dialog.close();
  }

  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeDialog();
  });
  dialog.addEventListener("close", () => {
    dialogImage.removeAttribute("src");
    if (lastTrigger) lastTrigger.focus();
  });
})();
