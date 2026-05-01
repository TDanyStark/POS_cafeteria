import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 0, // always refetch when navigating back to a view
      refetchOnWindowFocus: true,
    },
  },
})
