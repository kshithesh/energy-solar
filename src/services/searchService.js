// Generic search service that calls an external API using Vite envs
// Configure these in a .env file at project root:
// VITE_SEARCH_API_URL=https://api.example.com/search
// VITE_SEARCH_API_KEY=your_key_here

export async function searchExternalApi(query) {
  const baseUrl = import.meta.env.VITE_SEARCH_API_URL;
  const apiKey = import.meta.env.VITE_SEARCH_API_KEY;

  if (!baseUrl) {
    // Graceful fallback if not configured: return empty to trigger empty-state UI
    return [];
  }

  const url = new URL(baseUrl);
  // Common query param name fallback
  if (!url.searchParams.has("q")) {
    url.searchParams.set("q", query);
  } else {
    // If API URL already contains q, we still append for safety
    url.searchParams.set("q", query);
  }

  const headers = {};
  if (apiKey) {
    // Try common header names; many APIs accept one of these
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["x-api-key"] = apiKey;
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const data = await response.json().catch(() => ({}));

  // Normalize to an array of items with id/title/description/url if possible
  const rawItems = Array.isArray(data)
    ? data
    : data.items || data.results || data.data || [];

  return rawItems.map((item, index) => {
    const id = item.id || item.uuid || item._id || index;
    const title = item.title || item.name || item.heading || item.label || "Untitled";
    const description = item.description || item.summary || item.snippet || "";
    const url = item.url || item.link || item.href || null;
    return { id, title, description, url, raw: item };
  });
}


