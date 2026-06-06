import { useQuery } from "@tanstack/react-query";
import { fetchCategories } from "@/lib/api";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}
