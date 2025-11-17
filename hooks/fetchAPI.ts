const INDEXER_BASE_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "https://base-sepolia-indexer.scalex.money/api";

// Generic fetch function with error handling
export async function fetchAPI<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${INDEXER_BASE_URL}${endpoint}`);

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
