// Simple CUID-like ID generator (fallback)
export function cuid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
