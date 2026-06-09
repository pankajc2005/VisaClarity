import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check local storage on mount
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptEssential = () => {
    localStorage.setItem("cookie-consent", "essential");
    setIsVisible(false);
    // Any logic for essential tracking goes here
  };

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-consent", "all");
    setIsVisible(false);
    // Any logic for enabling non-essential tracking goes here
  };

  const handleClose = () => {
    // Treat dismissing the banner as "essential only" (default)
    localStorage.setItem("cookie-consent", "essential");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 pb-6 bg-background/95 backdrop-blur border-t border-border shadow-lg transform transition-transform duration-300">
      <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 pr-8 relative">
          <button
            onClick={handleClose}
            className="absolute -top-1 -right-2 sm:hidden p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close cookie banner"
          >
            <X size={16} />
          </button>
          <h3 className="text-sm font-medium text-foreground mb-1">Cookie Preferences</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            We use essential cookies to make our site work. With your consent, we may also use
            non-essential cookies to improve user experience and analyze website traffic.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleAcceptEssential}
            className="px-4 py-2 text-xs sm:text-sm font-medium border border-border text-foreground bg-background hover:bg-muted rounded-md transition-colors w-full sm:w-auto whitespace-nowrap"
          >
            Accept Essential Only
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors w-full sm:w-auto whitespace-nowrap"
          >
            Accept All
          </button>
          <button
            onClick={handleClose}
            className="hidden sm:flex p-2 text-muted-foreground hover:text-foreground transition-colors items-center justify-center rounded-md hover:bg-muted"
            aria-label="Close cookie banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
