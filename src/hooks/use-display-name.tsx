import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/** Returns the best display name: profile.full_name → metadata → email prefix → "Student". */
export function useDisplayName(): { name: string; firstName: string; loading: boolean } {
  const { user, loading } = useAuth();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-name", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const fromMeta =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined);
  const emailPrefix = user?.email?.split("@")[0];
  const name =
    profile?.full_name?.trim() ||
    fromMeta?.trim() ||
    emailPrefix ||
    "Student";
  const firstName = name.split(/\s+/)[0];
  return { name, firstName, loading: loading || isLoading };
}
