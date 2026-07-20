const reactionPalettes = {
  call: ["#ff806f", "#ffe36e", "#52c7bd"],
  clock: ["#ffe36e", "#b9a7ff", "#52c7bd"],
  map: ["#52c7bd", "#ff806f", "#dff6ff"],
  shine: ["#b9a7ff", "#ffe36e", "#ff806f"],
  heart: ["#ff806f", "#ffe36e", "#52c7bd"],
};

function makeSpark(x, y, color, index) {
  const spark = document.createElement("span");
  const angle = (Math.PI * 2 * index) / 8;
  const distance = 34 + (index % 3) * 10;

  spark.className = "spark";
  spark.style.left = `${x}px`;
  spark.style.top = `${y}px`;
  spark.style.background = color;
  spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
  spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);

  document.body.appendChild(spark);
  window.setTimeout(() => spark.remove(), 680);
}

function popReaction(button, event) {
  const rect = button.getBoundingClientRect();
  const centerX = event.clientX || rect.left + rect.width / 2;
  const centerY = event.clientY || rect.top + rect.height / 2;
  const palette = reactionPalettes[button.dataset.reaction] || reactionPalettes.heart;

  button.classList.add("is-reacting");
  window.setTimeout(() => button.classList.remove("is-reacting"), 220);

  for (let i = 0; i < 8; i += 1) {
    makeSpark(centerX, centerY, palette[i % palette.length], i);
  }
}

document.querySelectorAll(".reaction-button").forEach((button) => {
  button.addEventListener("click", (event) => popReaction(button, event));
});

function createTopicCard(topic) {
  const card = document.createElement(topic.link ? "a" : "article");
  card.className = "topic-card";

  if (topic.link) {
    card.href = topic.link;
  }

  if (topic.image) {
    const image = document.createElement("img");
    image.className = "topic-image";
    image.src = topic.image;
    image.alt = "";
    card.append(image);
  }

  const meta = document.createElement("p");
  meta.className = "topic-meta";
  meta.textContent = [topic.date, topic.label].filter(Boolean).join(" / ");

  const title = document.createElement("h3");
  title.textContent = topic.title || "";

  const body = document.createElement("p");
  body.className = "topic-body";
  body.textContent = topic.body || "";

  card.append(meta, title, body);

  if (topic.link && topic.linkText) {
    const linkText = document.createElement("span");
    linkText.className = "topic-link-text";
    linkText.textContent = topic.linkText;
    card.append(linkText);
  }

  return card;
}

function renderTopics() {
  const list = document.querySelector("[data-topics-list]");
  if (!list) return;

  const topics = Array.isArray(window.OKUBO_TOPICS) ? window.OKUBO_TOPICS : [];
  const visibleTopics = topics.filter((topic) => topic.status !== "hide").slice(0, 6);

  list.replaceChildren();

  if (visibleTopics.length === 0) {
    const empty = document.createElement("p");
    empty.className = "topics-empty";
    empty.textContent = "現在掲載中のお知らせはありません。";
    list.append(empty);
    return;
  }

  visibleTopics.forEach((topic) => {
    list.append(createTopicCard(topic));
  });
}

renderTopics();
