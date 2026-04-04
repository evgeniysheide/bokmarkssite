const bookmarks = [
  {
    url: "https://github.com/",
    title: "GitHub · Change is constant. GitHub keeps you ahead. · GitHub",
  },
  {
    url: "https://docs.craft.do/s/evgeniysheide--9eb6fc3b-a6d1-f8b9-3e26-d8a990db4c6c/f/PF-2.0--8c18d247-97f2-ab27-17b8-f4abc326ea7b",
    title: "Craft — A fresh take on documents",
  },
  {
    url: "https://clck.ru/?ysclid=mfpvrllrzf539809578",
    title: "Яндекс Кликер — Сокращение ссылок",
  },
  {
    url: "https://uicolors.app/generate/05ffe3",
    title: "Tailwind CSS Colors - All colors + Custom color generator",
  },
  {
    url: "https://docs.google.com/document/d/1F4nzaU14enuaZ-wtBfF5zHd8dmrFytmB0JVDMKOOzG4/edit",
    title: "Google Docs",
  },
  {
    url: "https://text.ru/seo?ysclid=m8hdwjdqmh83802607",
    title: "СЕО анализ текстов - проверка для SEO продвижения",
  },
  {
    url: "https://coolors.co/contrast-checker/112a46-acc8e5",
    title: "Color Contrast Checker - Coolors",
  },
  {
    url: "https://convertio.co/ru/?ysclid=m50tcpmb86931915430",
    title: "Convertio — Конвертер файлов",
  },
  {
    url: "https://www.freepik.com/app",
    title: "Freepik AI App - Create Images and Videos with AI",
  },
  {
    url: "https://elements.envato.com/",
    title: "Envato® | AI Tools and Unlimited Creative Assets",
  },
  {
    url: "https://generator-qr.com/",
    title: "QR Code Generator | High Quality Free QR Codes",
  },
  {
    url: "https://sora.chatgpt.com/explore",
    title: "Sora | Explore",
  },
  {
    url: "https://www.recraft.ai/projects",
    title: "Sign in to Recraft - Recraft",
  },
  {
    url: "https://www.perplexity.ai/?login-source=oneTapHome&login-new=false",
    title: "Perplexity",
  },
  {
    url: "https://www.midjourney.com/explore?tab=video_top",
    title: "Midjourney Explore",
  },
  {
    url: "https://www.graphicsfuel.com/category/icons/",
    title: "GraphicsFuel Icons",
  },
  {
    url: "https://iconmonstr.com/",
    title: "iconmonstr - Free simple icons for your next project",
  },
  {
    url: "https://feathericons.com/?query=clos",
    title: "Feather – Simply beautiful open source icons",
  },
  {
    url: "https://thenounproject.com/search/icons/?q=shield",
    title: "Search Icons | Noun Project",
  },
  {
    url: "https://type.today/en?group=sans_serif",
    title: "type.today",
  },
  {
    url: "https://typetype.org/fonts/",
    title: "All Fonts | Font styles catalogue | TypeType®",
  },
  {
    url: "https://www.paratype.ru/?ysclid=mmk9t2iaxp681498707",
    title: "Paratype",
  },
  {
    url: "https://fonts.google.com/",
    title: "Browse Fonts - Google Fonts",
  },
  {
    url: "https://yoursavi.com/",
    title: "Savi — Маркетинговые материалы для App Store",
  },
  {
    url: "https://ru.pinterest.com/",
    title: "Pinterest – Пинтерест",
  },
  {
    url: "https://www.landingfolio.com/",
    title: "The Best Landing Page Design Inspiration, Templates and More | Landingfolio",
  },
  {
    url: "https://land-book.com/",
    title: "Landbook - website design inspiration gallery",
  },
  {
    url: "https://dribbble.com/",
    title: "Dribbble - Discover the World’s Top Designers & Creative Professionals",
  },
  {
    url: "https://www.awwwards.com/",
    title: "Awwwards - Website Awards - Best Web Design Trends",
  },
  {
    url: "https://www.behance.net/",
    title: "Search Projects :: Photos, videos, logos, illustrations and branding :: Behance",
  },
  {
    url: "https://yoursavi.com/",
    title: "Savi — Маркетинговые материалы для App Store",
  },
];

const faviconUrl = (url) => {
  const { hostname } = new URL(url);
  return `https://icons.duckduckgo.com/ip3/${hostname}.ico`;
};

const grid = document.querySelector("#bookmarks-grid");

bookmarks.forEach((bookmark) => {
  const card = document.createElement("a");
  card.className = "bookmark-card";
  card.href = bookmark.url;
  card.target = "_blank";
  card.rel = "noreferrer noopener";
  card.title = bookmark.title;

  const icon = document.createElement("img");
  icon.className = "bookmark-card__icon";
  icon.src = faviconUrl(bookmark.url);
  icon.alt = "";
  icon.loading = "lazy";
  icon.referrerPolicy = "no-referrer";
  icon.addEventListener("error", () => {
    icon.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='8' fill='%23000'/%3E%3C/svg%3E";
  });

  const title = document.createElement("p");
  title.className = "bookmark-card__title";
  title.textContent = bookmark.title;

  card.append(icon, title);
  grid.append(card);
});
