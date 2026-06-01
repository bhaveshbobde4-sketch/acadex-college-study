import { useQuery } from "@tanstack/react-query";
import { fetchBranches, fetchSemesters, fetchSubjects } from "@/lib/taxonomy-api";

export function useBranches() {
  return useQuery({ queryKey: ["branches"], queryFn: fetchBranches, staleTime: 60_000 });
}
export function useSemesters(branch?: string) {
  return useQuery({
    queryKey: ["semesters", branch ?? "all"],
    queryFn: () => fetchSemesters(branch),
    staleTime: 60_000,
  });
}
export function useSubjects(branch?: string, semester?: string) {
  return useQuery({
    queryKey: ["subjects", branch ?? "all", semester ?? "all"],
    queryFn: () => fetchSubjects(branch, semester),
    enabled: true,
    staleTime: 60_000,
  });
}
