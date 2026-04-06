const fallbackIcon =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Crect width='24' height='24' fill='black'/%3E%3C/svg%3E";

const grid = document.querySelector("#bookmarks-grid");
const message = document.querySelector("#page-message");
const customCursor = document.querySelector("#custom-cursor");
const categoriesPanel = document.querySelector("#categories-panel");
const page = document.querySelector(".page");

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

const createBookmarkCard = (bookmark) => {
  const card = document.createElement("a");
  card.className = "bookmark-card";
  card.href = bookmark.url;
  card.target = "_blank";
  card.rel = "noreferrer noopener";
  card.title = bookmark.title;

  const inner = document.createElement("div");
  inner.className = "bookmark-card__inner";

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

  media.append(icon);
  inner.append(media, title);
  card.append(inner);
  return card;
};

const createCategorySection = (category, bookmarks) => {
  const section = document.createElement("section");
  section.className = "bookmark-category";

  const header = document.createElement("div");
  header.className = "bookmark-category__header";

  const title = document.createElement("h2");
  title.className = "bookmark-category__title";
  title.textContent = category;

  const categoryGrid = document.createElement("div");
  categoryGrid.className = "bookmarks-grid";
  categoryGrid.append(...bookmarks.map(createBookmarkCard));

  header.append(title);
  section.append(header, categoryGrid);
  return section;
};

const getCategoryOrderPrefix = (category) => {
  const match = category.match(/^(\d+)\s/);
  return match ? Number(match[1]) : null;
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

  const orderedCategories = Array.from(groups.keys()).sort((a, b) => {
    if (a === "General") {
      return -1;
    }

    if (b === "General") {
      return 1;
    }

    const prefixA = getCategoryOrderPrefix(a);
    const prefixB = getCategoryOrderPrefix(b);

    if (prefixA !== null && prefixB !== null && prefixA !== prefixB) {
      return prefixA - prefixB;
    }

    if (prefixA !== null && prefixB === null) {
      return -1;
    }

    if (prefixA === null && prefixB !== null) {
      return 1;
    }

    return a.localeCompare(b);
  });

  return orderedCategories.map((category) => ({
    key: category,
    title: getCategoryDisplayName(category),
    items: groups.get(category),
  }));
};

const renderBookmarks = (bookmarks) => {
  const sections = groupBookmarksByCategory(bookmarks).map((category) =>
    createCategorySection(category.title, category.items)
  );

  grid.replaceChildren(...sections);
};

const showMessage = (text) => {
  message.hidden = false;
  message.textContent = text;
};

const clearMessage = () => {
  message.hidden = true;
  message.textContent = "";
};

const setupSmoothScroll = () => {
  const canUseSmoothScroll =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    categoriesPanel &&
    page;

  if (!canUseSmoothScroll) {
    return;
  }

  let targetScrollY = categoriesPanel.scrollTop;
  let currentScrollY = categoriesPanel.scrollTop;
  let targetReveal = 0;
  let currentReveal = 0;
  let animationFrameId = 0;
  const maxReveal = 1;

  const syncReveal = () => {
    page.style.setProperty("--bottom-reveal", currentReveal.toFixed(4));
  };

  const maxScrollY = () =>
    Math.max(0, categoriesPanel.scrollHeight - categoriesPanel.clientHeight);

  const animateScroll = () => {
    // Light interpolation softens wheel scrolling without making it feel detached.
    currentScrollY += (targetScrollY - currentScrollY) * 0.14;
    currentReveal += (targetReveal - currentReveal) * 0.14;

    if (Math.abs(targetScrollY - currentScrollY) < 0.4) {
      currentScrollY = targetScrollY;
    }

    if (Math.abs(targetReveal - currentReveal) < 0.002) {
      currentReveal = targetReveal;
    }

    categoriesPanel.scrollTop = currentScrollY;
    syncReveal();

    if (currentScrollY !== targetScrollY || currentReveal !== targetReveal) {
      animationFrameId = requestAnimationFrame(animateScroll);
      return;
    }

    animationFrameId = 0;
  };

  categoriesPanel.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || event.deltaY === 0) {
        return;
      }

      event.preventDefault();

      const atBottom =
        targetScrollY >= maxScrollY() - 0.5 || categoriesPanel.scrollTop >= maxScrollY() - 0.5;
      const shouldReveal = event.deltaY > 0 && atBottom;
      const shouldHideRevealFirst = event.deltaY < 0 && targetReveal > 0;

      if (shouldReveal) {
        targetReveal = Math.min(maxReveal, targetReveal + event.deltaY / 240);
      } else if (shouldHideRevealFirst) {
        targetReveal = Math.max(0, targetReveal + event.deltaY / 240);
      } else {
        targetScrollY = Math.min(Math.max(targetScrollY + event.deltaY, 0), maxScrollY());
      }

      if (!animationFrameId) {
        currentScrollY = categoriesPanel.scrollTop;
        animationFrameId = requestAnimationFrame(animateScroll);
      }
    },
    { passive: false }
  );

  categoriesPanel.addEventListener("scroll", () => {
    if (!animationFrameId) {
      targetScrollY = categoriesPanel.scrollTop;
      currentScrollY = categoriesPanel.scrollTop;
    }
  });

  window.addEventListener("resize", () => {
    targetScrollY = Math.min(targetScrollY, maxScrollY());
    currentScrollY = Math.min(currentScrollY, maxScrollY());
  });

  syncReveal();
};

const setupCustomCursor = () => {
  const canUseCustomCursor =
    window.matchMedia("(hover: hover) and (pointer: fine)").matches && customCursor;

  if (!canUseCustomCursor) {
    return;
  }

  document.body.classList.add("custom-cursor-enabled");

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let currentX = targetX;
  let currentY = targetY;
  let isHoveringCard = false;
  let isPressingCard = false;

  const syncCursorState = () => {
    customCursor.classList.toggle("is-hover", isHoveringCard && !isPressingCard);
    customCursor.classList.toggle("is-pressed", isPressingCard);
  };

  const animate = () => {
    // Subtle interpolation keeps the cursor responsive while adding a soft trailing feel.
    currentX += (targetX - currentX) * 0.22;
    currentY += (targetY - currentY) * 0.22;

    customCursor.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  };

  document.addEventListener("pointermove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  document.addEventListener("pointerdown", (event) => {
    isPressingCard = Boolean(event.target.closest(".bookmark-card"));
    syncCursorState();
  });

  document.addEventListener("pointerup", () => {
    isPressingCard = false;
    syncCursorState();
  });

  document.addEventListener("pointerleave", () => {
    customCursor.style.opacity = "0";
  });

  document.addEventListener("pointerenter", () => {
    customCursor.style.opacity = "";
  });

  document.addEventListener("pointerover", (event) => {
    isHoveringCard = Boolean(event.target.closest(".bookmark-card"));
    syncCursorState();
  });

  document.addEventListener("pointerout", (event) => {
    if (!event.relatedTarget || !event.relatedTarget.closest(".bookmark-card")) {
      isHoveringCard = false;
      isPressingCard = false;
      syncCursorState();
    }
  });

  syncCursorState();
  requestAnimationFrame(animate);
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
setupSmoothScroll();
setupCustomCursor();
