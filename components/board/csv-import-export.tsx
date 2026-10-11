"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Upload,
  FileSpreadsheet,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface CsvImportExportProps {
  projectId: string;
}

export function CsvImportExport({ projectId }: CsvImportExportProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [exportFilter, setExportFilter] = useState<"all" | "selected" | "current_view">("all");

  const importCsv = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectId", projectId);

      const res = await fetch("/api/tasks/import", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal mengimpor CSV");
      }

      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setImportDialogOpen(false);
      setFile(null);
      setPreviewData(null);
      toast({
        title: "Berhasil",
        description: `${data.imported} tugas diimpor, ${data.skipped} dilewati`
      });
    },
    onError: (error: Error) => {
      setImportError(error.message);
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const exportCsv = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({
        projectId,
        format: exportFormat,
        filter: exportFilter,
      });
      const res = await fetch(`/api/tasks/export?${params}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal mengekspor");
      }
      return res.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${projectId}-${new Date().toISOString().split("T")[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setExportDialogOpen(false);
      toast({ title: "Berhasil", description: "File berhasil diunduh" });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      setImportError("File harus berformat CSV");
      return;
    }

    setFile(selectedFile);
    setImportError(null);

    // Preview first few rows
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) {
        setPreviewData([]);
        return;
      }
      const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
      const preview = lines.slice(1, 6).map(line => {
        const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => obj[h] = values[i] || "");
        return obj;
      });
      setPreviewData(preview);
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = () => {
    if (file) {
      importCsv.mutate(file);
    }
  };

  const handleExport = () => {
    exportCsv.mutate();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          CSV
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Ekspor</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setExportDialogOpen(true)}>
          <Download className="w-4 h-4 mr-2" />
          Ekspor Tugas
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Impor</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => setImportDialogOpen(true)}>
          <Upload className="w-4 h-4 mr-2" />
          Impor CSV
        </DropdownMenuItem>
      </DropdownMenuContent>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Impor Tugas dari CSV</DialogTitle>
            <DialogDescription>
              Unggah file CSV untuk membuat banyak tugas sekaligus.
              <br />
              Kolom wajib: title, columnId
              <br />
              Kolom opsional: description, priority, dueDate, assigneeEmails, labels
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Seret file CSV ke sini atau klik untuk memilih
              </p>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file"
              />
              <Button variant="outline" className="mt-2" onClick={() => document.getElementById("csv-file")?.click()}>
                Pilih File
              </Button>
            </div>

            {importError && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded">
                <AlertCircle className="w-4 h-4" />
                <span>{importError}</span>
              </div>
            )}

            {previewData && previewData.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Pratinjau ({previewData.length} baris):</p>
                <div className="max-h-60 overflow-auto border rounded p-2 text-sm font-mono">
                  {previewData.map((row, i) => (
                    <div key={i} className="text-muted-foreground">
                      {JSON.stringify(row, null, 2)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleImport} disabled={!file || importCsv.isPending}>
              {importCsv.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Mengimpor...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Impor
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ekspor Tugas</DialogTitle>
            <DialogDescription>Pilih format dan filter untuk ekspor</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated Values)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Filter</Label>
              <Select value={exportFilter} onValueChange={setExportFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tugas</SelectItem>
                  <SelectItem value="current_view">Tampilan Saat Ini</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleExport} disabled={exportCsv.isPending}>
              {exportCsv.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyiapkan...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Unduh
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DropdownMenu>
  );
}

// CSV Template Generator
export function generateCsvTemplate(): string {
  const headers = [
    "title",
    "description",
    "priority",
    "dueDate",
    "columnId",
    "assigneeEmails",
    "labels",
  ];
  const example = [
    "Tugas contoh",
    "Deskripsi tugas ini",
    "MEDIUM",
    "2024-12-31",
    "column-id-from-board",
    "user1@example.com;user2@example.com",
    "bug;urgent;frontend",
  ];

  return [
    headers.join(","),
    example.join(","),
  ].join("\n");
}

export function downloadCsvTemplate() {
  const csv = generateCsvTemplate();
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tasks-template.csv";
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}