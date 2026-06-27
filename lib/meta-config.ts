/** @deprecated use lib/meta-dataset.ts constants */
export { META_BUSINESS_DATASET_ID as META_DATASET_ID } from "@/lib/meta-dataset";

export function hasMetaCapiToken(): boolean {
  return !!(
    process.env.META_CAPI_ACCESS_TOKEN?.trim() ||
    process.env.WHATSAPP_ACCESS_TOKEN?.trim()
  );
}
