# Plan: Quản lý Variant Attributes — Trang riêng + Tích hợp Product

## Bối cảnh nghiệp vụ (từ docs 01-product-creation)

- SKU **tự sinh** từ tổ hợp variant attributes (Color × Size → SKU), KHÔNG tạo tay
- Variant attributes = **dữ liệu động (master data)**: sau này BE sẽ là bảng riêng, CRUD đầy đủ
- Các product reference attributes từ bảng chung, chọn values phù hợp → sinh ma trận → sinh SKU

## Hiện trạng

- Product detail hiển thị attributes dạng chips read-only
- Nút "Thêm SKU" sai nghiệp vụ (SKU tự sinh)
- Chưa có trang quản lý variant attributes

## Kế hoạch

### 1. Trang quản lý Variant Attributes (`/admin/products/variants`)

**Route**: `src/app/admin/products/variants/page.tsx`

Trang CRUD đầy đủ cho variant attributes (master data), style giống các trang list khác (Mode A):

**Header**: PageHeader "Thuộc tính biến thể" + breadcrumb + nút "Tạo thuộc tính"

**StatTiles** (4 tiles):
- Tổng thuộc tính: đếm unique attributeId từ tất cả products
- Tổng giá trị: đếm tổng values
- Có swatch: đếm attributes có swatch
- SP sử dụng: đếm products có attributes

**SearchBar**: tìm theo tên attribute (vi/en)

**Danh sách attributes** — hiển thị dạng **card grid** (không DataTable, vì mỗi attribute là 1 entity phức tạp):

Mỗi card hiện:
- Tên attribute (vi/en), mã attributeId
- Danh sách giá trị dạng chips (có swatch dot nếu là Color)
- Số SP đang dùng attribute này
- Actions: Chỉnh sửa (toast mock), Xoá (toast mock)

**CRUD mock (state-only)**:
- **Create**: Dialog/form tạo attribute mới — nhập tên vi/en + danh sách giá trị (comma-separated) + toggle "Có swatch?" → thêm vào state override → toast success
- **Read**: hiện danh sách từ mock-data (aggregate unique attributes từ tất cả products)
- **Update**: click "Chỉnh sửa" → inline edit hoặc dialog → sửa tên/thêm bớt giá trị trong state
- **Delete**: click "Xoá" → ConfirmDialog (nếu SP đang dùng → cảnh báo) → xoá khỏi state → toast

**Detail page** (`/admin/products/variants/[id]`):

Click attribute card → navigate tới trang detail:
- Thông tin attribute (tên vi/en, mã, loại swatch/text)
- Danh sách giá trị: table với tên giá trị + swatch preview (nếu Color) + nút xoá + nút thêm giá trị
- Danh sách SP sử dụng attribute này: DataTable link về product detail
- Ma trận: hiện tổng SKU đã sinh từ attribute này

### 2. Sửa Product Detail (`/admin/products/[id]`)

- Section "Thuộc tính biến thể": 
  - Giữ hiển thị chips như hiện tại
  - Đổi nút action → "Quản lý biến thể" link tới `/admin/products/variants`
- Section "SKU":
  - Đổi nút "Thêm" → hiện text info "SKU tự sinh từ tổ hợp biến thể"
  - Thêm link "Xem thuộc tính biến thể →" navigate `/admin/products/variants`

### 3. Sửa Products List (`/admin/products`)

- Tab SKU: PageHeader action — xoá nút "Thêm SKU", thay bằng info chip "SKU tự sinh từ biến thể" hoặc link "Quản lý biến thể →"
- Tab Sản phẩm: giữ nút "Tạo sản phẩm" như cũ

### 4. Thêm nav vào BackofficeShell

Thêm nav item trong group "MASTER DATA":
```
{ label: "Thuộc tính biến thể", tooltip: "Variant Attributes", href: "/admin/products/variants", icon: Palette }
```

### 5. Dữ liệu

Aggregate unique attributes từ tất cả products:
```ts
// Gom từ products[].attributes
const uniqueAttrs = new Map<string, ProductAttribute>();
for (const p of products) {
  for (const attr of p.attributes) {
    const existing = uniqueAttrs.get(attr.attributeId);
    if (!existing) {
      uniqueAttrs.set(attr.attributeId, { ...attr });
    } else {
      // merge values
      const merged = new Set([...existing.values, ...attr.values]);
      existing.values = [...merged];
      if (attr.swatch) existing.swatch = { ...existing.swatch, ...attr.swatch };
    }
  }
}
```

Kết quả aggregate:
- `ATTR-COLOR` — Màu sắc / Color — values: Đen, Trắng, Xám, Navy, Đen lòng, Be tự nhiên — swatch: có
- `ATTR-SIZE` — Kích cỡ / Size — values: S, M, L, XL, XXL, 3XL — swatch: không

KHÔNG sửa mock-data.ts — mọi CRUD chỉ override trong component state.

### 6. Files

| File | Hành động |
|------|-----------|
| `src/app/admin/products/variants/page.tsx` | **TẠO MỚI** — trang list CRUD variant attributes |
| `src/app/admin/products/variants/[id]/page.tsx` | **TẠO MỚI** — trang detail attribute |
| `src/app/admin/products/[id]/page.tsx` | SỬA — đổi label nút variant/SKU |
| `src/app/admin/products/page.tsx` | SỬA — tab SKU xoá nút "Thêm SKU" |
| `src/components/backoffice/BackofficeShell.tsx` | SỬA — thêm nav "Thuộc tính biến thể" |

### 7. Không làm
- Không sửa mock-data.ts
- Không tạo variant matrix UI (để phase sau khi cần UX phức tạp hơn)
- Không thêm backend logic
