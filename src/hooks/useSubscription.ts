import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyTier, type SubscriptionInfo } from "@/lib/subscription/subscription.functions";
import { useAuth } from "./useAuth";

const FREE_FALLBACK: SubscriptionInfo = {
  tier: "free",
  status: "active",
  currentPeriodEnd: null,
  isPro: false,
  isProMax: false,
  isPaid: false,
};

export function useSubscription() {
  const { user, loading: authLoading } = useAuth();
  const fetchTier = useServerFn(getMyTier);

  const { data, isLoading } = useQuery({
    queryKey: ["subscription", user?.id ?? "anon"],
    queryFn: () => fetchTier(),
    enabled: !!user && !authLoading,
    staleTime: 60_000,
  });

  return {
    ...(data ?? FREE_FALLBACK),
    loading: authLoading || (!!user && isLoading),
    isAuthenticated: !!user,
  };
}
