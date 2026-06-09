import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import { GA_MEASUREMENT_ID } from "@/lib/core/platform";

import appCss from "../styles.css?url";
import { WifiOff, RefreshCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { SmoothScroll } from "@/components/common/SmoothScroll";
import { CustomCursor } from "@/components/common/CustomCursor";
import { ErrorReporter } from "@/components/error/ErrorReporter";
import { GlobalErrorListener } from "@/components/error/GlobalErrorListener";
import { CookieBanner } from "@/components/common/CookieBanner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const router = useRouter();

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false);
    }
    function handleOffline() {
      setIsOffline(true);
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <Card className="w-full max-w-md border-border-strong shadow-gold relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-10">
            <WifiOff size={120} />
          </div>
          <CardHeader className="relative z-10 pb-4 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-foreground">
              <WifiOff className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">You're Offline</CardTitle>
            <CardDescription className="text-base mt-2">
              It looks like your internet connection has dropped.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4 text-sm text-muted-foreground">
            <ul className="space-y-2 list-disc pl-5 text-left">
              <li>Check your network cables, modem, and router.</li>
              <li>Ensure your device's Wi-Fi or cellular data is enabled.</li>
              <li>Try reconnecting to your Wi-Fi network.</li>
            </ul>
          </CardContent>
          <CardFooter className="relative z-10 pt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={() => window.location.reload()} className="w-full sm:w-auto gap-2">
              <RefreshCcw className="h-4 w-4" />
              Retry Connection
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  console.error(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-md flex-col items-center text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We hit an unexpected issue. You can try again, head home, or report this so we can fix it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
        <div className="mt-4">
          <ErrorReporter error={error} context={{ source: "route-error-boundary" }} />
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#000000" },
      { name: "author", content: "VisaClarity" },
      {
        name: "keywords",
        content:
          "visa requirements, visa checklist, visa roadmap, schengen visa, student visa, work visa, tourist visa, visa documents, visa rejection reasons, visa processing time, germany student visa, uk visa, us visa, canada visa, australia visa, visa by nationality",
      },
      { property: "og:site_name", content: "VisaClarity" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@VisaClarity" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { name: "google-site-verification", content: "2VEaHPmTY3vUhyTaMRA5bAss4liVkouQHpqrFSHRrlo" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=DM+Sans:wght@400;500&family=DM+Mono:wght@400;500&display=swap",
      },
      { rel: "alternate", type: "text/plain", href: "/llms.txt", title: "LLM Crawler Context" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {/* GA4 — page views are tracked via usePageTracking in RootComponent */}
        {GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <script
              suppressHydrationWarning
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}

function usePageTracking() {
  const router = useRouter();

  useEffect(() => {
    const track = () => {
      const path = window.location.pathname + window.location.search;
      // @ts-ignore
      if (typeof window.gtag === "function") {
        // @ts-ignore
        window.gtag("event", "page_view", {
          page_path: path,
          page_title: document.title,
          page_location: window.location.href,
        });
      }
    };
    track();
    return router.subscribe("onResolved", track);
  }, [router]);
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  usePageTracking();

  return (
    <QueryClientProvider client={queryClient}>
      <SmoothScroll />
      <CustomCursor />
      <GlobalErrorListener />
      <CookieBanner />
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
