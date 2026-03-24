import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useImportCsv } from "@/hooks/useProducts";
import { toast } from "sonner";

interface CsvUploadProps {
  onSuccess?: (result: { imported: number; skipped: number }) => void;
}

export function CsvUpload({ onSuccess }: CsvUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const importCsv = useImportCsv();

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a .csv file");
      return;
    }
    setSelectedFile(file);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    try {
      const result = await importCsv.mutateAsync(selectedFile);
      const errors = result.errors ?? [];
      if (errors.length > 0) {
        toast.warning(
          `Imported ${result.imported} products. ${errors.length} row(s) had errors.`
        );
      } else {
        toast.success(`Imported ${result.imported} products successfully.`);
      }
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess?.({ imported: result.imported, skipped: result.skipped });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Import failed";
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
          dragOver ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <svg
          className="mx-auto mb-3 text-muted-foreground"
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="12" y2="12" />
          <line x1="15" y1="15" x2="12" y2="12" />
        </svg>
        {selectedFile ? (
          <p className="text-sm font-medium">{selectedFile.name}</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drop a CSV file here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* CSV format hint */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">Expected CSV format</summary>
        <div className="mt-2 rounded-lg bg-muted p-3 font-mono text-[11px] leading-relaxed">
          name,category,brand,price,currency,features,benefits,tags
          <br />
          "Widget Pro",Electronics,Acme,29.99,USD,"Fast|Durable","Saves time|Easy to use","sale|new"
        </div>
        <p className="mt-1">Use <code>|</code> to separate multiple values within a cell.</p>
      </details>

      {/* Import button */}
      {selectedFile && (
        <div className="flex justify-end">
          <Button
            onClick={handleImport}
            disabled={importCsv.isPending}
          >
            {importCsv.isPending ? "Importing..." : `Import "${selectedFile.name}"`}
          </Button>
        </div>
      )}
    </div>
  );
}
