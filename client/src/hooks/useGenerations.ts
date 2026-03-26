import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  IGeneration,
  GenerateSinglePayload,
  IBulkJob,
  BulkGeneratePayload,
  ExportPayload,
} from "@/types/generation";

const GENERATIONS_KEY = "generations";
const JOBS_KEY = "bulk-jobs";

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

export function useGenerateBulk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BulkGeneratePayload) =>
      api.post<IBulkJob>("/generate/bulk", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [JOBS_KEY] });
    },
  });
}

export function useBulkJobs() {
  return useQuery<IBulkJob[]>({
    queryKey: [JOBS_KEY],
    queryFn: () => api.get("/generate/jobs").then((r) => r.data),
  });
}

export function useBulkJobStatus(jobId: string, enabled = true) {
  return useQuery<IBulkJob>({
    queryKey: [JOBS_KEY, jobId],
    queryFn: () =>
      api.get(`/generate/jobs/${jobId}`).then((r) => r.data),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 2s while active, stop when done
      if (status === "queued" || status === "processing") return 2000;
      return false;
    },
  });
}

export function useExportGenerations() {
  return useMutation({
    mutationFn: async (payload: ExportPayload) => {
      const res = await api.post("/generations/export", payload, {
        responseType: "blob",
      });
      // Trigger download
      const ext = payload.format === "json" ? "json" : "csv";
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `generations.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
