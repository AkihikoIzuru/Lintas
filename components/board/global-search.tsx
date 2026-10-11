"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Loader2, FileText, FolderKanban, MessageSquare, ChevronRight, Clock, CheckSquare, Tag, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface SearchResult {
  tasks: any[];
  projects: any[];
  comments: any[];
  total: number;
}

interface GlobalSearchProps {
  onClose: () => void;
  workspaceId?: string;
}

export function GlobalSearch({ onClose, workspaceId }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"all" | "tasks" | "projects" | "comments">("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = useQuery<SearchResult>({
    queryKey: ["global-search", query, activeTab, workspaceId],
    queryFn: async () => {
      const params = new URLSearchParams({ q: query, type: activeTab });
      if (workspaceId) params.append("workspaceId", workspaceId);
      const res = await fetch(`/api/search?${params}`);
      if (!res.ok) throw new Error("Gagal mencari");
      return res.json();
    },
    enabled: query.length >= 2,
    staleTime: 1000,
  });

  useEffect(() => {
    inputRef.current?.focus();
    setSelectedIndex(0);
  }, [query, activeTab]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = (data?.tasks.length || 0) + (data?.projects.length || 0) + (data?.comments.length || 0);

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, totalResults - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        handleSelectResult();
        break;
      case "Escape":
        onClose();
        break;
    }
  };

  const handleSelectResult = () => {
    let currentIndex = 0;

    const checkAndSelect = (items: any[], type: string) => {
      for (const item of items) {
        if (currentIndex === selectedIndex) {
          if (type === "tasks") {
            window.location.href = `/w/${item.project.workspace.slug}/projects/${item.project.id}?task=${item.id}`;
          } else if (type === "projects") {
            window.location.href = `/w/${item.workspace.slug}/projects/${item.id}`;
          } else if (type === "comments") {
            window.location.href = `/w/${item.task.project.workspace.slug}/projects/${item.task.project.id}?task=${item.task.id}`;
          }
          onClose();
          return true;
        }
        currentIndex++;
      }
      return false;
    };

    if (data?.tasks && checkAndSelect(data.tasks, "tasks")) return;
    if (data?.projects && checkAndSelect(data.projects, "projects")) return;
    if (data?.comments && checkAndSelect(data.comments, "comments")) return;
  };

  const getAllResults = () => {
    const results: any[] = [];
    if (data?.tasks) results.push(...data.tasks.map((t) => ({ ...t, __type: "tasks" })));
    if (data?.projects) results.push(...data.projects.map((p) => ({ ...p, __type: "projects" })));
    if (data?.comments) results.push(...data.comments.map((c) => ({ ...c, __type: "comments" })));
    return results;
  };

  const allResults = getAllResults();

  if (!query || query.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
        <div className="w-full max-w-2xl bg-background rounded-xl shadow-xl border overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Cari tugas, proyek, komentar... (Cmd+K)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 text-lg"
                autoFocus
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                Cmd+K
              </kbd>
            </div>
          </div>
          <div className="p-6 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Ketik minimal 2 karakter untuk mencari</p>
            <p className="text-sm mt-2">Cari di seluruh workspace: judul tugas, deskripsi, nama proyek, komentar</p>
          </div>
          <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground">
            <kbd className="px-2 py-1 bg-background rounded border">↑↓</kbd> Navigasi &nbsp;
            <kbd className="px-2 py-1 bg-background rounded border">Enter</kbd> Buka &nbsp;
            <kbd className="px-2 py-1 bg-background rounded border">Esc</kbd> Tutup
          </div>
        </div>
      </div>
    );
  }

  const renderResultItem = (item: any, index: number, type: string) => {
    const isSelected = index === selectedIndex;

    if (type === "tasks") {
      return (
        <Link
          key={item.id}
          href={`/w/${item.project.workspace.slug}/projects/${item.project.id}?task=${item.id}`}
          onClick={(e) => { e.preventDefault(); handleSelectResult(); }}
          className={cn(
            "flex items-start gap-3 p-3 hover:bg-accent transition-colors cursor-pointer",
            isSelected && "bg-accent"
          )}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.project.color }}>
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.title}</span>
              <Badge variant="secondary" className="text-xs">{item.project.key}-{item.id.slice(-6)}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">{item.project.name}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" /> {item.column.name}
              </span>
              {item.dueDate && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true, locale: id })}
                </span>
              )}
            </div>
          </div>
        </Link>
      );
    }

    if (type === "projects") {
      return (
        <Link
          key={item.id}
          href={`/w/${item.workspace.slug}/projects/${item.id}`}
          onClick={(e) => { e.preventDefault(); handleSelectResult(); }}
          className={cn(
            "flex items-start gap-3 p-3 hover:bg-accent transition-colors cursor-pointer",
            isSelected && "bg-accent"
          )}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: item.color }}>
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.name}</span>
              <Badge variant="secondary" className="text-xs">{item.key}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">{item.workspace.name}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span>{item._count.tasks} tugas</span>
            </div>
          </div>
        </Link>
      );
    }

    if (type === "comments") {
      return (
        <Link
          key={item.id}
          href={`/w/${item.task.project.workspace.slug}/projects/${item.task.project.id}?task=${item.task.id}`}
          onClick={(e) => { e.preventDefault(); handleSelectResult(); }}
          className={cn(
            "flex items-start gap-3 p-3 hover:bg-accent transition-colors cursor-pointer",
            isSelected && "bg-accent"
          )}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium truncate">{item.task.title}</span>
              <Badge variant="outline" className="text-xs">{item.task.project.key}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate mt-1">{item.content}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px]">
                  {getInitials(item.author.name || item.author.email)}
                </span>
                {item.author.name || item.author.email}
              </span>
              <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: id })}</span>
            </div>
          </div>
        </Link>
      );
    }

    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20" onClick={onClose}>
      <div className="w-full max-w-2xl bg-background rounded-xl shadow-xl border overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Cari tugas, proyek, komentar... (Cmd+K)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 text-lg"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setQuery("")}
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3">
            {(["all", "tasks", "projects", "comments"] as const).map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                size="sm"
                className="text-xs"
                onClick={() => { setActiveTab(tab); setSelectedIndex(0); }}
              >
                {tab === "all" && "Semua"}
                {tab === "tasks" && "Tugas"}
                {tab === "projects" && "Proyek"}
                {tab === "comments" && "Komentar"}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-hidden" ref={resultsRef}>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-destructive">
              Gagal mencari: {error instanceof Error ? error.message : "Unknown error"}
            </div>
          ) : allResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
              <Search className="w-12 h-12 mb-4 opacity-50" />
              <p>Tidak ada hasil untuk "{query}"</p>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)] max-h-[500px]">
              <div className="p-4 space-y-1">
                {data?.tasks && data.tasks.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                      <CheckSquare className="w-4 h-4" /> Tugas ({data.tasks.length})
                    </div>
                    {data.tasks.map((task, i) => renderResultItem(task, i, "tasks"))}
                    {data.projects.length > 0 || data.comments.length > 0 ? <Separator className="my-2" /> : null}
                  </>
                )}
                {data?.projects && data.projects.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                      <FolderKanban className="w-4 h-4" /> Proyek ({data.projects.length})
                    </div>
                    {data.projects.map((project, i) => renderResultItem(project, data.tasks.length + i, "projects"))}
                    {data.comments.length > 0 ? <Separator className="my-2" /> : null}
                  </>
                )}
                {data?.comments && data.comments.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground uppercase">
                      <MessageSquare className="w-4 h-4" /> Komentar ({data.comments.length})
                    </div>
                    {data.comments.map((comment, i) => renderResultItem(comment, (data.tasks?.length || 0) + (data.projects?.length || 0) + i, "comments"))}
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t bg-muted/30 text-xs text-muted-foreground flex items-center justify-between">
          <span>{data?.total || 0} hasil ditemukan</span>
          <div className="flex items-center gap-4">
            <kbd className="px-2 py-1 bg-background rounded border">↑↓</kbd> Navigasi
            <kbd className="px-2 py-1 bg-background rounded border">Enter</kbd> Buka
            <kbd className="px-2 py-1 bg-background rounded border">Esc</kbd> Tutup
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for global search keyboard shortcut
export function useGlobalSearch(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpen]);
}