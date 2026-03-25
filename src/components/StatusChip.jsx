const STATUS_STYLES = {
  resolved: 'bg-emerald-100 text-emerald-800',
  'in progress': 'bg-amber-100 text-amber-800',
  assigned: 'bg-amber-100 text-amber-800',
  'on hold': 'bg-red-100 text-red-800',
  rework: 'bg-purple-100 text-purple-800',
  closed: 'bg-slate-200 text-slate-700',
};

export default function StatusChip({ status }) {
  const key = (status || '').toLowerCase();
  const style = STATUS_STYLES[key] || 'bg-slate-100 text-slate-700';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${style}`}>
      {status || 'Unknown'}
    </span>
  );
}
