/**
 * Indian Rupee (INR - ₹) formatting utilities
 */

export function formatINR(
  val: number,
  options?: {
    showDecimals?: boolean;
    compact?: boolean;
  }
): string {
  const num = Number(val) || 0;

  if (options?.compact && Math.abs(num) >= 100000) {
    if (Math.abs(num) >= 10000000) {
      return `₹${(num / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(num / 100000).toFixed(2)} L`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options?.showDecimals === false ? 0 : 2,
    maximumFractionDigits: options?.showDecimals === false ? 0 : 2,
  }).format(num);
}
