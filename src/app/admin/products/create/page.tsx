"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Check,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Image as ImageIcon,
  Layers,
  Package,
  Palette,
  Plus,
  Printer,
  Save,
  Send,
  Settings2,
  Trash2,
  Warehouse,
  X,
} from "lucide-react";
import { Card } from "@/components/shared/Card";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { DataTable, type ColumnDef } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { toast } from "@/components/shared/Toast";
import {
  categories,
  formatVND,
  products,
  skus,
  type Category,
  type ProductAttribute,
  type ProductType,
  type Uom,
} from "@/lib/mock-data";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type StepKey =
  | "draft"
  | "variants"
  | "sku"
  | "logistics"
  | "inventory"
  | "customization"
  | "catalog"
  | "review";

type TaxClass = "standard" | "reduced" | "exempt";

type FormState = {
  productCode: string;
  name: string;
  nameEn: string;
  type: ProductType;
  categoryId: string;
  brand: string;
  taxClass: TaxClass;
  uom: Uom;
  description: string;
  descriptionEn: string;
  selectedAttributeIds: string[];
  selectedValues: Record<string, string[]>;
  disabledSkuKeys: string[];
  skuOverrides: Record<string, string>;
  skuCosts: Record<string, string>;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  packSize: string;
  lotTracking: boolean;
  serialTracking: boolean;
  expiryTracking: boolean;
  reorderPoint: string;
  maxStock: string;
  printAreas: PrintAreaDraft[];
  model3dUrl: string;
  templateName: string;
  allowedTechniques: string[];
  imageUrls: string;
  seoTitle: string;
  seoDescription: string;
  catalogVisible: boolean;
};

type PrintAreaDraft = {
  id: string;
  name: string;
  position: "front" | "back" | "left-sleeve" | "right-sleeve" | "full";
  widthMm: string;
  heightMm: string;
  minDpi: string;
};

type SkuPreviewRow = {
  key: string;
  enabled: boolean;
  skuCode: string;
  attributes: Record<string, string>;
  variantLabel: string;
};

type ValidationIssue = {
  step: StepKey;
  message: string;
};

/* -------------------------------------------------------------------------- */
/*  Constants                                                                 */
/* -------------------------------------------------------------------------- */

const STEPS: { key: StepKey; label: string; icon: typeof Box }[] = [
  { key: "draft", label: "Bản nháp", icon: FileText },
  { key: "variants", label: "Biến thể", icon: Palette },
  { key: "sku", label: "Ma trận SKU", icon: Layers },
  { key: "logistics", label: "Logistics", icon: Package },
  { key: "inventory", label: "Tồn kho", icon: Warehouse },
  { key: "customization", label: "Tùy chỉnh", icon: Printer },
  { key: "catalog", label: "TMĐT", icon: ImageIcon },
  { key: "review", label: "Gửi duyệt", icon: ClipboardCheck },
];

const PRINT_POSITIONS = [
  { value: "front", label: "Mặt trước" },
  { value: "back", label: "Mặt sau" },
  { value: "left-sleeve", label: "Tay trái" },
  { value: "right-sleeve", label: "Tay phải" },
  { value: "full", label: "Toàn bộ" },
] as const;

const PRINT_TECHNIQUES = ["DTG", "DTF", "Screen", "Embroidery", "Sublimation"];

const INITIAL_FORM: FormState = {
  productCode: "",
  name: "",
  nameEn: "",
  type: "Standard",
  categoryId: "",
  brand: "",
  taxClass: "standard",
  uom: "pcs",
  description: "",
  descriptionEn: "",
  selectedAttributeIds: [],
  selectedValues: {},
  disabledSkuKeys: [],
  skuOverrides: {},
  skuCosts: {},
  weightKg: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  packSize: "1",
  lotTracking: false,
  serialTracking: false,
  expiryTracking: false,
  reorderPoint: "0",
  maxStock: "",
  printAreas: [],
  model3dUrl: "",
  templateName: "",
  allowedTechniques: ["DTG", "DTF"],
  imageUrls: "",
  seoTitle: "",
  seoDescription: "",
  catalogVisible: false,
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function aggregateAttributes(): ProductAttribute[] {
  const map = new Map<string, ProductAttribute>();
  for (const product of products) {
    for (const attr of product.attributes) {
      const existing = map.get(attr.attributeId);
      if (!existing) {
        map.set(attr.attributeId, {
          ...attr,
          values: [...attr.values],
          swatch: attr.swatch ? { ...attr.swatch } : undefined,
        });
        continue;
      }
      for (const value of attr.values) {
        if (!existing.values.includes(value)) existing.values.push(value);
      }
      if (attr.swatch) {
        existing.swatch = { ...(existing.swatch ?? {}), ...attr.swatch };
      }
    }
  }
  return Array.from(map.values());
}

function normalizeCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9_-]/g, "");
}

function valueCode(value: string) {
  const dictionary: Record<string, string> = {
    Đen: "DEN",
    Trắng: "TRG",
    Xám: "XAM",
    Navy: "NVY",
    "Đen lông": "DLG",
    Be: "BE",
    "Be tự nhiên": "BTN",
  };
  return (dictionary[value] ?? normalizeCode(value).slice(0, 3)) || "VAR";
}

function cartesianProduct(entries: { attr: ProductAttribute; values: string[] }[]) {
  if (entries.length === 0) return [{ key: "DEFAULT", attributes: {} as Record<string, string> }];
  return entries.reduce(
    (acc, entry) =>
      acc.flatMap((row) =>
        entry.values.map((value) => ({
          key: `${row.key}|${entry.attr.attributeId}:${value}`,
          attributes: { ...row.attributes, [entry.attr.name.en]: value },
        }))
      ),
    [{ key: "", attributes: {} as Record<string, string> }]
  );
}

function parsePositiveNumber(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

function parseNonNegativeNumber(value: string) {
  if (value.trim() === "") return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0;
}

function fieldClass(hasError = false) {
  return cn(
    "w-full rounded-[var(--r-sm)] border bg-bg-surface px-3 py-1.5 text-[0.8125rem] text-ink-primary outline-none transition-colors placeholder:text-ink-tertiary",
    hasError ? "border-danger focus:border-danger" : "border-border-default focus:border-accent"
  );
}

function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-danger">{children}</p>;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-[family-name:var(--font-display)] text-[1rem] font-semibold text-ink-primary">
        {title}
      </h2>
      <p className="mt-1 text-[0.8125rem] text-ink-secondary">{description}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function ProductCreatePage() {
  const router = useRouter();
  const attributes = useMemo(() => aggregateAttributes(), []);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [currentStep, setCurrentStep] = useState<StepKey>("draft");
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedEntries = useMemo(
    () =>
      form.selectedAttributeIds
        .map((id) => {
          const attr = attributes.find((a) => a.attributeId === id);
          if (!attr) return null;
          return { attr, values: form.selectedValues[id] ?? [] };
        })
        .filter((entry): entry is { attr: ProductAttribute; values: string[] } => !!entry),
    [attributes, form.selectedAttributeIds, form.selectedValues]
  );

  const skuRows = useMemo<SkuPreviewRow[]>(() => {
    const combinations = cartesianProduct(selectedEntries.filter((entry) => entry.values.length > 0));
    const productCode = normalizeCode(form.productCode) || "NEW-PRODUCT";
    return combinations.map((combo, index) => {
      const parts = Object.values(combo.attributes).map(valueCode);
      const autoCode = [productCode, ...parts, String(index + 1).padStart(3, "0")].join("-");
      const skuCode = form.skuOverrides[combo.key] ?? autoCode;
      const variantLabel = Object.keys(combo.attributes).length
        ? Object.values(combo.attributes).join(" / ")
        : "SKU mặc định";
      return {
        key: combo.key,
        enabled: !form.disabledSkuKeys.includes(combo.key),
        skuCode,
        attributes: combo.attributes,
        variantLabel,
      };
    });
  }, [form.disabledSkuKeys, form.productCode, form.skuOverrides, selectedEntries]);

  const enabledSkuRows = skuRows.filter((row) => row.enabled);
  const validationIssues = useMemo(() => validateForm(form, selectedEntries, skuRows), [form, selectedEntries, skuRows]);
  const issuesByStep = useMemo(() => {
    const map = new Map<StepKey, string[]>();
    for (const issue of validationIssues) {
      map.set(issue.step, [...(map.get(issue.step) ?? []), issue.message]);
    }
    return map;
  }, [validationIssues]);

  const currentStepIndex = STEPS.findIndex((step) => step.key === currentStep);
  const currentStepIssues = issuesByStep.get(currentStep) ?? [];
  const showErrors = submitAttempted || currentStep === "review";

  const goNext = () => setCurrentStep(STEPS[Math.min(currentStepIndex + 1, STEPS.length - 1)]!.key);
  const goBack = () => setCurrentStep(STEPS[Math.max(currentStepIndex - 1, 0)]!.key);

  const handleSubmitAttempt = () => {
    setSubmitAttempted(true);
    if (validationIssues.length > 0) {
      const first = validationIssues[0]!;
      setCurrentStep(first.step);
      toast.error("Chưa thể gửi duyệt", first.message);
      return;
    }
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = () => {
    setSubmitted(true);
    setConfirmOpen(false);
    setCurrentStep("review");
    toast.success("Đã gửi duyệt", "Sản phẩm mock đã chuyển sang Pending Approval trong UI.");
  };

  const stepStatus = (step: StepKey) => {
    if ((issuesByStep.get(step) ?? []).length > 0 && submitAttempted) return "error";
    if (STEPS.findIndex((s) => s.key === step) < currentStepIndex || submitted) return "done";
    if (step === currentStep) return "active";
    return "idle";
  };

  return (
    <>
      <PageHeader
        title="Tạo sản phẩm"
        subtitle="Khai báo product master data, sinh SKU từ biến thể và gửi vào luồng duyệt."
        breadcrumbs={[
          { label: "Back-office", href: "/admin" },
          { label: "Sản phẩm", href: "/admin/products" },
          { label: "Tạo sản phẩm" },
        ]}
        actions={
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
          >
            <ArrowLeft className="size-3.5" />
            Quay lại danh sách
          </Link>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[260px_1fr]">
        <Card className="h-fit p-0">
          <div className="border-b border-border-default px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-tertiary">Quy trình</div>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge domain="product" status={submitted ? "Pending Approval" : "Draft"} size="sm" withIcon />
              <span className="text-xs text-ink-tertiary">{enabledSkuRows.length} SKU preview</span>
            </div>
          </div>
          <div className="p-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const status = stepStatus(step.key);
              const isSkipped = step.key === "customization" && form.type === "Standard";
              return (
                <button
                  key={step.key}
                  type="button"
                  onClick={() => setCurrentStep(step.key)}
                  className={cn(
                    "mb-1 flex w-full items-center gap-2 rounded-[var(--r-sm)] px-2.5 py-2 text-left text-[0.8125rem] transition-colors",
                    status === "active" && "bg-brand font-medium text-ink-inverse",
                    status !== "active" && "text-ink-secondary hover:bg-bg-muted hover:text-ink-primary",
                    status === "error" && "border border-danger/30 bg-danger/5 text-danger",
                    isSkipped && "opacity-55"
                  )}
                >
                  <span className="flex size-5 items-center justify-center rounded-full border border-current/20 text-[0.625rem]">
                    {status === "done" ? <Check className="size-3" /> : index + 1}
                  </span>
                  <Icon className="size-3.5" />
                  <span className="flex-1">{step.label}</span>
                  {isSkipped && <span className="text-[0.625rem]">Skip</span>}
                </button>
              );
            })}
          </div>
        </Card>

        <div className="min-w-0 space-y-4 pb-24">
          {showErrors && currentStepIssues.length > 0 && (
            <div className="rounded-[var(--r-sm)] border border-danger/30 bg-danger/5 px-4 py-3 text-[0.8125rem] text-danger">
              <div className="font-semibold">Cần xử lý trước khi gửi duyệt</div>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {currentStepIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          )}

          {currentStep === "draft" && (
            <DraftStep form={form} update={update} showErrors={showErrors} />
          )}
          {currentStep === "variants" && (
            <VariantStep attributes={attributes} form={form} update={update} />
          )}
          {currentStep === "sku" && (
            <SkuStep form={form} update={update} skuRows={skuRows} />
          )}
          {currentStep === "logistics" && (
            <LogisticsStep form={form} update={update} showErrors={showErrors} skuCount={enabledSkuRows.length} />
          )}
          {currentStep === "inventory" && (
            <InventoryStep form={form} update={update} />
          )}
          {currentStep === "customization" && (
            <CustomizationStep form={form} update={update} showErrors={showErrors} />
          )}
          {currentStep === "catalog" && (
            <CatalogStep form={form} update={update} />
          )}
          {currentStep === "review" && (
            <ReviewStep
              form={form}
              skuRows={enabledSkuRows}
              issuesByStep={issuesByStep}
              submitted={submitted}
              onSubmit={handleSubmitAttempt}
            />
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border-default bg-bg-surface/95 px-4 py-3 backdrop-blur lg:left-[240px]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-ink-tertiary">
            Bước {currentStepIndex + 1}/{STEPS.length} · {STEPS[currentStepIndex]?.label}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                toast.success("Đã lưu nháp", "Dữ liệu mock được giữ trong phiên làm việc hiện tại.");
              }}
              className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted hover:text-ink-primary"
            >
              <Save className="size-3.5" />
              Lưu nháp
            </button>
            <button
              type="button"
              onClick={goBack}
              disabled={currentStepIndex === 0}
              className="rounded-[var(--r-sm)] border border-border-default bg-bg-surface px-3 py-1.5 text-[0.8125rem] font-medium text-ink-secondary transition-colors hover:bg-bg-muted disabled:opacity-40"
            >
              Quay lại
            </button>
            {currentStep !== "review" ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
              >
                Tiếp tục
                <ArrowRight className="size-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitAttempt}
                className="inline-flex items-center gap-1.5 rounded-[var(--r-sm)] bg-brand px-3 py-1.5 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover"
              >
                <Send className="size-3.5" />
                Gửi duyệt
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Gửi duyệt sản phẩm"
        description={`Xác nhận gửi ${form.name || "sản phẩm mới"} với ${enabledSkuRows.length} SKU vào hàng chờ duyệt?`}
        confirmLabel="Gửi duyệt"
        variant="default"
        onConfirm={handleConfirmSubmit}
      />
    </>
  );
}

function DraftStep({ form, update, showErrors }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; showErrors: boolean }) {
  return (
    <Card>
      <SectionTitle title="Thông tin bản nháp" description="Các trường định danh bắt buộc để khởi tạo Product record ở trạng thái Draft." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Tên sản phẩm <span className="text-danger">*</span></label>
          <input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Áo thun cotton cao cấp" className={fieldClass(showErrors && !form.name.trim())} />
          <FieldError>{showErrors && !form.name.trim() ? "Tên sản phẩm là bắt buộc." : undefined}</FieldError>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Tên tiếng Anh</label>
          <input value={form.nameEn} onChange={(e) => update("nameEn", e.target.value)} placeholder="Premium Cotton T-Shirt" className={fieldClass()} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Mã sản phẩm nội bộ <span className="text-danger">*</span></label>
          <input value={form.productCode} onChange={(e) => update("productCode", normalizeCode(e.target.value))} placeholder="TEE-COTTON" className={fieldClass(showErrors && !form.productCode.trim())} />
          <FieldError>{showErrors && !form.productCode.trim() ? "Mã sản phẩm là bắt buộc." : undefined}</FieldError>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Danh mục <span className="text-danger">*</span></label>
          <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={fieldClass(showErrors && !form.categoryId)}>
            <option value="">Chọn danh mục</option>
            {categories.map((category: Category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {"— ".repeat(category.level - 1)}{category.name.vi} · {category.categoryId}
              </option>
            ))}
          </select>
          <FieldError>{showErrors && !form.categoryId ? "Danh mục là bắt buộc." : undefined}</FieldError>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Thương hiệu <span className="text-danger">*</span></label>
          <input value={form.brand} onChange={(e) => update("brand", e.target.value)} placeholder="StockFlow Basics" className={fieldClass(showErrors && !form.brand.trim())} />
          <FieldError>{showErrors && !form.brand.trim() ? "Thương hiệu là bắt buộc." : undefined}</FieldError>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Loại sản phẩm</label>
          <select value={form.type} onChange={(e) => update("type", e.target.value as ProductType)} className={fieldClass()}>
            <option value="Standard">Standard</option>
            <option value="Customizable">Customizable</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Tax class</label>
          <select value={form.taxClass} onChange={(e) => update("taxClass", e.target.value as TaxClass)} className={fieldClass()}>
            <option value="standard">standard</option>
            <option value="reduced">reduced</option>
            <option value="exempt">exempt</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">UoM</label>
          <select value={form.uom} onChange={(e) => update("uom", e.target.value as Uom)} className={fieldClass()}>
            {(["pcs", "box", "kg", "m", "ream", "set"] satisfies Uom[]).map((uom) => <option key={uom} value={uom}>{uom}</option>)}
          </select>
        </div>
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Mô tả</label>
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} placeholder="Mô tả nội bộ / catalog..." className={fieldClass()} />
        </div>
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Mô tả tiếng Anh</label>
          <textarea value={form.descriptionEn} onChange={(e) => update("descriptionEn", e.target.value)} rows={3} placeholder="English description..." className={fieldClass()} />
        </div>
      </div>
    </Card>
  );
}

function VariantStep({ attributes, form, update }: { attributes: ProductAttribute[]; form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  const toggleAttribute = (attributeId: string) => {
    const selected = form.selectedAttributeIds.includes(attributeId);
    update("selectedAttributeIds", selected ? form.selectedAttributeIds.filter((id) => id !== attributeId) : [...form.selectedAttributeIds, attributeId]);
    if (selected) {
      const nextValues = { ...form.selectedValues };
      delete nextValues[attributeId];
      update("selectedValues", nextValues);
    }
  };

  const toggleValue = (attributeId: string, value: string) => {
    const current = form.selectedValues[attributeId] ?? [];
    update("selectedValues", {
      ...form.selectedValues,
      [attributeId]: current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    });
  };

  return (
    <Card>
      <SectionTitle title="Thuộc tính biến thể" description="Chọn các trục biến thể từ master data; hệ thống sẽ sinh ma trận SKU từ tổ hợp value." />
      <div className="mb-3 flex justify-end">
        <Link href="/admin/variants" className="text-[0.8125rem] font-medium text-accent hover:underline">
          Quản lý thuộc tính biến thể →
        </Link>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {attributes.map((attr) => {
          const active = form.selectedAttributeIds.includes(attr.attributeId);
          const values = form.selectedValues[attr.attributeId] ?? [];
          return (
            <div key={attr.attributeId} className={cn("rounded-[var(--r-sm)] border p-3", active ? "border-accent/40 bg-accent/5" : "border-border-default bg-bg-surface")}>
              <label className="flex items-start gap-2">
                <input type="checkbox" checked={active} onChange={() => toggleAttribute(attr.attributeId)} className="mt-1 size-4 rounded border-border-default accent-accent" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink-primary">{attr.name.vi}</span>
                  <span className="block text-xs text-ink-tertiary">{attr.name.en} · {attr.attributeId}</span>
                </span>
              </label>
              {active && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {attr.values.map((value) => {
                    const checked = values.includes(value);
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => toggleValue(attr.attributeId, value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs transition-colors",
                          checked ? "border-accent bg-accent/10 text-accent" : "border-border-default bg-bg-subtle text-ink-secondary hover:bg-bg-muted"
                        )}
                      >
                        {attr.swatch?.[value] && <span className="size-2.5 rounded-full border border-border-default" style={{ backgroundColor: attr.swatch[value] }} />}
                        {value}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function SkuStep({ form, update, skuRows }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; skuRows: SkuPreviewRow[] }) {
  const existingSkuIds = new Set(skus.map((sku) => sku.skuId));
  const duplicates = new Set<string>();
  const seen = new Set<string>();
  for (const row of skuRows.filter((r) => r.enabled)) {
    if (seen.has(row.skuCode) || existingSkuIds.has(row.skuCode)) duplicates.add(row.skuCode);
    seen.add(row.skuCode);
  }

  const columns: ColumnDef<SkuPreviewRow>[] = [
    {
      key: "enabled",
      header: "Dùng",
      cell: (row) => (
        <input
          type="checkbox"
          checked={row.enabled}
          onChange={() => update("disabledSkuKeys", row.enabled ? [...form.disabledSkuKeys, row.key] : form.disabledSkuKeys.filter((key) => key !== row.key))}
          className="size-4 rounded border-border-default accent-accent"
        />
      ),
    },
    {
      key: "skuCode",
      header: "SKU preview",
      cell: (row) => (
        <div>
          <input
            value={row.skuCode}
            onChange={(e) => update("skuOverrides", { ...form.skuOverrides, [row.key]: normalizeCode(e.target.value) })}
            className={cn(fieldClass(duplicates.has(row.skuCode)), "font-[family-name:var(--font-mono)]")}
          />
          {duplicates.has(row.skuCode) && <div className="mt-1 text-xs text-danger">SKU trùng trong matrix hoặc mock data.</div>}
        </div>
      ),
    },
    {
      key: "variantLabel",
      header: "Tổ hợp",
      cell: (row) => <span className={cn("text-[0.8125rem]", row.enabled ? "text-ink-primary" : "text-ink-tertiary line-through")}>{row.variantLabel}</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      cell: () => <StatusBadge domain="sku" status="Active" size="sm" />,
    },
    {
      key: "cost",
      header: "Giá vốn",
      align: "right",
      cell: (row) => (
        <input
          value={form.skuCosts[row.key] ?? ""}
          onChange={(e) => update("skuCosts", { ...form.skuCosts, [row.key]: e.target.value })}
          inputMode="numeric"
          placeholder="85000"
          className={cn(fieldClass(), "w-[100px] text-right font-[family-name:var(--font-mono)] tabular-nums")}
          disabled={!row.enabled}
        />
      ),
    },
  ];

  return (
    <Card>
      <SectionTitle title="Ma trận SKU" description="SKU được sinh tự động từ tổ hợp biến thể; người dùng chỉ bật/tắt tổ hợp hợp lệ và kiểm tra mã duy nhất." />
      <DataTable
        data={skuRows}
        columns={columns}
        rowKey={(row) => row.key}
        caption={`Có ${skuRows.filter((row) => row.enabled).length} / ${skuRows.length} SKU được bật`}
        flagRow={(row) => !row.enabled || duplicates.has(row.skuCode)}
        pageSize={12}
      />
    </Card>
  );
}

function LogisticsStep({ form, update, showErrors, skuCount }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; showErrors: boolean; skuCount: number }) {
  return (
    <Card>
      <SectionTitle title="Thông số logistics" description={`Áp dụng làm default cho ${skuCount} SKU preview; dữ liệu này phục vụ Receipt, Slotting và Packing.`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Khối lượng (kg) <span className="text-danger">*</span></label>
          <input value={form.weightKg} onChange={(e) => update("weightKg", e.target.value)} inputMode="decimal" placeholder="0.25" className={fieldClass(showErrors && !parsePositiveNumber(form.weightKg))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Dài (cm) <span className="text-danger">*</span></label>
          <input value={form.lengthCm} onChange={(e) => update("lengthCm", e.target.value)} inputMode="decimal" placeholder="30" className={fieldClass(showErrors && !parsePositiveNumber(form.lengthCm))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Rộng (cm) <span className="text-danger">*</span></label>
          <input value={form.widthCm} onChange={(e) => update("widthCm", e.target.value)} inputMode="decimal" placeholder="22" className={fieldClass(showErrors && !parsePositiveNumber(form.widthCm))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Cao (cm) <span className="text-danger">*</span></label>
          <input value={form.heightCm} onChange={(e) => update("heightCm", e.target.value)} inputMode="decimal" placeholder="2" className={fieldClass(showErrors && !parsePositiveNumber(form.heightCm))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Pack size <span className="text-danger">*</span></label>
          <input value={form.packSize} onChange={(e) => update("packSize", e.target.value)} inputMode="numeric" placeholder="1" className={fieldClass(showErrors && !parsePositiveNumber(form.packSize))} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">UoM</label>
          <select value={form.uom} onChange={(e) => update("uom", e.target.value as Uom)} className={fieldClass()}>
            {(["pcs", "box", "kg", "m", "ream", "set"] satisfies Uom[]).map((uom) => <option key={uom} value={uom}>{uom}</option>)}
          </select>
        </div>
      </div>
    </Card>
  );
}

function InventoryStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return (
    <Card>
      <SectionTitle title="Kiểm soát tồn kho" description="Cấu hình batch/lot, hạn dùng, serial và ngưỡng bổ sung tồn cho SKU mới." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle p-3">
          {[
            ["lotTracking", "Theo dõi lô / batch"],
            ["serialTracking", "Theo dõi serial"],
            ["expiryTracking", "Theo dõi hạn dùng"],
          ].map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-[0.8125rem] text-ink-secondary">
              <input type="checkbox" checked={Boolean(form[key as keyof FormState])} onChange={(e) => update(key as keyof FormState, e.target.checked as never)} className="size-4 rounded border-border-default accent-accent" />
              {label}
            </label>
          ))}
          {form.expiryTracking && !form.lotTracking && (
            <div className="rounded-[var(--r-sm)] border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              Hàng có hạn dùng thường nên bật theo dõi lô để truy xuất nguồn gốc.
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-secondary">Reorder point</label>
            <input value={form.reorderPoint} onChange={(e) => update("reorderPoint", e.target.value)} inputMode="numeric" placeholder="20" className={fieldClass(!parseNonNegativeNumber(form.reorderPoint))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-secondary">Tồn tối đa</label>
            <input value={form.maxStock} onChange={(e) => update("maxStock", e.target.value)} inputMode="numeric" placeholder="200" className={fieldClass(!parseNonNegativeNumber(form.maxStock))} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function CustomizationStep({ form, update, showErrors }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void; showErrors: boolean }) {
  const addPrintArea = () => {
    update("printAreas", [
      ...form.printAreas,
      { id: `PA-${Date.now()}`, name: "Vùng in mới", position: "front", widthMm: "280", heightMm: "380", minDpi: "150" },
    ]);
  };

  const updatePrintArea = (id: string, patch: Partial<PrintAreaDraft>) => {
    update("printAreas", form.printAreas.map((area) => (area.id === id ? { ...area, ...patch } : area)));
  };

  if (form.type === "Standard") {
    return (
      <Card>
        <SectionTitle title="Tùy chỉnh" description="Sản phẩm Standard không yêu cầu print area hoặc template preview." />
        <div className="rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-4 py-6 text-center text-[0.8125rem] text-ink-secondary">
          Bước này được bỏ qua cho sản phẩm Standard.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <SectionTitle title="Cấu hình tùy chỉnh" description="Với sản phẩm in ấn, cần ít nhất một print area và template/model preview trước khi gửi duyệt." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Template 2D</label>
          <input value={form.templateName} onChange={(e) => update("templateName", e.target.value)} placeholder="template-tshirt-front.svg" className={fieldClass(showErrors && !form.templateName.trim() && !form.model3dUrl.trim())} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Model 3D</label>
          <input value={form.model3dUrl} onChange={(e) => update("model3dUrl", e.target.value)} placeholder="/mock/3d/tshirt.glb" className={fieldClass(showErrors && !form.templateName.trim() && !form.model3dUrl.trim())} />
        </div>
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-xs font-medium text-ink-secondary">Print areas <span className="text-danger">*</span></label>
            <button type="button" onClick={addPrintArea} className="inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-border-default px-2 py-1 text-xs font-medium text-ink-secondary hover:bg-bg-muted">
              <Plus className="size-3" /> Thêm vùng in
            </button>
          </div>
          <div className="space-y-2">
            {form.printAreas.length === 0 && (
              <div className={cn("rounded-[var(--r-sm)] border px-4 py-6 text-center text-[0.8125rem]", showErrors ? "border-danger/30 bg-danger/5 text-danger" : "border-border-default bg-bg-subtle text-ink-tertiary")}>Chưa có print area.</div>
            )}
            {form.printAreas.map((area) => (
              <div key={area.id} className="grid gap-2 rounded-[var(--r-sm)] border border-border-default bg-bg-subtle p-3 md:grid-cols-[1fr_130px_100px_100px_80px_auto]">
                <input value={area.name} onChange={(e) => updatePrintArea(area.id, { name: e.target.value })} className={fieldClass()} />
                <select value={area.position} onChange={(e) => updatePrintArea(area.id, { position: e.target.value as PrintAreaDraft["position"] })} className={fieldClass()}>
                  {PRINT_POSITIONS.map((position) => <option key={position.value} value={position.value}>{position.label}</option>)}
                </select>
                <input value={area.widthMm} onChange={(e) => updatePrintArea(area.id, { widthMm: e.target.value })} placeholder="W mm" className={fieldClass()} />
                <input value={area.heightMm} onChange={(e) => updatePrintArea(area.id, { heightMm: e.target.value })} placeholder="H mm" className={fieldClass()} />
                <input value={area.minDpi} onChange={(e) => updatePrintArea(area.id, { minDpi: e.target.value })} placeholder="DPI" className={fieldClass()} />
                <button type="button" onClick={() => update("printAreas", form.printAreas.filter((item) => item.id !== area.id))} className="flex size-8 items-center justify-center rounded-[var(--r-sm)] border border-danger/30 text-danger hover:bg-danger/10">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-2">
          <label className="mb-2 block text-xs font-medium text-ink-secondary">Kỹ thuật in cho phép</label>
          <div className="flex flex-wrap gap-1.5">
            {PRINT_TECHNIQUES.map((technique) => {
              const active = form.allowedTechniques.includes(technique);
              return (
                <button key={technique} type="button" onClick={() => update("allowedTechniques", active ? form.allowedTechniques.filter((t) => t !== technique) : [...form.allowedTechniques, technique])} className={cn("rounded-full border px-2 py-0.5 text-xs", active ? "border-accent bg-accent/10 text-accent" : "border-border-default bg-bg-subtle text-ink-secondary")}>{technique}</button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CatalogStep({ form, update }: { form: FormState; update: <K extends keyof FormState>(key: K, value: FormState[K]) => void }) {
  return (
    <Card>
      <SectionTitle title="Dữ liệu TMĐT" description="Thông tin catalog có thể bổ sung sau; module này chỉ lưu mock và không publish thật." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-secondary">Ảnh mock URLs</label>
          <textarea value={form.imageUrls} onChange={(e) => update("imageUrls", e.target.value)} rows={3} placeholder="/mock/img/new-1.jpg\n/mock/img/new-2.jpg" className={fieldClass()} />
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-secondary">SEO title</label>
            <input value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} placeholder="Áo thun cotton in theo yêu cầu" className={fieldClass()} />
          </div>
          <div>
            <label className="flex items-center gap-2 text-[0.8125rem] text-ink-secondary">
              <input type="checkbox" checked={form.catalogVisible} onChange={(e) => update("catalogVisible", e.target.checked)} className="size-4 rounded border-border-default accent-accent" />
              Đánh dấu sẵn sàng hiển thị catalog sau khi Published
            </label>
          </div>
        </div>
        <div className="lg:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink-secondary">SEO description</label>
          <textarea value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} rows={3} placeholder="Mô tả ngắn phục vụ catalog..." className={fieldClass()} />
        </div>
      </div>
    </Card>
  );
}

function ReviewStep({ form, skuRows, issuesByStep, submitted, onSubmit }: { form: FormState; skuRows: SkuPreviewRow[]; issuesByStep: Map<StepKey, string[]>; submitted: boolean; onSubmit: () => void }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card>
        <SectionTitle title="Rà soát trước khi gửi duyệt" description="Tổng hợp dữ liệu chính và các lỗi còn chặn submit." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SummaryItem label="Mã sản phẩm" value={form.productCode || "—"} mono />
          <SummaryItem label="Tên sản phẩm" value={form.name || "—"} />
          <SummaryItem label="Loại" value={form.type} />
          <SummaryItem label="Danh mục" value={form.categoryId || "—"} mono />
          <SummaryItem label="SKU được bật" value={String(skuRows.length)} mono />
          <SummaryItem label="SKU có giá vốn" value={`${Object.values(form.skuCosts).filter((v) => v.trim() !== "" && parsePositiveNumber(v)).length} / ${skuRows.length}`} mono />
        </div>
        <div className="mt-5 rounded-[var(--r-sm)] border border-border-default">
          {STEPS.map((step) => {
            const issues = issuesByStep.get(step.key) ?? [];
            const skipped = step.key === "customization" && form.type === "Standard";
            return (
              <div key={step.key} className="flex items-start gap-3 border-b border-border-default px-3 py-2 last:border-b-0">
                <div className={cn("mt-0.5 flex size-5 items-center justify-center rounded-full", issues.length ? "bg-danger/10 text-danger" : "bg-positive/10 text-positive")}>{issues.length ? <X className="size-3" /> : <CheckCircle className="size-3" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[0.8125rem] font-medium text-ink-primary">{step.label}{skipped ? " · bỏ qua" : ""}</div>
                  {issues.length ? <div className="mt-0.5 text-xs text-danger">{issues.join(" · ")}</div> : <div className="mt-0.5 text-xs text-ink-tertiary">Sẵn sàng</div>}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
      <Card className="h-fit">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.08em] text-ink-tertiary">Lifecycle</div>
            <div className="mt-1"><StatusBadge domain="product" status={submitted ? "Pending Approval" : "Draft"} withIcon /></div>
          </div>
          <Settings2 className="size-5 text-accent" />
        </div>
        <p className="text-[0.8125rem] leading-relaxed text-ink-secondary">
          `Gửi duyệt` chỉ cập nhật trạng thái preview trong UI. Không có API call và không thêm record vào mock data.
        </p>
        <button type="button" onClick={onSubmit} className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-[var(--r-sm)] bg-brand px-3 py-2 text-[0.8125rem] font-medium text-ink-inverse transition-colors hover:bg-brand-hover">
          <Send className="size-3.5" />
          Gửi duyệt
        </button>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-[var(--r-sm)] border border-border-default bg-bg-subtle px-3 py-2">
      <div className="text-xs text-ink-tertiary">{label}</div>
      <div className={cn("mt-1 truncate text-[0.8125rem] font-medium text-ink-primary", mono && "font-[family-name:var(--font-mono)] tabular-nums")}>{value}</div>
    </div>
  );
}

function validateForm(form: FormState, selectedEntries: { attr: ProductAttribute; values: string[] }[], skuRows: SkuPreviewRow[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!form.name.trim()) issues.push({ step: "draft", message: "Tên sản phẩm là bắt buộc." });
  if (!form.productCode.trim()) issues.push({ step: "draft", message: "Mã sản phẩm nội bộ là bắt buộc." });
  if (!form.categoryId) issues.push({ step: "draft", message: "Danh mục là bắt buộc." });
  if (!form.brand.trim()) issues.push({ step: "draft", message: "Thương hiệu là bắt buộc." });

  for (const entry of selectedEntries) {
    if (entry.values.length === 0) issues.push({ step: "variants", message: `${entry.attr.name.vi} cần chọn ít nhất một giá trị.` });
  }

  const enabledRows = skuRows.filter((row) => row.enabled);
  if (enabledRows.length === 0) issues.push({ step: "sku", message: "Cần ít nhất một SKU được bật." });
  const existingSkuIds = new Set(skus.map((sku) => sku.skuId));
  const seen = new Set<string>();
  for (const row of enabledRows) {
    if (!row.skuCode.trim()) issues.push({ step: "sku", message: "SKU code không được rỗng." });
    if (seen.has(row.skuCode) || existingSkuIds.has(row.skuCode)) issues.push({ step: "sku", message: `SKU ${row.skuCode} bị trùng.` });
    seen.add(row.skuCode);
  }

  if (!parsePositiveNumber(form.weightKg)) issues.push({ step: "logistics", message: "Khối lượng là bắt buộc và phải dương." });
  if (!parsePositiveNumber(form.lengthCm)) issues.push({ step: "logistics", message: "Chiều dài là bắt buộc và phải dương." });
  if (!parsePositiveNumber(form.widthCm)) issues.push({ step: "logistics", message: "Chiều rộng là bắt buộc và phải dương." });
  if (!parsePositiveNumber(form.heightCm)) issues.push({ step: "logistics", message: "Chiều cao là bắt buộc và phải dương." });
  if (!parsePositiveNumber(form.packSize)) issues.push({ step: "logistics", message: "Pack size là bắt buộc và phải dương." });

  if (!parseNonNegativeNumber(form.reorderPoint)) issues.push({ step: "inventory", message: "Reorder point không được âm." });
  if (!parseNonNegativeNumber(form.maxStock)) issues.push({ step: "inventory", message: "Tồn tối đa không được âm." });
  if (form.reorderPoint && form.maxStock && Number(form.reorderPoint) > Number(form.maxStock)) issues.push({ step: "inventory", message: "Reorder point không được lớn hơn tồn tối đa." });

  if (form.type === "Customizable") {
    if (form.printAreas.length === 0) issues.push({ step: "customization", message: "Sản phẩm Customizable cần ít nhất một print area." });
    if (!form.templateName.trim() && !form.model3dUrl.trim()) issues.push({ step: "customization", message: "Cần template 2D hoặc model 3D cho sản phẩm Customizable." });
    for (const area of form.printAreas) {
      if (!area.name.trim() || !parsePositiveNumber(area.widthMm) || !parsePositiveNumber(area.heightMm) || !parsePositiveNumber(area.minDpi)) {
        issues.push({ step: "customization", message: "Print area cần tên, kích thước và DPI hợp lệ." });
        break;
      }
    }
  }

  return issues;
}
