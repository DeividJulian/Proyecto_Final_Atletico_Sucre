/** Helpers for files that come from the API as blobs (receipts, CSV exports). */

/** Opens an image in a new tab. Call `prepareTab()` inside the click so popup blockers allow it. */
export function prepareTab(): Window | null {
  return window.open('', '_blank');
}

export function showBlob(tab: Window | null, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  if (tab) tab.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
