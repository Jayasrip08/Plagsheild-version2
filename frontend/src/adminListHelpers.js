export function formatListDate(iso) {
  if (!iso) return { date: '—', time: '' };
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    };
  } catch {
    return { date: String(iso), time: '' };
  }
}

export function initialsOf(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function avatarTone(seed = '') {
  const tones = ['blue', 'violet', 'teal', 'amber', 'rose', 'indigo'];
  let hash = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i += 1) hash = (hash + s.charCodeAt(i) * (i + 1)) % tones.length;
  return tones[hash];
}

export function roleTone(role = '') {
  const r = String(role).toLowerCase();
  if (r.includes('super')) return 'violet';
  if (r.includes('college')) return 'amber';
  if (r.includes('b2b')) return 'teal';
  return 'blue';
}

export function paginate(items, page, pageSize) {
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), pages);
  const start = (safePage - 1) * pageSize;
  const slice = items.slice(start, start + pageSize);
  return {
    page: safePage,
    pages,
    total,
    start: total === 0 ? 0 : start + 1,
    end: Math.min(start + pageSize, total),
    items: slice,
  };
}

export function fileLabel(path) {
  if (!path) return 'Manuscript';
  try {
    return decodeURIComponent(String(path).split('?')[0].split('/').pop());
  } catch {
    return String(path).split('?')[0].split('/').pop() || 'Manuscript';
  }
}

export function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Returns [start, end] Date objects (inclusive) for history date filters. */
export function historyDateRange(preset, { date = '', from = '', to = '' } = {}) {
  const now = new Date();
  if (preset === 'today') {
    return [startOfDay(now), endOfDay(now)];
  }
  if (preset === 'week') {
    const start = startOfDay(now);
    const day = start.getDay(); // 0 Sun … 6 Sat
    const mondayOffset = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + mondayOffset);
    return [start, endOfDay(now)];
  }
  if (preset === 'month') {
    const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    return [start, endOfDay(now)];
  }
  if (preset === 'date' && date) {
    const chosen = new Date(`${date}T00:00:00`);
    if (!Number.isNaN(chosen.getTime())) return [startOfDay(chosen), endOfDay(chosen)];
  }
  if (preset === 'custom') {
    const start = from ? startOfDay(new Date(`${from}T00:00:00`)) : null;
    const end = to ? endOfDay(new Date(`${to}T00:00:00`)) : null;
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return start <= end ? [start, end] : [end, start];
    }
    if (start && !Number.isNaN(start.getTime())) return [start, endOfDay(now)];
    if (end && !Number.isNaN(end.getTime())) return [new Date(0), end];
  }
  return null;
}

export function orderInDateRange(order, range) {
  if (!range) return true;
  const [start, end] = range;
  const ts = new Date(order?.created_at || 0).getTime();
  if (Number.isNaN(ts)) return false;
  return ts >= start.getTime() && ts <= end.getTime();
}

/** Instant client-side search: true when query is empty or appears in any field. */
export function matchesSearch(query, ...fields) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return fields
    .flat()
    .filter((v) => v != null && v !== '')
    .some((v) => String(v).toLowerCase().includes(q));
}
