# StockFlow UI — CLAUDE.md (cho Claude Code chạy code UI/UX)

## Phạm vi
UI/UX ONLY — không backend, không business logic, không gọi API. Tất cả data lấy từ mock.

## Bắt buộc đọc trước mọi task
1. `src/_design/FRONTEND-AI-RULES.md` — nguồn sự thật về design system (token §3, components §6).
2. Mở `src/_design/components-preview.html` trong browser để đối chiếu style chuẩn.

## Stack (đã chốt)
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion
- lucide-react icons

## Data
- CHỈ dùng `src/lib/mock-data.ts`. KHÔNG tự bịa thêm record, ID, tên, số tiền.
- Giữ nguyên mọi field name trong mock-data.ts — không rename.
- Status hiển thị nguyên văn theo union type, không viết lại tên trạng thái.

## Hai theme TÁCH BIỆT hoàn toàn (không trộn)
- **Mode A — Back-office (module 01–11):** Ink + Cyan. `--brand:#1A1B18`, `--accent:#0E9BB0`. Data-dense, desktop-first, radius nhỏ (sm), card-pad 16px.
- **Mode B — Storefront (module 12–18):** Caramel. Light `--brand:#A9682F`, dark `#C98D4E`. Airy, mobile-first, radius lớn (lg/xl), card-pad 24px.
- 7 tone semantic dùng chung: positive `#1F9D55`, info `#2B7FC4`, warning `#D98207`, danger `#D23B3B`, neutral `#6B6E68`, muted `#9A9C95`, special `#7C5CBF`.
- KHÔNG dùng màu hồng/magenta. KHÔNG để caramel lọt vào Mode A hay cyan lọt vào Mode B.

## Components chuẩn
- `<StatusBadge domain status>` — một component duy nhất cho mọi trạng thái, tone theo status-map ưu tiên: special > danger > positive > warning > info > muted > neutral.
- Shared: Card / FilterBar / SearchBar / DataTable / StatTile / EmptyState / Skeleton / Toast / Alert / ConfirmDialog / PageHeader.
- Shell A: BackofficeShell (sidebar + topbar). Shell B: StorefrontShell (mobile-first).

## Quy tắc làm việc
- Mỗi task = 1 trang/1 module. Xong thì build phải pass (`npm run build`).
- Không sửa mock-data.ts, không sửa FRONTEND-AI-RULES.md trừ khi người dùng yêu cầu.
- Đường dẫn route: `/admin/*` cho Mode A, storefront cho Mode B (đặt tên theo module docs).
