import { createDetailQuery, createListQuery, createQueryKeys } from "@/lib/api/query-factory";

import { getProduct, getSku, listCategories, listProducts, listSkus } from "./api";

import type { Category, Product, Sku } from "./types";
import type { ListProductsParams, ListSkusParams } from "./api";

export const productKeys = createQueryKeys<ListProductsParams>("products");
export const skuKeys = createQueryKeys<ListSkusParams>("skus");
export const categoryKeys = createQueryKeys<Record<string, unknown>>("categories");

export const useProducts = createListQuery<Product, ListProductsParams>(productKeys, listProducts);

export const useProduct = createDetailQuery<Product>(productKeys, getProduct);

export const useSkus = createListQuery<Sku, ListSkusParams>(skuKeys, listSkus);

export const useSku = createDetailQuery<Sku>(skuKeys, getSku);

export const useCategories = createListQuery<Category, Record<string, unknown>>(
  categoryKeys,
  (_, signal) => listCategories(signal),
);
