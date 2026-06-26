/** Pure Herbex WhatsApp Marketing Messages dataset (Events Manager). */
export const META_DATASET_ID = "1887451258612774";

export function getMetaDatasetId(): string {
  return process.env.META_PIXEL_ID?.trim() || META_DATASET_ID;
}

export function hasMetaCapiToken(): boolean {
  return !!process.env.META_CAPI_ACCESS_TOKEN?.trim();
}
