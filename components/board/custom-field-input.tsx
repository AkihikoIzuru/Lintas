"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Checkbox,
} from "@/components/ui/checkbox";

interface CustomField {
  id: string;
  name: string;
  type: string;
  options: Array<{ value: string; label: string; color?: string }> | null;
  description: string | null;
  isRequired: boolean;
}

interface CustomFieldValue {
  id: string;
  customFieldId: string;
  taskId: string;
  value: any;
  customField: CustomField;
}

interface CustomFieldInputProps {
  taskId: string;
  customFields: CustomField[];
  existingValues: CustomFieldValue[];
  onValuesChange?: (values: Record<string, any>) => void;
}

export function CustomFieldInput({ taskId, customFields, existingValues, onValuesChange }: CustomFieldInputProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, any>>({});
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize values from existing
  useEffect(() => {
    const initialValues: Record<string, any> = {};
    existingValues.forEach((v) => {
      initialValues[v.customFieldId] = v.value;
    });
    setValues(initialValues);
    onValuesChange?.(initialValues);
  }, [existingValues, onValuesChange]);

  const saveValue = useMutation({
    mutationFn: async ({ customFieldId, value }: { customFieldId: string; value: any }) => {
      const res = await fetch("/api/custom-fields/[id]/values", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customFieldId, taskId, value }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Gagal menyimpan nilai");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["custom-field-values", taskId] });
      setEditingFieldId(null);
      setIsSaving(false);
    },
    onError: (error: Error) => {
      setIsSaving(false);
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const handleChange = (fieldId: string, value: any) => {
    setValues((prev) => {
      const newValues = { ...prev, [fieldId]: value };
      onValuesChange?.(newValues);
      return newValues;
    });
  };

  const handleSave = (field: CustomField) => {
    setIsSaving(true);
    saveValue.mutate({ customFieldId: field.id, value: values[field.id] });
  };

  const handleCancel = (field: CustomField) => {
    // Revert to original value
    const originalValue = existingValues.find((v) => v.customFieldId === field.id)?.value;
    setValues((prev) => ({ ...prev, [field.id]: originalValue }));
    setEditingFieldId(null);
  };

  const renderInput = (field: CustomField, isEditing: boolean) => {
    const value = values[field.id];
    const disabled = !isEditing;

    switch (field.type) {
      case "TEXT":
        return (
          <Input
            placeholder={field.description || "Masukkan teks..."}
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            disabled={disabled}
          />
        );
      case "NUMBER":
        return (
          <Input
            type="number"
            placeholder={field.description || "Masukkan angka..."}
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.valueAsNumber)}
            disabled={disabled}
          />
        );
      case "DATE":
        return (
          <Input
            type="date"
            value={value ? value.split("T")[0] : ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            disabled={disabled}
          />
        );
      case "SELECT":
        return (
          <Select
            value={value || ""}
            onValueChange={(v) => handleChange(field.id, v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.description || "Pilih..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "MULTI_SELECT":
        return (
          <div className="flex flex-wrap gap-1">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border text-sm cursor-pointer hover:bg-accent"
                style={{ borderColor: opt.color || "transparent" }}
              >
                <Checkbox
                  checked={Array.isArray(value) && value.includes(opt.value)}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(value) ? value : [];
                    handleChange(field.id, checked ? [...current, opt.value] : current.filter((v: string) => v !== opt.value));
                  }}
                  disabled={disabled}
                />
                <span style={{ color: opt.color }}>{opt.label}</span>
              </label>
            ))}
          </div>
        );
      case "CHECKBOX":
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleChange(field.id, checked)}
              disabled={disabled}
            />
            <Label className="cursor-pointer mb-0">Ya</Label>
          </div>
        );
      case "URL":
        return (
          <Input
            type="url"
            placeholder="https://example.com"
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            disabled={disabled}
          />
        );
      case "EMAIL":
        return (
          <Input
            type="email"
            placeholder="email@example.com"
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            disabled={disabled}
          />
        );
      default:
        return (
          <Input
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            disabled={disabled}
          />
        );
    }
  };

  const renderDisplay = (field: CustomField) => {
    const value = values[field.id];

    if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-muted-foreground italic">Belum diisi</span>;
    }

    switch (field.type) {
      case "SELECT":
      case "MULTI_SELECT": {
        const selectedOptions = Array.isArray(value) ? value : [value];
        return (
          <div className="flex flex-wrap gap-1">
            {selectedOptions.map((v) => {
              const opt = field.options?.find((o) => o.value === v);
              return opt ? (
                <Badge key={v} variant="secondary" className="gap-1" style={{ borderColor: opt.color || "transparent", backgroundColor: `${opt.color}20`, color: opt.color }}>
                  {opt.label}
                </Badge>
              ) : (
                <Badge key={v} variant="outline" className="text-xs">{v}</Badge>
              );
            })}
          </div>
        );
      }
      case "CHECKBOX":
        return <Badge variant={Boolean(value) ? "default" : "secondary"}> {Boolean(value) ? "Ya" : "Tidak"} </Badge>;
      case "DATE":
        return <span>{new Date(value).toLocaleDateString("id-ID")}</span>;
      case "URL":
        return <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{value}</a>;
      case "EMAIL":
        return <a href={`mailto:${value}`} className="text-primary hover:underline">{value}</a>;
      default:
        return <span>{value}</span>;
    }
  };

  if (customFields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm">Custom Fields</h4>
      <div className="space-y-3">
        {customFields.map((field) => {
          const isEditing = editingFieldId === field.id;

          return (
            <div key={field.id} className="space-y-1 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium mb-0">{field.name}</Label>
                    {field.isRequired && <Badge variant="default" className="text-xs">Wajib</Badge>}
                  </div>
                  {field.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button variant="outline" size="icon" onClick={() => handleSave(field)} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleCancel(field)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => setEditingFieldId(field.id)}>
                      Edit
                    </Button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                {isEditing ? (
                  <div className="space-y-2">
                    {renderInput(field, true)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {renderDisplay(field)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}