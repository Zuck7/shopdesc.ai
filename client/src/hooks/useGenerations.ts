import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { IGeneration, GenerateSinglePayload } from "@/types/generation";

const GENERATIONS_KEY = "generations";

export function useGenerations(productId: string) {
  return useQuery<IGeneration[]>({
    queryKey: [GENERATIONS_KEY, productId],
    queryFn: () =>
      api.get(`/generations/${productId}`).then((r) => r.data),
    enabled: !!productId,
  });
}

export function useGenerationDetail(id: string) {
  return useQuery<IGeneration>({
    queryKey: [GENERATIONS_KEY, "detail", id],
    queryFn: () =>
      api.get(`/generations/detail/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useGenerateSingle(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateSinglePayload) =>
      api
        .post<IGeneration>(`/generate/single/${productId}`, payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [GENERATIONS_KEY, productId] });
    },
  });
}
