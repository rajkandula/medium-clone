'use client';

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then(res => {
  if (!res.ok) throw new Error('Fetch failed');
  return res.json();
});

/**
 * Custom SWR hook with built-in error handling and pagination
 */
export function useSWRFetch(url, options = {}) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    url,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      ...options,
    }
  );

  return {
    data,
    error,
    isLoading,
    loading: isLoading, // alias: several pages destructure `loading`
    isValidating,
    mutate,
  };
}

/**
 * SWR hook for paginated data
 */
export function usePaginatedFetch(baseUrl, page = 1, limit = 10, filters = {}) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const url = `${baseUrl}?${params.toString()}`;
  return useSWRFetch(url);
}
