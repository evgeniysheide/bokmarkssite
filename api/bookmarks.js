const NOTION_API_URL = "https://api.notion.com/v1/data_sources";
const NOTION_VERSION = "2025-09-03";

const getTitle = (property) =>
  property?.type === "title"
    ? property.title.map((item) => item.plain_text).join("").trim()
    : "";

const getUrl = (property) => (property?.type === "url" ? property.url || "" : "");

const getVisible = (property) =>
  property?.type === "checkbox" ? property.checkbox === true : false;

const getOrder = (property) =>
  property?.type === "number" && typeof property.number === "number" ? property.number : null;

const mapBookmark = (page) => {
  const properties = page.properties || {};

  return {
    title: getTitle(properties.Title),
    url: getUrl(properties.URL),
    visible: getVisible(properties.Visible),
    order: getOrder(properties.Order),
  };
};

const queryNotionBookmarks = async (token, dataSourceId) => {
  const bookmarks = [];
  let nextCursor;

  do {
    const response = await fetch(`${NOTION_API_URL}/${dataSourceId}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify({
        page_size: 100,
        start_cursor: nextCursor,
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Notion API error ${response.status}: ${details}`);
    }

    const data = await response.json();
    const pages = Array.isArray(data.results) ? data.results : [];

    bookmarks.push(...pages.filter((page) => page.object === "page").map(mapBookmark));
    nextCursor = data.has_more ? data.next_cursor : null;
  } while (nextCursor);

  return bookmarks;
};

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  const dataSourceId = process.env.NOTION_DATA_SOURCE_ID;

  if (!token || !dataSourceId) {
    return res.status(500).json({ error: "Missing Notion environment variables" });
  }

  try {
    const bookmarks = await queryNotionBookmarks(token, dataSourceId);
    return res.status(200).json(bookmarks);
  } catch (error) {
    console.error("Failed to load bookmarks from Notion", error);
    return res.status(500).json({ error: "Failed to load bookmarks" });
  }
};
