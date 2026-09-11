# [StockFlowCommerce] Production Frontend Rules

> File thứ hai của design system. `FRONTEND-AI-RULES.md` = **trông như thế nào** (token, component, layout).
> File này = **code như thế nào cho production** (kiến trúc, data layer, validation, state, permission, testing, CI).
>
> **Khi hai file mâu thuẫn về nghiệp vụ → `docs/` thắng. Khi mâu thuẫn về kỹ thuật → file này thắng.**
> Nguồn sự thật nghiệp vụ: `D:\FPTU\Capstone\docs\docs\` (18 module, `00-system-overview`, `glossary`, `open-questions`).

---

## 0. Nguyên tắc bất di bất dịch

1. **Mỗi `BR-xx` trong docs phải truy vết được trong code.** Validate nghiệp vụ → `zod.refine` kèm comment `// BR-04 (03-receipt)`. Action-gating → transition table kèm comment BR. Không có rule "tự nghĩ ra".
2. **Component không biết data đến từ đâu.** Component nhận props typed. Data fetch ở hook `use*Query` / mutation ở `use*Mutation`. Không `import { purchaseOrders } from "@/lib/mock-data"` trong page/component.
3. **Ba loại state, ba công cụ, không lẫn:** server state → React Query; UI state toàn cục → zustand; filter/sort/pagination/tab → **URL search params** (shareable, back/forward hoạt động). Không dùng `localStorage` cho filter bảng.
4. **Type là tường lửa biên giới.** Response API qua `zod.parse` trước khi vào React. Không `any`, không `as unknown as`, không `@ts-expect-error` trừ khi có comment lý do + issue.
5. **Không nghiệp vụ trong render.** Không `.filter()` / `.reduce()` tính KPI ngay trong component. Vào `lib/selectors/*` (pure, test được).
6. **Docs thay đổi → code thay đổi cùng lượt.** Thêm trạng thái mới: cập nhật union type, `status-map.ts`, transition table, mock, test — trong **một commit**.
7. **Không bịa con số.** Số liệu demo derive từ data thật (mock hoặc API). Không hardcode `1245 đơn` trong JSX.

---

## 1. Kiến trúc thư mục (feature-based)

Cấu trúc hiện tại (`app/admin/*/page.tsx` chứa mọi thứ 300–400 dòng) **phải refactor** sang:

```
src/
├── app/
│   ├── (backoffice)/admin/
│   │   ├── page.tsx                    # Dashboard — mỏng, chỉ compose
│   │   ├── purchase-orders/
│   │   │   ├── page.tsx                # ~40 dòng: <PurchaseOrderList />
│   │   │   ├── create/page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── loading.tsx             # skeleton route
│   │   │   └── error.tsx               # error boundary route
│   │   └── ...
│   └── (storefront)/...
├── features/                           # ★ NGHIỆP VỤ SỐNG Ở ĐÂY
│   ├── purchase-order/                 # = module 02
│   │   ├── api.ts                      # axios calls: listPurchaseOrders, getPurchaseOrder, submitPo...
│   │   ├── schemas.ts                  # zod: PoDto, PoCreateInput, PoLineInput (+ BR refines)
│   │   ├── types.ts                    # export type from schemas (z.infer)
│   │   ├── queries.ts                  # usePurchaseOrders(params), usePurchaseOrder(id), queryKeys
│   │   ├── mutations.ts                # useSubmitPo(), useApprovePo()... + invalidation
│   │   ├── lifecycle.ts                # PO_TRANSITIONS + allowedActions(status, role)
│   │   ├── selectors.ts                # computePoStats(list), openQuantity(line) — PURE
│   │   ├── components/
│   │   │   ├── PurchaseOrderList.tsx    # page-level, dùng shared DataTable
│   │   │   ├── PurchaseOrderFilters.tsx # nuqs-bound
│   │   │   ├── PurchaseOrderTable.tsx   # columns
│   │   │   ├── PoDetailHeader.tsx
│   │   │   ├── PoLinesTable.tsx
│   │   │   └── PoTimeline.tsx
│   │   └── index.ts                    # public API của feature
│   ├── receipt/                        # 03
│   ├── invoice/                        # 04
│   └── ...                             # 01..18, 1 feature = 1 module docs
├── components/
│   ├── ui/                             # shadcn nguyên bản — KHÔNG sửa tay
│   ├── shared/                         # §6.2 FRONTEND-AI-RULES — KHÔNG nghiệp vụ
│   ├── backoffice/                     # shell, map, scan-input...
│   └── storefront/
├── lib/
│   ├── api/
│   │   ├── client.ts                   # axios instance, baseURL, interceptors
│   │   ├── error.ts                    # ApiError class + parse
│   │   ├── query-client.ts             # TanStack Query config + defaults
│   │   └── mock-adapter.ts             # ★ bật khi NEXT_PUBLIC_USE_MOCK=true
│   ├── domain/
│   │   ├── status-map.ts               # tone + label (đã có)
│   │   ├── lifecycle.ts                # transition tables MỌI module
│   │   ├── permissions.ts              # Role Registry → can(role, action)
│   │   └── uom.ts                      # quy đổi đơn vị (docs 05: quantityBase vs handlingUnit)
│   ├── format/
│   │   ├── money.ts                    # formatVND, formatMoney(amount, currency)
│   │   ├── date.ts                     # formatDate, formatDateTime, isOverdue
│   │   └── number.ts                   # formatCompact, tabular helpers
│   ├── references/                     # lookup dùng chung (thay .find() rải rác)
│   │   └── index.ts                    # useSupplierName(id), useWarehouseName(id) — từ cache
│   ├── validation/
│   │   └── primitives.ts               # vnd, vndAmount, isoDate, futureDate, barcode, locationCode
│   ├── store/
│   │   ├── use-app-store.ts            # zustand: warehouse, sidebar, theme, locale
│   │   └── use-table-prefs.ts          # zustand persist: cột ẩn/hiện, density (KHÔNG phải filter)
│   └── utils.ts                        # cn() — dùng CÁI NÀY, không import "cn" package
├── hooks/
│   ├── use-url-filters.ts              # nuqs wrapper: status[], q, page, sort
│   ├── use-scan-input.ts               # barcode: auto-focus, beep/flash, Enter
│   ├── use-debounced-value.ts
│   └── use-mobile.ts
├── providers/
│   └── app-providers.tsx               # QueryClientProvider + ThemeProvider + nuqs + Toaster
└── test/
    ├── setup.ts
    ├── mocks/handlers.ts               # MSW handlers (fallback data = mock-data.ts)
    └── render.tsx                      # renderWithProviders
```

**Quy tắc đặt tên:** folder feature = kebab-case trùng tên module docs (`purchase-order` ↔ `docs/warehouse/02-purchase-order`). Mỗi file feature ≤ 200 dòng; component ≤ 150 dòng. Vượt → tách.

**Import boundaries** (enforce bằng `eslint-plugin-boundaries` hoặc `import/no-restricted-paths`):
- `features/A` KHÔNG import `features/B` — dùng `lib/domain` hoặc prop drilling qua page.
- `components/shared` KHÔNG import `features/*` hay `lib/api/*`.
- `app/**/page.tsx` chỉ import `features/*` + `components/*`.

---

## 2. Data layer — axios + React Query (backend thật)

### 2.1 axios client

```ts
// lib/api/client.ts
import axios, { AxiosError } from "axios";
import { ApiError } from "./error";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,           // cookie auth
});

api.interceptors.request.use((cfg) => {
  const wh = useAppStore.getState().warehouseId;   // kho đang chọn — header xuyên suốt
  if (wh) cfg.headers.set("X-Warehouse-Id", wh);
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiErrorBody>) => Promise.reject(ApiError.from(err)),
);
```

`ApiError` chuẩn hoá: `{ status, code, message, fieldErrors?: Record<string,string>, traceId? }`. `fieldErrors` map thẳng vào RHF `setError` (§4.4).

### 2.2 Query convention

```ts
// features/purchase-order/queries.ts
export const poKeys = {
  all: ["purchase-orders"] as const,
  list: (p: PoListParams) => [...poKeys.all, "list", p] as const,
  detail: (id: string) => [...poKeys.all, "detail", id] as const,
  revisions: (id: string) => [...poKeys.all, "revisions", id] as const,
};

export function usePurchaseOrders(params: PoListParams) {
  return useQuery({
    queryKey: poKeys.list(params),
    queryFn: ({ signal }) => listPurchaseOrders(params, signal),   // truyền signal để cancel
    placeholderData: keepPreviousData,                             // không flash khi đổi filter
    staleTime: 30_000,
  });
}
```

| Query | staleTime | gcTime | refetchOnWindowFocus |
|---|---|---|---|
| List chứng từ | 30s | 5m | true |
| Detail | 60s | 10m | true |
| Master data (products, suppliers, warehouses, locations) | 10m | 30m | false |
| Dashboard KPI | 15s | 2m | true |
| Tracking/shipment (webhook-driven) | 10s | 2m | true |

**Server-side pagination/filter/sort là mặc định.** Params gửi API: `{ page, pageSize, sort, status[], q, warehouseId, dateFrom, dateTo }`. KHÔNG fetch 500 dòng rồi filter ở client.

### 2.3 Mutation + invalidation map (theo liên kết module docs)

Mỗi mutation khai báo invalidation **đúng theo bảng "Liên kết với các module khác"** trong docs:

```ts
// features/receipt/mutations.ts
export function useConfirmReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfirmReceiptInput) => confirmReceipt(input),
    onSuccess: (data, vars) => {
      qc.invalidateQueries({ queryKey: receiptKeys.detail(vars.receiptId) });
      qc.invalidateQueries({ queryKey: receiptKeys.all });
      // docs 03 §7: Receipt Confirmed → cập nhật SL đã nhận + trạng thái PO
      qc.invalidateQueries({ queryKey: poKeys.detail(data.purchaseOrderId) });
      qc.invalidateQueries({ queryKey: poKeys.all });
      // docs 03 §4.7: sinh nhiệm vụ Putaway cho phần Accepted
      qc.invalidateQueries({ queryKey: putawayKeys.all });
      // tồn ở inbound area thay đổi → map/heatmap + dashboard
      qc.invalidateQueries({ queryKey: locationKeys.all });
      qc.invalidateQueries({ queryKey: dashboardKeys.overview });
      toast.success("Đã xác nhận phiếu nhận");
    },
    onError: (e: ApiError) => toast.error("Không xác nhận được", e.message),
  });
}
```

**Bảng invalidation bắt buộc** (rút từ docs §7 mỗi module):

| Mutation | Invalidate | Nguồn docs |
|---|---|---|
| PO Confirm / Cancel | po detail+list, replenishment list | 02 §7 |
| Receipt Confirm | receipt, po detail, putaway list, locations, dashboard | 03 §4.7, §7 |
| Putaway Complete | putaway, locations, inventory, warehouse-map, dashboard | 05 §3 Output |
| Invoice Match/Approve | invoice, po detail (điều kiện Closed) | 04 §4.9, §7 |
| Pick Complete / Short | pick, orders detail, packing list, locations | 07 §3 Output |
| Pack Complete | packing, shipments, orders detail | 08 §3 Output |
| Shipment Handover / status webhook | shipment, orders detail, manifest, payments (COD) | 09 §7 |
| Transfer Dispatch / Receive | transfer, locations (2 kho), inventory in-transit, putaway | 10 §4, §7 |
| Move Complete | move, locations, inventory | 11 §3 Output |
| RMA approve / refund | rma, orders, payments, inventory | 17 |

**Optimistic update:** chỉ dùng cho toggle thuần UI (column visibility) và tracking refresh. **Không** optimistic cho transition trạng thái chứng từ — rủi ro lệch docs BR, để server quyết.

### 2.4 Mock adapter (chạy song song khi chưa có API)

```ts
// lib/api/mock-adapter.ts
if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
  api.defaults.adapter = mockAdapter;   // route → đọc mockDb, delay 200–500ms, 5% lỗi ngẫu nhiên
}
```
Adapter mô phỏng **đúng contract**: phân trang, lỗi 400/404/422 (kèm `fieldErrors`), latency. Nhờ vậy component/hook **không đổi một dòng** khi backend thật sẵn sàng. `mock-data.ts` chỉ được adapter này import — không nơi nào khác.

---

## 3. Types & Zod schemas — BR traceable

### 3.1 Hai lớp schema, không trộn

```ts
// features/purchase-order/schemas.ts

/** DTO — response từ API. Strict: field lạ → lỗi (phát hiện contract drift). */
export const PoLineDto = z.object({
  lineId: z.string(),
  skuId: z.string(),
  orderedQty: z.number().int().positive(),
  receivedQty: z.number().int().nonnegative(),
  unitPrice: z.number().nonnegative(),
  uom: UomSchema,
}).strict();

export const PurchaseOrderDto = z.object({
  poId: z.string(), poNumber: z.string(), supplierId: z.string(), warehouseId: z.string(),
  status: PoStatusSchema,              // union từ docs 02 §5 — NGUYÊN VĂN
  currency: z.enum(["VND", "USD"]),
  expectedDate: z.string().date(),
  grandTotal: z.number(),
  lines: z.array(PoLineDto).min(1),    // docs 02 §3: ≥ 1 dòng
  revision: z.number().int().nonnegative(),
}).strict();

/** Input — form gửi lên. Chứa BR refine. */
export const PoCreateInput = z.object({
  supplierId: z.string().min(1, "Chọn nhà cung cấp"),
  warehouseId: z.string().min(1, "Chọn kho nhận"),
  expectedDate: z.string().date(),
  lines: z.array(PoLineInput).min(1, "PO phải có ít nhất 1 dòng hàng"),  // 02 §3
}).superRefine((v, ctx) => {
  // BR-06 (02): ngày giao dự kiến trong quá khứ → cảnh báo, KHÔNG chặn
  if (isPast(v.expectedDate)) ctx.addIssue({ code: "custom", path: ["expectedDate"],
    message: "Ngày giao dự kiến đã qua", fatal: false, params: { severity: "warning" } });
});
```

`PoStatusSchema` sinh từ **cùng một nguồn** với `status-map.ts` để không lệch:
```ts
export const PO_STATUSES = ["Draft","Pending Approval","Approved","Confirmed",
  "Partially Received","Received","Closed","Cancelled"] as const;   // docs 02 §5
export const PoStatusSchema = z.enum(PO_STATUSES);
export type PoStatus = z.infer<typeof PoStatusSchema>;
```

### 3.2 Parse tại biên

```ts
// features/purchase-order/api.ts
export async function listPurchaseOrders(p: PoListParams, signal?: AbortSignal) {
  const { data } = await api.get("/purchase-orders", { params: p, signal });
  return z.object({ items: z.array(PurchaseOrderDto), total: z.number(),
                    page: z.number(), pageSize: z.number() }).parse(data);
}
```
Zod throw → React Query `error` → `error.tsx` hiển thị "Dữ liệu không đúng định dạng" + traceId. **Không** silently fallback.

### 3.3 Validation primitives tái sử dụng

```ts
// lib/validation/primitives.ts
export const vnd = (msg = "Số tiền không hợp lệ") => z.number().int(msg).nonnegative(msg);
export const qty = (uom: Uom) => uom === "kg" ? z.number().positive() : z.number().int().positive();
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const expiryAfter = (receiveDate: string) => isoDate.refine(d => d > receiveDate,
  "Hạn dùng phải sau ngày nhận");                        // BR-06 (03)
export const locationCode = z.string().regex(/^LOC-[A-Z]{2,3}-/);
export const barcode = z.string().min(4).max(64);
```

**BR quan trọng phải encode** (không bỏ sót):

| BR | Schema |
|---|---|
| 02 BR-04 | `receivedQty ≤ orderedQty × (1 + overReceiptTolerance)` |
| 02 BR-07 | `lines` cùng currency với PO — `superRefine` |
| 03 BR-03 | SKU theo lô/serial → `lotId`/`serialIds` bắt buộc (refine theo product config) |
| 03 BR-06 | `expiryDate > receivedDate` |
| 04 BR-02 | `invoiceQty ≤ acceptedReceivedQty − matchedByOtherInvoices` |
| 04 BR-04 | `(supplierId, vendorInvoiceNo)` unique |
| 05 BR-03/04 | capacity + single-SKU/single-lot — server-side là chính, client cảnh báo sớm |
| 10 BR-01 | `fromWarehouseId !== toWarehouseId` |
| 11 BR-01 | `fromLocation.warehouseId === toLocation.warehouseId` |

---

## 4. Forms — react-hook-form + zodResolver

### 4.1 Chuẩn chung

```tsx
const form = useForm<PoCreateInput>({
  resolver: zodResolver(PoCreateInput),
  mode: "onBlur",                    // §4.3 FRONTEND-AI-RULES: validate realtime
  defaultValues: { lines: [emptyLine] },
});
```
- Mọi input qua shadcn `<FormField>` / `<Controller>` — không `onChange` tay vào local state.
- Label gắn `htmlFor`, error có `aria-describedby`, input lỗi `aria-invalid`.
- Auto-focus field đầu tiên khi mở form/dialog; `Esc` đóng; `Enter` submit (trừ textarea).
- Nút submit `disabled={!form.formState.isValid || mutation.isPending}` + spinner.
- Dirty-guard: rời trang khi `formState.isDirty` → `<ConfirmDialog>` "Chưa lưu thay đổi".

### 4.2 Form động (PO lines / receipt lines / package lines)

```tsx
const { fields, append, remove } = useFieldArray({ control, name: "lines" });
```
- `append` thêm dòng trống, focus ô SKU (combobox tìm theo `skuCode`/`name`).
- Xoá dòng: `remove(i)` + `ConfirmDialog` nếu dòng đã có dữ liệu.
- Tổng tiền (`subtotal`, `tax`, `discount`, `grandTotal`) tính bằng `useWatch` + selector pure — **không** tính trong JSX.
- Với receipt: **một dòng PO có thể tách nhiều lô** (docs 03 §4.4) → nested field array `lines[].lots[]`.

### 4.3 Multi-step wizard

Checkout (14), Product Creation (01), Receipt (03) dùng `<Wizard>`:
```tsx
const steps = [{ id: "identity", schema: Step1Schema, component: Step1 }, ...];
```
- Mỗi step một schema zod riêng; `Next` chỉ validate step hiện tại.
- State wizard: `useRef` + React context, **không** zustand (không cần toàn cục), **không** URL (tránh user nhảy step).
- Progress bar + cho phép quay lại step đã hoàn thành (dữ liệu giữ nguyên).
- Submit ở step cuối, mutation 1 lần.

### 4.4 Lỗi từ server

```ts
onError: (e: ApiError) => {
  if (e.fieldErrors) for (const [k, msg] of Object.entries(e.fieldErrors))
    form.setError(k as Path<T>, { type: "server", message: msg });
  else toast.error(e.message);
}
```
Lỗi 409 (conflict — ví dụ SKU trùng, hoá đơn trùng BR-04) hiển thị inline đúng field, không toast chung chung.

### 4.5 Scan input (module 03/05/07/08/10/11)

`useScanInput({ onScan, validate })`: auto-focus, buffer ký tự, phát hiện suffix `Enter`/`Tab` của máy quét, debounce 40ms để phân biệt gõ tay, feedback `navigator.vibrate` + flash màu (xanh/vàng/đỏ) + âm thanh (tôn trọng `prefers-reduced-motion` và mute toggle). Quét sai → rung + toast + không commit.

---

## 5. State management — ranh giới rõ

| Loại state | Công cụ | Ví dụ |
|---|---|---|
| Server state | **React Query** | danh sách PO, detail order, KPI |
| UI state toàn cục | **zustand** | `warehouseId` đang chọn, sidebar collapsed, theme, locale, mute sound |
| UI state cục bộ | `useState` | dialog mở/đóng, row đang expand |
| Filter/sort/page/tab | **URL (`nuqs`)** | `?status=Draft,Confirmed&q=PO-2026&page=2&sort=-expectedDate` |
| Sở thích bảng (cột ẩn, density) | zustand + `persist` | KHÔNG phải filter |
| Form state | RHF | — |

```ts
// hooks/use-url-filters.ts
export function useListFilters(statusEnum: readonly string[]) {
  const [status, setStatus] = useQueryState("status",
    parseAsArrayOf(parseAsStringLiteral(statusEnum)).withDefault([]));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault(""));
  const debouncedQ = useDebouncedValue(q, 300);
  return { status, setStatus, q: debouncedQ, page, setPage, sort, setSort,
           reset: () => { setStatus([]); setQ(""); setPage(1); setSort(""); } };
}
```
Đổi filter → `setPage(1)` tự động. Lợi ích: link gửi được cho đồng nghiệp, F5 giữ nguyên, back/forward đúng, không rác localStorage.

**Warehouse selector (zustand)** ảnh hưởng toàn app: đổi kho → `queryClient.invalidateQueries()` toàn bộ list queries (vì `X-Warehouse-Id` đổi). Persist `warehouseId` qua `zustand/middleware`.

---

## 6. State machine & action-gating (docs là nguồn)

### 6.1 Transition table — một file, mọi module

```ts
// lib/domain/lifecycle.ts
import { match } from "ts-pattern";

export const PO_TRANSITIONS = {
  "Draft":             ["Pending Approval", "Approved", "Cancelled"],
  "Pending Approval":  ["Approved", "Draft"],
  "Approved":          ["Confirmed", "Cancelled"],
  "Confirmed":         ["Partially Received", "Received", "Cancelled", "Closed"],
  "Partially Received":["Received", "Closed"],
  "Received":          ["Closed"],
  "Closed":            [], "Cancelled": [],
} as const satisfies Record<PoStatus, readonly PoStatus[]>;
// Nguồn: docs/warehouse/02-purchase-order §5 — bảng "Chuyển tiếp cho phép"

export const isTerminal = <S extends string>(t: Record<S, readonly S[]>, s: S) => t[s].length === 0;
export const canTransition = <S extends string>(t: Record<S, readonly S[]>, from: S, to: S) =>
  (t[from] as readonly string[]).includes(to);
```

Bắt buộc đủ **13 transition table**: `PRODUCT`, `SKU`, `PO`, `RECEIPT`, `QC_LOT`, `INVOICE`, `PUTAWAY`, `SUGGESTION`, `RESLOT_PROPOSAL`, `PICK`, `PACK`, `SHIPMENT`, `INTER_TRANSFER`, `MOVE`, `ORDER`, `PAYMENT`, `RMA`, `CONVERSATION`, `DESIGN` (đúng union trong `mock-data.ts` / docs).

### 6.2 Action descriptor (thay if/else rải trong JSX)

```ts
export type PoAction =
  | { id: "submit";  label: "Gửi duyệt";   to: "Pending Approval"; role: "Procurement Staff"; variant: "primary" }
  | { id: "approve"; label: "Duyệt";       to: "Approved";         role: "Approver";          variant: "primary" }
  | { id: "reject";  label: "Từ chối";     to: "Draft";            role: "Approver";          variant: "destructive"; requiresReason: true }
  | { id: "confirm"; label: "Chốt PO";     to: "Confirmed";        role: "Procurement Staff"; variant: "primary" }
  | { id: "revise";  label: "Tạo revision"; to: null;              role: "Procurement Staff"; variant: "outline" }   // BR-02 (02)
  | { id: "cancel";  label: "Huỷ";         to: "Cancelled";        role: "Procurement Staff"; variant: "destructive"; requiresReason: true };

export function allowedPoActions(status: PoStatus, role: Role): PoAction[] {
  return ALL_PO_ACTIONS.filter(a =>
    canTransition(PO_TRANSITIONS, status, a.to ?? status) || (a.id === "revise" && !isTerminal(PO_TRANSITIONS, status))
  ).filter(a => a.role === role || role === "System Admin");
}
```
JSX chỉ còn: `{actions.map(a => <ActionButton key={a.id} {...a} />)}`. `requiresReason` → mở `<ReasonCodePicker>` (bắt buộc, §4.3 FRONTEND-AI-RULES). Trạng thái terminal → mảng rỗng → không render nút mutating.

`<ActionButton>` tự xử lý: `ConfirmDialog` cho `variant: "destructive"`, `disabled` khi mutation pending, toast kết quả.

---

## 7. Permission & Role (00-system-overview §2)

```ts
// lib/domain/permissions.ts
export const ROLES = ["System Admin","Procurement Staff","Warehouse Staff","Warehouse Manager",
  "Inventory Planner","QC Staff","Accountant","E-commerce Admin","Sales Staff",
  "Order Coordinator","Customer"] as const;

export const PERMISSIONS = {
  "po.create":       ["Procurement Staff","System Admin"],
  "po.approve":      ["Approver","System Admin"],          // quyền phê duyệt, không phải chức danh (02 §2)
  "receipt.confirm": ["Warehouse Staff","Warehouse Manager","System Admin"],
  "invoice.approvePayment": ["Finance Approver","Accountant","System Admin"],
  "adjustment.approve": ["Warehouse Manager","System Admin"],
  "slotting.override": ["Warehouse Staff","Warehouse Manager","System Admin"],
  "transfer.approve": ["Approver","System Admin"],
} as const;

export const can = (role: Role, perm: Permission) =>
  role === "System Admin" || PERMISSIONS[perm].includes(role);
```

- `<Can perm="po.approve">…</Can>` hoặc hook `useCan(perm)`.
- **UI-only**: ẩn/disable nút. Luôn kèm comment `// Backend phải re-check (BR-xx)` — không bao giờ tin client.
- Role hiện tại: `useSession()` (auth thật) hoặc `useAppStore(s => s.impersonatedRole)` khi dev/demo (dropdown "Xem với vai trò…" — hữu ích demo action-gating trước giảng viên).
- `Role Registry` docs có phân biệt **role đăng nhập** vs **vai thao tác (operational hat)** vs **quyền theo ngữ cảnh** → code phản ánh đúng 3 lớp, không gộp bừa.

---

## 8. Error, loading, empty — mọi trạng thái đều có UI

| Trạng thái | Xử lý |
|---|---|
| Loading lần đầu | `<Skeleton>` đúng shape layout (không spinner giữa trang trắng) |
| Refetch nền | `isFetching` → thanh progress mảnh dưới topbar, không che nội dung |
| Empty (chưa có data) | `<EmptyState>` + CTA ("Chưa có PO — Tạo đơn đầu tiên") |
| Empty (filter không khớp) | `<EmptyState>` khác: "Không tìm thấy kết quả" + nút "Bỏ bộ lọc" |
| Error 4xx | `<AlertInline>`/`error.tsx`: message server + nút "Thử lại"; 403 → "Bạn không có quyền" |
| Error 5xx / network | `error.tsx`: "Không kết nối được máy chủ" + traceId + Retry + link báo lỗi |
| Zod parse fail | `error.tsx`: "Dữ liệu trả về không đúng định dạng" (bug contract — log + traceId) |
| Mutating pending | Nút disabled + spinner; chặn double-submit |
| Offline | `navigator.onLine` false → banner "Mất kết nối — thay đổi chưa được lưu" |
| Stale (> staleTime×10) | badge "Dữ liệu cũ — Làm mới" với tracking/webhook-driven |

Bắt buộc có `app/(backoffice)/admin/error.tsx`, `not-found.tsx`, `loading.tsx` ở mỗi route nhóm. `QueryClient` default: `retry: 2` (backoff), **không retry** 4xx.

---

## 9. Performance

1. **RSC mặc định.** `page.tsx` là Server Component; chỉ `"use client"` cho file thật sự cần (table có sort/filter, form, chart). Fetch lần đầu ở server (`await queryClient.fetchQuery`) → không waterfall.
2. **Bảng lớn** (inventory, movements, logs > 500 dòng) → `@tanstack/react-virtual`, giữ nguyên `DataTable` API.
3. **Không import cả `mock-data.ts` (3366 dòng) vào client bundle** — chỉ adapter dùng, và adapter `dynamic(() => import(...))`.
4. **Code-split** theo route; `next/dynamic` cho `WarehouseMap` (canvas nặng), `LivePreview3D`, chart.
5. `useMemo`/`useCallback` **chỉ** khi có bằng chứng (React DevTools profiler) hoặc prop là dependency của `useEffect`/`useMemo` khác. Không memo phòng thân.
6. Ảnh: `next/image`, `sizes` đúng, ưu tiên AVIF/WebP, placeholder blur cho PDP.
7. Debounce search 300ms; abort query cũ bằng `AbortSignal`.
8. Ngân sách: LCP < 2.5s (storefront mobile 4G), INP < 200ms, bundle JS route đầu < 200KB gzip. Chạy `next build` đọc report mỗi PR.

---

## 10. Format tiền / ngày / số — MỘT chỗ

Xoá mọi `formatUSD`, `formatCompactVND`, `supplierName`, `warehouseName` định nghĩa trong page (hiện đang nhân bản ở 11 module).

```ts
// lib/format/money.ts
export const formatMoney = (amount: number, currency: Currency = "VND") =>
  new Intl.NumberFormat(currency === "USD" ? "en-US" : "vi-VN",
    { style: "currency", currency }).format(amount);
export const formatCompact = (amount: number, currency: Currency = "VND") => { /* tỷ ₫ / tr ₫ */ };

// lib/format/date.ts — luôn explicit timezone, không để lệch ngày
export const formatDate = (iso: string) => new Intl.DateTimeFormat("vi-VN",
  { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
export const isOverdue = (iso: string) => /* BR-06 (02): cảnh báo, không chặn */;

// lib/references/index.ts — lookup có cache, không .find() O(n) mỗi render
export function useSupplierName(id: string) {
  const { data } = useSuppliers();           // query master data, staleTime 10m
  return data?.byId[id]?.name ?? "—";
}
```

Quy tắc: tiền tệ **luôn** từ field `currency` của record (PO có thể USD — BR-07 module 02). Số lượng kèm `uom`. Số trong bảng: `tabular-nums` + căn phải. Ngày: `Asia/Ho_Chi_Minh`, format `vi-VN`.

---

## 11. Testing

```bash
npm i -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event
npm i -D @testing-library/jest-dom jsdom msw@2 @vitest/coverage-v8
```

| Loại | Phạm vi | Công cụ |
|---|---|---|
| Unit | `selectors.ts`, `lifecycle.ts`, `format/*`, zod schemas | Vitest |
| Component | `StatusBadge`, `DataTable`, `ActionButton`, `ScanInput` | RTL + jsdom |
| Feature | List page (filter→URL→table), Detail (action-gating), Form wizard | RTL + MSW |
| Contract | Zod parse fixture JSON thật từ backend | Vitest |
| E2E (sau) | Luồng PO→Receipt→Putaway, Order→Pick→Pack→Ship | Playwright |

**Test bắt buộc cho mọi module** (đây là phần ăn điểm capstone):

```ts
// features/purchase-order/__tests__/lifecycle.test.ts
describe("PO_TRANSITIONS (docs 02 §5)", () => {
  it("Draft → Pending Approval / Approved / Cancelled", () => { /* … */ });
  it("Closed là terminal — không transition nào", () => {
    expect(PO_TRANSITIONS.Closed).toEqual([]);
  });
  it("BR-05: Confirmed không thể Cancelled khi đã có Receipt", () => { /* … */ });
});

// features/purchase-order/__tests__/actions.test.tsx
it("Pending Approval + role Procurement → không thấy nút Duyệt (chỉ Approver)", () => { … });
it("Closed → không render nút mutating nào", () => { … });
```

Coverage target: `lib/domain/*` và `features/*/selectors|schemas|lifecycle` **≥ 90%**; component ≥ 70%. Không đặt target cho `app/**/page.tsx`.

`test/mocks/handlers.ts` (MSW) build từ `mock-data.ts` → fixture và demo dùng chung một nguồn, không lệch.

---

## 12. Tooling & CI

```bash
npm i -D husky lint-staged @commitlint/cli @commitlint/config-conventional
npm i -D eslint-plugin-boundaries eslint-plugin-import prettier prettier-plugin-tailwindcss
npx husky init
```

**Scripts `package.json`:**
```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "eslint src --max-warnings 0",
  "format": "prettier --write \"src/**/*.{ts,tsx,css}\"",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "coverage": "vitest run --coverage",
  "validate": "npm run typecheck && npm run lint && npm run test && npm run build"
}
```

**`.husky/pre-commit`** → `npx lint-staged`:
```json
{ "*.{ts,tsx}": ["eslint --fix --max-warnings 0", "prettier --write", "vitest related --run"],
  "*.{json,md,css}": ["prettier --write"] }
```
**`.husky/commit-msg`** → `commitlint --extends @commitlint/config-conventional`. Scope theo module: `feat(po): thêm action revision`, `fix(receipt): validate lot theo BR-03`, `docs(rules): cập nhật transition table`.

**GitHub Actions** (`.github/workflows/ci.yml`) mỗi PR: `typecheck` → `lint` → `test --coverage` → `build`. Fail nếu coverage `lib/domain` < 90%. Cache `node_modules` + `.next/cache`. Thêm step grep chống regression:
```bash
! grep -rn "from \"@/lib/mock-data\"" src/app src/components src/features || exit 1
! grep -rnE "#[0-9a-fA-F]{6}" src/app src/components src/features || exit 1   # cấm hex trần (§9 rules)
! grep -rn ": any" src --include="*.ts*" || exit 1
```

---

## 13. Refactor playbook — chuyển page hiện có sang chuẩn

Áp dụng cho từng module đã build (01–11). Thứ tự **bắt buộc**, mỗi module 1 PR:

| Bước | Việc làm | Kiểm chứng |
|---|---|---|
| 1 | Tạo `features/<module>/` + `schemas.ts` (zod, kèm BR comment) từ union type `mock-data.ts` | `npm run typecheck` |
| 2 | Tạo `lifecycle.ts` — chép bảng "Chuyển tiếp cho phép" + `stateDiagram-v2` từ docs; viết test | `vitest related` pass |
| 3 | Tạo `api.ts` + `queries.ts` + `mutations.ts`; thêm route vào `mock-adapter.ts` | chạy với `NEXT_PUBLIC_USE_MOCK=true` |
| 4 | Tách page: logic filter/stats/format → `selectors.ts` + `lib/format` + `use-url-filters`; JSX → `components/` | page.tsx ≤ 60 dòng |
| 5 | Nối action: `allowedActions(status, role)` + `<ActionButton>` + `<ReasonCodePicker>` | test action-gating |
| 6 | Thêm `loading.tsx`, `error.tsx`, EmptyState 2 loại | tắt mạng / sửa API URL sai → thấy UI đúng |
| 7 | Xoá `localStorage` config filter → URL; giữ column-prefs trong zustand persist | F5 + copy URL sang tab khác giữ state |
| 8 | Accessibility pass: focus-visible, aria, contrast, keyboard nav bảng | axe DevTools 0 violation |
| 9 | `npm run validate` + mở browser đối chiếu `components-preview.html` | build pass, screenshot |

**Ưu tiên refactor:** module có nhiều transition + BR nhất trước — `02 PO`, `03 Receipt`, `04 Invoice`, `09 Shipping` (đây là nơi action-gating và three-way matching thể hiện rõ nghiệp vụ). Module chỉ-đọc (`06 map`, `11 moves`) làm sau.

**Cấm khi refactor:** đổi tên field mock-data, đổi tên trạng thái, đổi token màu, sửa `components/ui/*`, gộp 2 module vào 1 feature.

---

## 14. Checklist trước khi coi một module là "production-ready"

- [ ] `features/<module>/` đủ 7 file (api, schemas, types, queries, mutations, lifecycle, selectors) + components tách riêng.
- [ ] Mọi `BR-xx` liên quan có mặt trong zod refine / transition table / test, kèm comment cite docs.
- [ ] Mọi trạng thái trong bảng lifecycle docs có trong transition table; terminal state không có nút mutating.
- [ ] Action-gating test pass cho ít nhất 3 role khác nhau.
- [ ] Không import `mock-data.ts` ngoài `lib/api/mock-adapter.ts` (CI grep pass).
- [ ] Filter/sort/page trên URL; không localStorage cho filter.
- [ ] `loading.tsx` + `error.tsx` + 2 EmptyState; offline banner.
- [ ] Tiền/ngày/số qua `lib/format`; lookup qua `lib/references`.
- [ ] Không `any`, không hex trần, không `!important`; typecheck + lint 0 warning.
- [ ] Test: lifecycle, selectors, 1 list page, 1 detail page, 1 form; coverage domain ≥ 90%.
- [ ] Dark mode + focus-visible + reduced-motion + responsive (A ≥1024 / B 320→1440).
- [ ] `npm run validate` pass.
- [ ] Đối chiếu visual với `components-preview.html`.
- [ ] Giả định chưa chốt trong `open-questions/` → comment `// ASSUMPTION (open-question Xn)` trong code.

---

## Phụ lục A — Tech stack đề xuất thêm (ngoài danh sách đã có)

Đã có: Next.js, Tailwind, shadcn/ui, Framer Motion, lucide, React Query, zod, RHF, axios, zustand.

| Thêm | Vì sao (gắn với docs) | Ưu tiên |
|---|---|---|
| **`nuqs`** | Filter/pagination trên URL thay localStorage — shareable, back/forward đúng | ★★★ |
| **`@tanstack/react-table`** | DataTable hiện tự viết; cần column pinning/grouping/virtual cho inventory | ★★★ |
| **`ts-pattern`** | `match()` exhaustive trên union status → compiler bắt thiếu nhánh lifecycle | ★★★ |
| **`date-fns`** | Tính FEFO, hạn dùng, overdue, lead time — `Intl` không đủ | ★★☆ |
| **`msw`** | Mock API contract-level; test + dev không cần backend | ★★★ |
| **`vitest` + RTL** | Test BR/lifecycle — phần chứng minh nghiệp vụ khi bảo vệ đề tài | ★★★ |
| **`@tanstack/react-virtual`** | Bảng tồn kho/movement hàng nghìn dòng | ★★☆ |
| **`sonner`** (đã có) | Toast — giữ, bọc trong `lib/toast` để thống nhất message | — |
| **`next-intl`** | Glossary yêu cầu nhãn song ngữ Việt–Anh; hiện hardcode chuỗi | ★★☆ |
| **`next-auth` / `better-auth`** | Role Registry cần auth thật để demo permission | ★★☆ |
| **`zod` → `zod/v4` + `@hookform/resolvers`** | Resolver chuẩn, error map tiếng Việt | ★★★ |
| **`eslint-plugin-boundaries`** | Chặn `features/A` import `features/B`, chặn shared import features | ★★☆ |
| **`husky` + `lint-staged` + `commitlint`** | Gate trước commit — CI sạch | ★★★ |
| **`@axe-core/react`** (dev only) | A11y tự động, §9 rules yêu cầu contrast/aria | ★★☆ |
| **`recharts`** | KPI dashboard, báo cáo module 06/09 | ★★☆ |
| **`three` + `@react-three/fiber` + `drei`** | Warehouse Map 3D (06) và Live Preview 3D (12) — **lazy load**, có fallback 2D theo §4.4/§5.2 | ★☆☆ (chỉ khi làm 3D) |
| **`konva` / `fabric.js`** | DesignCanvas 2D module 12 (print area, safe area, bleed, kéo-thả) | ★☆☆ |
| **`zustand` + `persist`** | Đã có zustand — thêm middleware cho warehouseId, column prefs | ★★★ |
| **`react-dropzone`** | Upload ảnh thiết kế (12), chứng từ PO/invoice (02/04) | ★★☆ |
| **`cmdk`** (đã có) | Command palette ⌘K — nối vào `lib/references` để tìm nhanh chứng từ | ★★☆ |
| **`@sentry/nextjs`** (tuỳ chọn) | traceId cho error.tsx khi demo thật | ★☆☆ |
| **`playwright`** | E2E luồng end-to-end Product→Delivery (00 §4) | ★☆☆ (phase cuối) |

**Không thêm:** Redux (zustand đủ), GraphQL (REST + React Query đủ), ORM phía client, state machine lib nặng (XState) — transition table tự viết đủ và dễ cite docs hơn.

---

## Phụ lục B — Mapping module docs ↔ feature ↔ route

| docs | feature folder | routes | transition table |
|---|---|---|---|
| 01 Product Creation | `product` | `/admin/products`, `/[id]`, `/create`, `/admin/variants` | PRODUCT, SKU |
| 02 Purchase Order | `purchase-order` | `/admin/purchase-orders`, `/[id]`, `/create`, `/admin/replenishment` | PO, REPLENISHMENT |
| 03 Receipt | `receipt` | `/admin/receipts`, `/[id]`, `/scan` | RECEIPT, QC_LOT |
| 04 Invoice | `invoice` | `/admin/invoices`, `/[id]` | INVOICE |
| 05 Putaway | `putaway` | `/admin/putaway`, `/scan` | PUTAWAY |
| 06 Map & Slotting | `warehouse-map` | `/admin/warehouse-map`, `/admin/slotting` | LOCATION, SUGGESTION, RESLOT |
| 07 Picking | `picking` | `/admin/picking`, `/[id]`, `/scan` | PICK |
| 08 Packing | `packing` | `/admin/packing`, `/[id]`, `/scan` | PACK |
| 09 Shipping | `shipping` | `/admin/shipments`, `/[id]`, `/admin/manifests` | SHIPMENT |
| 10 Inter-warehouse | `transfer` | `/admin/transfers`, `/[id]` | INTER_TRANSFER |
| 11 Intra-warehouse | `move` | `/admin/moves` | MOVE |
| — Inventory (xuyên suốt) | `inventory` | `/admin/inventory`, `/admin/movements` | STOCK_STATE (Available/Allocated/Picked/Staged/In-Transit/Blocked/Quarantine) |
| — Dashboard | `dashboard` | `/admin` | — |
| 12–18 | `design`, `catalog`, `cart`, `payment`, `chat`, `order`, `customer` | storefront | DESIGN, PRODUCT(publish), CART, ORDER, PAYMENT, CONVERSATION, RMA, CUSTOMER |

> **Inventory không có module docs riêng** nhưng là thực thể xuyên suốt (00 §6.2: "tồn kho luôn gắn với vị trí"). Dựng `features/inventory` từ dữ liệu `locations` + `stockMovements` trong mock — đánh dấu `// ASSUMPTION: docs không có module inventory riêng, suy từ 00 §6 + 05 BR-02`.

---

*Cập nhật file này khi: thêm tech, đổi kiến trúc, docs đổi BR/trạng thái. Sửa `FRONTEND-AI-RULES.md` nếu đổi token/component — hai file phải đồng bộ.*
