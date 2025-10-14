"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * Query Provider otimizado - PLAN-006
 * Configurações de performance para TanStack Query
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Cache por 5 minutos (aumentado de 1 minuto)
            staleTime: 5 * 60 * 1000,

            // Garbage collection após 10 minutos
            gcTime: 10 * 60 * 1000,

            // Não refetch ao focar janela (melhora performance)
            refetchOnWindowFocus: false,

            // Refetch ao reconectar
            refetchOnReconnect: true,

            // Retry otimizado
            retry: (failureCount, error: unknown) => {
              // Don't retry on 4xx errors
              if (
                (error as { status?: number })?.status >= 400 &&
                (error as { status?: number })?.status < 500
              ) {
                return false;
              }
              // Apenas 1 retry em vez de 3
              return failureCount < 1;
            },

            // Retry delay de 1 segundo
            retryDelay: 1000,
          },
          mutations: {
            // Mutations não fazem retry
            retry: 0,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}