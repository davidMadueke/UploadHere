import { Toaster } from "@uploadhere/ui/components/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { useLayoutEffect } from "react";

import Header from "../components/header";
import { appearanceInitScript } from "../lib/appearance";
import { useAppearanceStore } from "../stores/appearance-store";

import appCss from "../index.css?url";

export interface RouterAppContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "UploadHere" },
      // Host and Performer links are secrets in the path. Keep them out of Referer headers
      // and search indexes.
      { name: "referrer", content: "no-referrer" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  component: RootDocument,
});

function RootDocument() {
  const accent = useAppearanceStore((state) => state.accent);
  const hydrate = useAppearanceStore((state) => state.hydrate);

  useLayoutEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <html lang="en" className="dark" data-accent={accent} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: appearanceInitScript }} />
      </head>
      <body>
        <div className="grid min-h-svh grid-rows-[auto_1fr]">
          <Header />
          <Outlet />
        </div>
        <Toaster richColors />
        {import.meta.env.DEV ? (
          <>
            <TanStackRouterDevtools position="bottom-left" />
            <ReactQueryDevtools position="bottom" buttonPosition="bottom-right" />
          </>
        ) : null}
        <Scripts />
      </body>
    </html>
  );
}
