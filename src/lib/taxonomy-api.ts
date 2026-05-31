import { supabase } from "@/integrations/supabase/client";

export type Branch = { id: string; name: string; sort_order: number };
export type Semester = { id: string; name: string; sort_order: number };

export async function fetchBranches(): Promise<Branch[]> {
  const { data, error } = await supabase
    .from("branches")
    .select("id,name,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Branch[];
}

export async function fetchSemesters(): Promise<Semester[]> {
  const { data, error } = await supabase
    .from("semesters")
    .select("id,name,sort_order")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Semester[];
}
