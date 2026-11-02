import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { buildActivityGrid, GridDay, GridWorkout } from '../lib/activityGrid';
import { getLocalDateString } from '../lib/utils';

// Feel colors (1 Struggled, 2 Solid, 3 Great). Feel is NOT intensity.
const FEEL_HEX: Record<number, string> = {
  1: '#ef4444', // red-500
  2: '#eab308', // yellow-500
  3: '#22c55e'  // green-500
};

const DAY_LABELS = ['M', '', 'W', '', 'F', '', ''];

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface ActivityGridProps {
  workouts: GridWorkout[];
}

const Square: React.FC<{ day: GridDay }> = ({ day }) => {
  const base = 'h-[14px] w-[14px] flex-none rounded-[3px]';
  const todayRing = day.isToday ? ' ring-2 ring-white ring-offset-1 ring-offset-blue-900' : '';
  const [first, second] = day.ratings;

  let style: React.CSSProperties | undefined;
  let fill: string;
  if (first && second) {
    fill = '';
    style = { background: `linear-gradient(135deg, ${FEEL_HEX[first]} 50%, ${FEEL_HEX[second]} 50%)` };
  } else if (first) {
    fill = '';
    style = { backgroundColor: FEEL_HEX[first] };
  } else if (day.isFuture) {
    fill = ' border border-white/[0.08]';
  } else {
    fill = ' bg-white/[0.08]';
  }

  return <div className={`${base}${fill}${todayRing}`} style={style} />;
};

/**
 * Activity Grid (Log page). Calendar heatmap of workouts colored by feel.
 * Whole card is one tap target that opens History.
 */
const ActivityGrid: React.FC<ActivityGridProps> = ({ workouts }) => {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const weeks = useMemo(
    () => buildActivityGrid(workouts, getLocalDateString(), { futureWeeks: 3 }),
    [workouts]
  );

  // Open on the current week: scroll fully right (only the future weeks sit past it).
  useIsomorphicLayoutEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [weeks.length]);

  const openHistory = () => router.push('/history');

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Activity grid. Open history"
      onClick={openHistory}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openHistory();
        }
      }}
      className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
    >
      <div className="flex items-start gap-1">
        {/* Day labels stay fixed while the weeks scroll */}
        {/* pt-[17px] = month label row (14px) + 3px gap, so labels line up with the rows */}
        <div className="flex flex-none flex-col gap-[3px] pt-[17px]">
          {DAY_LABELS.map((label, i) => (
            <div key={i} className="h-[14px] w-3 text-[10px] leading-[14px] text-blue-200">
              {label}
            </div>
          ))}
        </div>

        {/* p-[3px] / -m-[3px] keeps today's ring from being clipped by the scroll box */}
        <div
          ref={scrollRef}
          className="flex min-w-0 flex-1 gap-[3px] overflow-x-auto overscroll-x-contain p-[3px] -m-[3px]"
          style={{ scrollbarWidth: 'none' }}
        >
          {weeks.map((week) => (
            <div key={week.start} className="flex flex-none flex-col gap-[3px]">
              <div className="h-3.5 w-[14px] whitespace-nowrap text-[10px] leading-[12px] text-blue-200">
                {week.monthLabel}
              </div>
              {week.days.map((day) => (
                <Square key={day.date} day={day} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityGrid;
