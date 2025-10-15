import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export type ApiRequestOptions<U = any> = {
  method?: string;
  data?: U;
  headers?: Record<string, string>;
};

export async function apiRequest<T = any, U = any>(
  url: string,
  options?: ApiRequestOptions<U> | string,
  legacyData?: U
): Promise<T> {
  // Handle legacy function signature
  if (typeof options === 'string') {
    // Old signature: apiRequest(url, method, data)
    console.warn('Deprecated apiRequest signature. Please use object parameter form.');
    const method = options;
    
    return apiRequest(url, { method, data: legacyData });
  }
  
  const { method = 'GET', data, headers = {} } = options || {};
  
  const requestHeaders = {
    ...headers,
    ...(data ? { "Content-Type": "application/json" } : {})
  };
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
