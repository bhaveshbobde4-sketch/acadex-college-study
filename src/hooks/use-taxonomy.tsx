import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchSemesters } from "@/lib/taxonomy-api";

export function useBranches() {
  return useQuery({ queryKey: ["branches"], queryFn: fetchBranches, staleTime: 60_000 });
}
export function useSemesters() {
  return useQuery({ queryKey: ["semesters"], queryFn: fetchSemesters, staleTime: 60_000 });
}
