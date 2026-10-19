/**
 * Formatting and utility functions for dates, currency, distance, and badge styles.
 */

export function formatFirestoreDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString();
  }
  if (typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000).toISOString();
  }
  if (val instanceof Date) {
    return val.toISOString();
  }
  return String(val);
}

export function formatRelativeTime(val: any): string {
  if (!val) return 'Never';
  const isoString = formatFirestoreDate(val);
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 5) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function formatDateTime(val: any): string {
  if (!val) return '—';
  const isoString = formatFirestoreDate(val);
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function formatCurrency(amount: number | null | undefined, currency = 'INR'): string {
  if (amount === null || amount === undefined) return '₹0.00';
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `;
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatDistance(cm: number | null | undefined): string {
  if (cm === null || cm === undefined) return '—';
  return `${cm.toFixed(1)} cm`;
}

export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes || minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h}h ${m}m`;
}

export function getSlotStatusMeta(status: string) {
  switch (status) {
    case 'AVAILABLE':
      return {
        label: 'Available',
        bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dotColor: 'bg-emerald-500',
        textColor: 'text-emerald-600',
      };
    case 'OCCUPIED':
      return {
        label: 'Occupied',
        bgColor: 'bg-rose-50 text-rose-700 border-rose-200',
        dotColor: 'bg-rose-500',
        textColor: 'text-rose-600',
      };
    case 'RESERVED':
      return {
        label: 'Reserved',
        bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-600',
      };
    case 'ALLOCATED':
      return {
        label: 'Allocated',
        bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
        dotColor: 'bg-blue-500',
        textColor: 'text-blue-600',
      };
    case 'OUT_OF_SERVICE':
    case 'UNAVAILABLE':
    default:
      return {
        label: 'Unavailable',
        bgColor: 'bg-slate-100 text-slate-700 border-slate-200',
        dotColor: 'bg-slate-400',
        textColor: 'text-slate-500',
      };
  }
}

export function getHealthStatusMeta(health: string) {
  switch (health) {
    case 'HEALTHY':
    case 'ONLINE':
      return {
        label: 'Online',
        bgColor: 'bg-emerald-100 text-emerald-800',
        dotColor: 'bg-emerald-500',
      };
    case 'STALE':
      return {
        label: 'Stale Telemetry',
        bgColor: 'bg-amber-100 text-amber-800',
        dotColor: 'bg-amber-500',
      };
    case 'OFFLINE':
    default:
      return {
        label: 'Offline',
        bgColor: 'bg-rose-100 text-rose-800',
        dotColor: 'bg-rose-500',
      };
  }
}
