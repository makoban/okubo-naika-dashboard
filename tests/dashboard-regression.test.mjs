import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadPreviewStore(initialEntries = []) {
  const values = new Map(initialEntries);
  const defaults = {
    topics: [{ id: "published-topic", status: "show", title: "公開中のお知らせ" }],
    fees: [{ id: "published-fee", status: "show", title: "公開中の案内" }],
  };
  const localStorage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
  const window = {
    OKUBO_REVIEW_DEFAULTS: plain(defaults),
    localStorage,
    crypto: { randomUUID: () => "test-uuid" },
  };
  const context = vm.createContext({
    console,
    document: { querySelector: () => null },
    window,
  });
  const filename = path.join(repositoryRoot, "preview", "review-store.js");
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });

  return { defaults, store: window.OKUBO_REVIEW_STORE, values };
}

function loadPreviewReview({ embedded }) {
  const appended = [];
  const document = {
    body: {
      append(node) {
        appended.push(node);
      },
    },
    createElement(tagName) {
      return {
        tagName,
        setAttribute(name, value) {
          this[name] = value;
        },
      };
    },
    querySelectorAll() {
      return [];
    },
  };
  const window = { OKUBO_TOPICS: [] };
  window.self = window;
  window.top = embedded ? {} : window;

  const context = vm.createContext({ document, window });
  const filename = path.join(repositoryRoot, "preview", "review.js");
  vm.runInContext(fs.readFileSync(filename, "utf8"), context, { filename });

  return appended;
}

test("preview store reports, saves, reads, and resets a browser draft", () => {
  const { defaults, store, values } = loadPreviewStore();
  const draft = {
    topics: [{ id: "draft-topic", status: "show", title: "下書き" }],
    fees: [{ id: "draft-fee", status: "hide", title: "非表示の下書き" }],
  };

  assert.equal(store.hasDraft(), false);
  assert.deepEqual(plain(store.get()), defaults);

  assert.deepEqual(plain(store.save(draft)), draft);
  assert.equal(store.hasDraft(), true);
  assert.deepEqual(plain(store.get()), draft);
  assert.ok(values.has(store.key));

  assert.deepEqual(plain(store.reset()), defaults);
  assert.equal(store.hasDraft(), false);
  assert.deepEqual(plain(store.get()), defaults);
  assert.equal(values.has(store.key), false);
});

test("preview store treats malformed saved data as no draft", () => {
  const storageKey = "okuboClinicPreviewContentV2";
  const { defaults, store } = loadPreviewStore([[storageKey, "{not-json"]]);

  assert.equal(store.hasDraft(), false);
  assert.deepEqual(plain(store.get()), defaults);
});

test("preview edit link never nests the dashboard inside its preview frame", () => {
  const embeddedNodes = loadPreviewReview({ embedded: true });
  assert.equal(
    embeddedNodes.some((node) => node.className === "review-admin-fab"),
    false,
    "the embedded preview must not show an edit link"
  );

  const standaloneNodes = loadPreviewReview({ embedded: false });
  const editLink = standaloneNodes.find((node) => node.className === "review-admin-fab");
  assert.ok(editLink, "the standalone preview should keep its edit link");
  assert.equal(editLink.href, "https://makoban.github.io/okubo-naika-dashboard/");
  assert.equal(editLink.target, "_top");
});

test("admin preview keeps the synchronous safe-window sequence and CMS limits", () => {
  const filename = path.join(repositoryRoot, "admin-preview.js");
  const source = fs.readFileSync(filename, "utf8");
  const safeWindowStart = source.indexOf("function openSafeWindow(url)");
  const safeWindowEnd = source.indexOf("function refreshPreview()", safeWindowStart);
  const safeWindowSource = source.slice(safeWindowStart, safeWindowEnd);

  assert.ok(safeWindowStart >= 0 && safeWindowEnd > safeWindowStart, "openSafeWindow must exist");
  const openIndex = safeWindowSource.indexOf('window.open("", "_blank")');
  const disownIndex = safeWindowSource.indexOf("nextWindow.opener = null");
  const navigateIndex = safeWindowSource.indexOf("nextWindow.location.replace(url)");
  assert.ok(openIndex >= 0, "the blank window must open synchronously");
  assert.ok(disownIndex > openIndex, "the new window must drop opener after opening");
  assert.ok(navigateIndex > disownIndex, "navigation must happen only after opener is cleared");
  assert.doesNotMatch(safeWindowSource, /\b(?:async|await|Promise)\b/);
  assert.match(source, /openSafeWindow\(cacheBustedUrl\(previewUrls\[activeSection\]\)\)/);
  assert.match(source, /const itemLimits\s*=\s*\{\s*topics:\s*20,\s*fees:\s*30\s*\}/);
  assert.match(
    source,
    /topics:\s*\{\s*date:\s*40,\s*label:\s*60,\s*title:\s*160,\s*body:\s*4000,\s*linkText:\s*100\s*\}/
  );
  assert.match(source, /fees:\s*\{\s*title:\s*200,\s*body:\s*12000\s*\}/);
  assert.match(source, /issueUrl\.length\s*>\s*60000/);
});

test("publishing binds the draft to the production revision and keeps credentials out of the page", () => {
  const source = fs.readFileSync(path.join(repositoryRoot, "admin-preview.js"), "utf8");
  const html = fs.readFileSync(path.join(repositoryRoot, "index.html"), "utf8");
  assert.match(source, /version:\s*2,\s*baseRevision:\s*window\.OKUBO_PUBLISHED_META\.revision/);
  assert.match(html, /https:\/\/www\.okubo-naika-cl\.com\/published-content\.php/);
  assert.doesNotMatch(html, /現行の公式サイトは直接変更しません|公開確認サイトへ反映する/);
  assert.doesNotMatch(source, /ghp_[A-Za-z0-9]+|github_pat_[A-Za-z0-9_]+|Bearer\s/);
});
