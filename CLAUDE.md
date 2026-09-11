# StockFlow UI — CLAUDE.md (cho Claude Code)

## Phạm vi

Frontend production cho StockFlowCommerce. Nghiệp vụ lấy từ `D:\FPTU\Capstone\docs\docs\` (18 module).
Giai đoạn hiện tại: refactor từ UI-only sang kiến trúc production (data layer, validation, state, permission, test).
Khi backend chưa sẵn sàng: chạy `NEXT_PUBLIC_USE_MOCK=true` — data qua mock adapter, component KHÔNG import mock trực tiếp.

## Bắt buộc đọc trước mọi task

1. `src/_design/FRONTEND-AI-RULES.md` — design system: token §3, layout §4–5, components §6.
2. `src/_design/PRODUCTION-FRONTEND-RULES.md` — kiến trúc production: feature folder §1, data layer §2, zod §3, forms §4, state §5, lifecycle/action-gating §6, permission §7, testing §11, CI §12, refactor playbook §13.
3. Mở `src/_design/components-preview.html` trong browser để đối chiếu style chuẩn.

**Xung đột:** nghiệp vụ → `docs/` thắng. Kỹ thuật → `PRODUCTION-FRONTEND-RULES.md` thắng.

## Stack

Next.js App Router + TypeScript strict · Tailwind v4 + shadcn/ui · TanStack React Query + axios · zod + react-hook-form · zustand · nuqs · Framer Motion · lucide-react · Vitest + RTL + MSW.

## Data

- Component KHÔNG import `src/lib/mock-data.ts` — chỉ `lib/api/mock-adapter.ts` được phép.
- Giữ nguyên mọi field name trong mock-data.ts — không rename.
- Status hiển thị nguyên văn theo union type trong docs, không viết lại tên trạng thái.
- Không bịa record/ID/tên/số tiền. KPI derive từ data thật qua `selectors.ts`.

## Hai theme TÁCH BIỆT hoàn toàn (không trộn)

- **Mode A — Back-office (module 01–11):** Ink + Blue. `--brand:#1A1B18`, `--accent:#1E88E5`. Data-dense, desktop-first, radius nhỏ (sm), card-pad 16px.
- **Mode B — Storefront (module 12–18):** Caramel. Light `--brand:#A9682F`, dark `#C98D4E`. Airy, mobile-first, radius lớn (lg/xl), card-pad 24px.
- 7 tone semantic dùng chung: positive `#1F9D55`, info `#2B7FC4`, warning `#D98207`, danger `#D23B3B`, neutral `#6B6E68`, muted `#9A9C95`, special `#7C5CBF`.
- KHÔNG dùng màu hồng/magenta. KHÔNG để caramel lọt vào Mode A hay blue lọt vào Mode B.

## Components chuẩn

- `<StatusBadge domain status>` — một component duy nhất cho mọi trạng thái, tone theo status-map ưu tiên: special > danger > positive > warning > info > muted > neutral.
- Shared: Card / FilterBar / SearchBar / DataTable / StatTile / EmptyState / Skeleton / Toast / Alert / ConfirmDialog / PageHeader.
- Shell A: BackofficeShell (sidebar + topbar). Shell B: StorefrontShell (mobile-first).

## Quy tắc làm việc

- Mỗi task = 1 module. Theo đúng Refactor Playbook §13 (9 bước, mỗi module 1 PR).

### BẮT BUỘC trước khi báo "xong" (không được bỏ qua bước nào)

Dự án dùng **pnpm** (có `pnpm-lock.yaml`) — KHÔNG dùng `npm install`, nó crash trên cây symlink của pnpm.

Chạy đúng thứ tự, **build trước rồi check lint**:

1. `pnpm run build` — build lại, phải pass.
2. `pnpm run lint` — check lỗi lint.
3. `pnpm run typecheck` và `pnpm run test`.

Hoặc chạy gộp: `pnpm run validate`.

Quy tắc báo cáo kết quả:

- **Chưa chạy đủ 3 bước trên thì KHÔNG được nói task đã xong.** Không suy đoán "chắc là pass".
- Phải **dán output thật** làm bằng chứng, không mô tả chung chung.
- Nếu còn lỗi: phân biệt rõ **lỗi mình gây ra** với **lỗi đã có sẵn trên `main`** — kiểm chứng bằng cách chạy lại trên HEAD sạch (`git stash`), rồi so số lượng lỗi trước/sau.
- Lỗi mình gây ra → phải sửa xong mới được báo hoàn thành. Lỗi có sẵn → báo cho người dùng biết, không tự ý sửa ngoài phạm vi task.
- Không sửa mock-data.ts; không sửa 2 file `_design/*RULES.md` trừ khi người dùng yêu cầu.
- Route: `/admin/*` cho Mode A, storefront cho Mode B. Tên feature folder theo Phụ lục B.
- Mọi `BR-xx` encode vào zod refine / transition table phải có comment cite docs.
