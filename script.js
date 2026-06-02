const fallbackIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='black'/%3E%3C/svg%3E";

const categoriesGrid = document.querySelector("#categories-grid");
const message = document.querySelector("#page-message");
const bookmarksCount = document.querySelector("#bookmarks-count");
let currentBookmarks = [];
let currentColumnCount = 0;
const isLocalFileMode = window.location.protocol === "file:";

const getIconCandidates = (bookmark) => {
  const { origin, hostname } = new URL(bookmark.url);

  return [
    bookmark.icon,
    `${origin}/favicon.svg`,
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
    `${origin}/apple-touch-icon.png`,
    `${origin}/favicon.ico`,
    fallbackIcon,
  ].filter(Boolean);
};

const applyIconFallback = (img, sources) => {
  let index = 0;

  const loadNext = () => {
    img.src = sources[index] || fallbackIcon;
  };

  img.addEventListener("error", () => {
    if (index >= sources.length - 1) {
      img.src = fallbackIcon;
      return;
    }

    index += 1;
    loadNext();
  });

  loadNext();
};

const getCategoryDisplayName = (category) => {
  if (category === "General") {
    return "General";
  }

  return category.replace(/^\d+\s/, "");
};

const groupBookmarksByCategory = (bookmarks) => {
  const groups = new Map();

  for (const bookmark of bookmarks) {
    const category = bookmark.category || "General";

    if (!groups.has(category)) {
      groups.set(category, []);
    }

    groups.get(category).push(bookmark);
  }

  return Array.from(groups, ([category, items]) => ({
    key: category,
    title: getCategoryDisplayName(category),
    items,
  }));
};

const getCategorySortOrder = (category) => {
  if (category.key === "General") {
    return -1;
  }

  const match = category.key.match(/^(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
};

const sortCategoriesByPrefix = (categories) =>
  categories.slice().sort((a, b) => {
    const orderA = getCategorySortOrder(a);
    const orderB = getCategorySortOrder(b);

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.key.localeCompare(b.key);
  });

const createBookmarkRow = (bookmark) => {
  const row = document.createElement("a");
  row.className = "bookmark-row";
  row.href = bookmark.url;
  row.target = "_blank";
  row.rel = "noreferrer noopener";
  row.title = bookmark.title;

  const iconArea = document.createElement("span");
  iconArea.className = "bookmark-row__favicon-area";

  const iconContainer = document.createElement("span");
  iconContainer.className = "bookmark-row__favicon-container";

  const icon = document.createElement("img");
  icon.className = "bookmark-row__favicon";
  icon.alt = "";
  icon.loading = "lazy";
  icon.referrerPolicy = "no-referrer";
  applyIconFallback(icon, getIconCandidates(bookmark));

  const content = document.createElement("span");
  content.className = "bookmark-row__content";

  const title = document.createElement("span");
  title.className = "bookmark-row__title";
  title.textContent = bookmark.title;

  const action = document.createElement("span");
  action.className = "bookmark-row__action";
  action.setAttribute("aria-hidden", "true");

  content.append(title, action);
  iconContainer.append(icon);
  iconArea.append(iconContainer);
  row.append(iconArea, content);
  return row;
};

const createCategoryCard = (category) => {
  const card = document.createElement("section");
  card.className = "category-card";

  const title = document.createElement("h2");
  title.className = "category-card__title";
  title.textContent = category.title;

  const list = document.createElement("div");
  list.className = "category-card__list";
  list.append(...category.items.map(createBookmarkRow));

  card.append(title, list);
  return card;
};

const getColumnCount = () => {
  if (window.matchMedia("(max-width: 560px)").matches) {
    return 1;
  }

  if (window.matchMedia("(max-width: 860px)").matches) {
    return 2;
  }

  if (window.matchMedia("(max-width: 1180px)").matches) {
    return 3;
  }

  return 4;
};

const createCategoryColumns = (categories, columnCount) => {
  const columns = Array.from({ length: columnCount }, () => {
    const column = document.createElement("div");
    column.className = "category-column";
    return column;
  });

  categories.forEach((category, index) => {
    columns[index % columnCount].append(createCategoryCard(category));
  });

  return columns;
};

const renderBookmarks = (bookmarks) => {
  const categories = sortCategoriesByPrefix(groupBookmarksByCategory(bookmarks));
  const columnCount = getColumnCount();
  const columns = createCategoryColumns(categories, columnCount);

  currentBookmarks = bookmarks;
  currentColumnCount = columnCount;
  bookmarksCount.textContent = bookmarks.length;
  categoriesGrid.replaceChildren(...columns);
};

const showMessage = (text) => {
  message.hidden = false;
  message.textContent = text;
};

const clearMessage = () => {
  message.hidden = true;
  message.textContent = "";
};

const normalizeBookmarks = (bookmarks) =>
  bookmarks
    .filter((bookmark) => bookmark.hidden !== true && bookmark.url && bookmark.title)
    .sort((a, b) => {
      const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });

const loadLocalMockBookmarks = () =>
  new Promise((resolve, reject) => {
    if (Array.isArray(window.__BOOKMARKS_MOCK__)) {
      resolve(window.__BOOKMARKS_MOCK__);
      return;
    }

    const script = document.createElement("script");
    script.src = "./mock-bookmarks.local.js";
    script.async = true;

    script.addEventListener("load", () => {
      if (Array.isArray(window.__BOOKMARKS_MOCK__)) {
        resolve(window.__BOOKMARKS_MOCK__);
        return;
      }

      reject(new Error("mock-bookmarks.local.js loaded, but __BOOKMARKS_MOCK__ is missing"));
    });

    script.addEventListener("error", () => {
      reject(new Error("mock-bookmarks.local.js not found"));
    });

    document.head.append(script);
  });

const loadBookmarks = async () => {
  try {
    const bookmarks = isLocalFileMode
      ? await loadLocalMockBookmarks()
      : await fetch("/api/bookmarks", {
          headers: { Accept: "application/json" },
        }).then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          return response.json();
        });

    const visibleBookmarks = normalizeBookmarks(bookmarks);

    clearMessage();
    renderBookmarks(visibleBookmarks);
  } catch (error) {
    console.error("Failed to load bookmarks", error);
    bookmarksCount.textContent = "0";
    categoriesGrid.replaceChildren();
    showMessage(
      isLocalFileMode
        ? "Для локального предпросмотра добавьте файл mock-bookmarks.local.js рядом с index.html."
        : "Не удалось загрузить закладки. Попробуйте обновить страницу позже."
    );
  }
};

loadBookmarks();

window.addEventListener("resize", () => {
  const columnCount = getColumnCount();

  if (currentBookmarks.length === 0 || columnCount === currentColumnCount) {
    return;
  }

  renderBookmarks(currentBookmarks);
});
