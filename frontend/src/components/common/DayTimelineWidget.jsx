import React from 'react';

export const DayTimelineWidget = ({
  checkInAt,
  checkOutAt,
  breaks = [],
  status,
  nowTime = new Date(),
}) => {
  // Timeline bounds: 09:00 to 18:00 (540 minutes to 1080 minutes from midnight)
  const START_HOUR = 9;
  const END_HOUR = 18;
  const TOTAL_HOURS = END_HOUR - START_HOUR; // 9 hours = 540 minutes

  const toMinuteOffset = (dateStrOrObj) => {
    if (!dateStrOrObj) return null;
    const d = new Date(dateStrOrObj);
    const mins = d.getHours() * 60 + d.getMinutes();
    const timelineStart = START_HOUR * 60;
    const diff = mins - timelineStart;
    return Math.max(0, Math.min(diff, TOTAL_HOURS * 60));
  };

  const toPercent = (minutes) => {
    return (minutes / (TOTAL_HOURS * 60)) * 100;
  };

  // Schedule target: 10:00 to 17:00 (60 mins to 480 mins)
  const targetStartPct = toPercent(60);
  const targetWidthPct = toPercent(420);

  // Now marker
  const nowMins = nowTime.getHours() * 60 + nowTime.getMinutes() - START_HOUR * 60;
  const nowPct = Math.max(0, Math.min(toPercent(nowMins), 100));

  // Check-in and check-out offsets
  const checkInMin = toMinuteOffset(checkInAt);
  const checkOutMin = checkOutAt ? toMinuteOffset(checkOutAt) : (status === 'WORKING' || status === 'ON_BREAK' ? Math.max(checkInMin || 0, nowMins) : null);

  const hoursMarks = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  return (
    <div style={{ width: '100%', marginTop: 12 }}>
      {/* Target band & Work/Break intervals */}
      <div
        style={{
          position: 'relative',
          height: 14,
          backgroundColor: '#EBE5DC',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 6,
        }}
      >
        {/* Target 10:00 - 17:00 light outline / dashed bar */}
        <div
          title="Schedule target: 10:00 - 17:00"
          style={{
            position: 'absolute',
            left: `${targetStartPct}%`,
            width: `${targetWidthPct}%`,
            top: 0,
            bottom: 0,
            backgroundColor: '#DCD4C7',
            opacity: 0.7,
            borderRadius: 4,
          }}
        />

        {/* Working interval block */}
        {checkInMin !== null && checkOutMin !== null && checkOutMin > checkInMin && (
          <div
            title={`Work session: ${toPercent(checkOutMin - checkInMin).toFixed(0)}%`}
            style={{
              position: 'absolute',
              left: `${toPercent(checkInMin)}%`,
              width: `${toPercent(checkOutMin - checkInMin)}%`,
              top: 0,
              bottom: 0,
              backgroundColor: '#1D8350',
              borderRadius: 4,
              zIndex: 2,
            }}
          />
        )}

        {/* Break intervals */}
        {breaks.map((b, i) => {
          const bStart = toMinuteOffset(b.startedAt);
          const bEnd = b.endedAt ? toMinuteOffset(b.endedAt) : nowMins;
          if (bStart === null || bEnd === null || bEnd <= bStart) return null;
          return (
            <div
              key={b.id || i}
              title={`Break: ${Math.round(bEnd - bStart)}m`}
              style={{
                position: 'absolute',
                left: `${toPercent(bStart)}%`,
                width: `${Math.max(toPercent(bEnd - bStart), 1.2)}%`,
                top: 0,
                bottom: 0,
                backgroundColor: '#EFA537',
                borderRadius: 2,
                zIndex: 3,
              }}
            />
          );
        })}

        {/* Now pin marker */}
        {(status === 'WORKING' || status === 'ON_BREAK') && (
          <div
            style={{
              position: 'absolute',
              left: `${nowPct}%`,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: '#BF3A4C',
              zIndex: 5,
              borderRadius: 2,
            }}
          />
        )}
      </div>

      {/* Hourly tick marks and labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.73rem',
          color: '#8E857C',
          userSelect: 'none',
        }}
        className="tabular-numbers"
      >
        {hoursMarks.map((h) => (
          <span key={h}>{h < 10 ? `0${h}:00` : `${h}:00`}</span>
        ))}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          marginTop: 10,
          fontSize: '0.75rem',
          color: '#6B625A',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#1D8350' }} />
          Working
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: '#EFA537' }} />
          Break
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 6, borderRadius: 2, backgroundColor: '#DCD4C7' }} />
          Schedule target (display only)
        </span>
        {(status === 'WORKING' || status === 'ON_BREAK') && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#BF3A4C' }} />
            Now
          </span>
        )}
      </div>
    </div>
  );
};
