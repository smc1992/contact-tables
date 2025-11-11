import { useMemo, useState } from 'react';

interface ReservationCalendarProps {
  selectedDate?: string | null;
  onSelect: (dateISO: string) => void;
  availabilityByDate?: Record<string, number>; // key: YYYY-MM-DD, value: count
}

function startOfMonth(date: Date) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfMonth(date: Date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

function toYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isPast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export default function ReservationCalendar({ selectedDate, onSelect, availabilityByDate = {} }: ReservationCalendarProps) {
  const initialMonth = selectedDate ? new Date(selectedDate) : new Date();
  const [month, setMonth] = useState<Date>(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1));

  const weeks = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);

    // Calculate days to display, including leading/trailing days to fill weeks
    const startDay = start.getDay(); // 0=Sun, 1=Mon, ...
    const leadingDays = (startDay + 6) % 7; // make Monday=0
    const totalDays = end.getDate();
    const cells: Date[] = [];

    // Leading days from previous month
    for (let i = leadingDays; i > 0; i--) {
      const d = new Date(start);
      d.setDate(start.getDate() - i);
      cells.push(d);
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(start);
      d.setDate(i);
      cells.push(d);
    }

    // Trailing days to complete final week
    while (cells.length % 7 !== 0) {
      const d = new Date(end);
      d.setDate(end.getDate() + (cells.length % 7 === 0 ? 0 : 1));
      cells.push(new Date(d));
    }

    // Group into weeks
    const weeks: Date[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [month]);

  const monthName = month.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  const onPrev = () => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1));
  };
  const onNext = () => {
    setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100">←</button>
        <div className="text-lg font-semibold text-neutral-800">{monthName}</div>
        <button onClick={onNext} className="px-3 py-1 rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-100">→</button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-600 mb-1">
        {['Mo','Di','Mi','Do','Fr','Sa','So'].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="contents">
            {week.map((d, di) => {
              const inMonth = d.getMonth() === month.getMonth();
              const ymd = toYMD(d);
              const hasSlots = inMonth && (availabilityByDate[ymd] ?? 0) > 0;
              const isDisabled = !inMonth || isPast(d);
              const isSelected = selectedDate ? toYMD(new Date(selectedDate)) === ymd : false;
              const base = 'rounded-md p-2 text-sm';
              const color = isSelected
                ? 'bg-primary-600 text-white'
                : hasSlots
                ? 'bg-primary-50 text-primary-800 border border-primary-200'
                : inMonth
                ? 'bg-neutral-50 text-neutral-700 border border-neutral-200'
                : 'bg-transparent text-neutral-400';
              const disabled = isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-neutral-100';

              return (
                <button
                  key={di}
                  disabled={isDisabled}
                  onClick={() => onSelect(ymd)}
                  className={`${base} ${color} ${disabled}`}
                >
                  {d.getDate()}
                  {hasSlots && !isSelected && (
                    <span className="block text-[10px] mt-1">{availabilityByDate[ymd]} verfügbar</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}