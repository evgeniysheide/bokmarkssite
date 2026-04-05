const fallbackIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='black'/%3E%3C/svg%3E";
const hoverActionIcon =
  "data:image/svg+xml,%3Csvg preserveAspectRatio='none' width='100%25' height='100%25' overflow='visible' style='display%3A%20block%3B' viewBox='0%200%2016%2016' fill='none' xmlns='http%3A//www.w3.org/2000/svg'%3E%3Cpath d='M8.66667%207.33333L14.6667%201.33333M14.6667%201.33333H11.1042M14.6667%201.33333V4.89583' stroke='%23B8BED1' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M14.6667%208C14.6667%2011.1427%2014.6667%2012.714%2013.6904%2013.6904C12.714%2014.6667%2011.1427%2014.6667%208%2014.6667C4.8573%2014.6667%203.28595%2014.6667%202.30964%2013.6904C1.33333%2012.714%201.33333%2011.1427%201.33333%208C1.33333%204.8573%201.33333%203.28595%202.30964%202.30964C3.28595%201.33333%204.8573%201.33333%208%201.33333' stroke='%23B8BED1' stroke-linecap='round'/%3E%3C/svg%3E";

const grid = document.querySelector("#bookmarks-grid");
const message = document.querySelector("#page-message");

const getIconCandidates = (bookmark) => {
  const { origin, hostname } = new URL(bookmark.url);

  return [
    bookmark.icon,
    `${origin}/favicon.svg`,
    `${origin}/apple-touch-icon.png`,
    `${origin}/favicon.ico`,
    `https://icons.duckduckgo.com/ip3/${hostname}.ico`,
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

const createBookmarkCard = (bookmark) => {
  const card = document.createElement("a");
  card.className = "bookmark-card";
  card.href = bookmark.url;
  card.target = "_blank";
  card.rel = "noreferrer noopener";
  card.title = bookmark.title;

  const media = document.createElement("div");
  media.className = "bookmark-card__media";

  const icon = document.createElement("img");
  icon.className = "bookmark-card__favicon";
  icon.alt = "";
  icon.loading = "lazy";
  icon.referrerPolicy = "no-referrer";
  applyIconFallback(icon, getIconCandidates(bookmark));

  const title = document.createElement("p");
  title.className = "bookmark-card__title";
  title.textContent = bookmark.title;

  const action = document.createElement("img");
  action.className = "bookmark-card__action";
  action.src = hoverActionIcon;
  action.alt = "";

  media.append(icon);
  card.append(action, media, title);
  return card;
};

const renderBookmarks = (bookmarks) => {
  grid.replaceChildren(...bookmarks.map(createBookmarkCard));
};

const showMessage = (text) => {
  message.hidden = false;
  message.textContent = text;
};

const clearMessage = () => {
  message.hidden = true;
  message.textContent = "";
};

const loadBookmarks = async () => {
  try {
    const response = await fetch("/api/bookmarks", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const bookmarks = await response.json();
    const visibleBookmarks = bookmarks
      .filter((bookmark) => bookmark.hidden !== true && bookmark.url && bookmark.title)
      .sort((a, b) => {
        const orderA = Number.isFinite(a.order) ? a.order : Number.MAX_SAFE_INTEGER;
        const orderB = Number.isFinite(b.order) ? b.order : Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });

    clearMessage();
    renderBookmarks(visibleBookmarks);
  } catch (error) {
    console.error("Failed to load bookmarks", error);
    grid.replaceChildren();
    showMessage("Не удалось загрузить закладки. Попробуйте обновить страницу позже.");
  }
};

loadBookmarks();
