"use client";

import { Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import CommandBar from "@/components/bloomberg/layout/CommandBar";
import PanelWorkspace from "@/components/bloomberg/layout/PanelWorkspace";
import HelpOverlay from "@/components/bloomberg/layout/HelpOverlay";

export default function Home() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,
            gcTime: 1000 * 60 * 60,
            refetchOnWindowFocus: true,
            retry: 3,
          },
        },
      })
  );

  return (
    <Provider>
      <QueryClientProvider client={queryClient}>
        <div className="h-screen w-screen overflow-hidden" style={{ backgroundColor: "var(--terminal-bg)" }}>
          <CommandBar />
          <PanelWorkspace />
          <HelpOverlay />
        </div>
      </QueryClientProvider>
    </Provider>
  );
}
