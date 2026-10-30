import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MOCK_YEARLY_OVERVIEW } from '../services/mockData';
import { BarChart2, Calendar, ChevronDown } from 'lucide-react';

export const YearlyOverviewPage = () => {
  const [data, setData] = useState(MOCK_YEARLY_OVERVIEW);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.getYearlyOverview(selectedYear);
        if (res && res.monthlySummaries && res.monthlySummaries.length > 0) {
          setData(res);
        } else {
          setData(MOCK_YEARLY_OVERVIEW);
        }
      } catch (err) {
        setData(MOCK_YEARLY_OVERVIEW);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedYear]);

  // Monthly bar chart values for 2026 (matching Page 11 exactly)
  const chartBars = [
    { month: 'Jan', hours: 124 },
    { month: 'Feb', hours: 105 },
    { month: 'Mar', hours: 111 },
    { month: 'Apr', hours: 129 },
    { month: 'May', hours: 117 },
    { month: 'Jun', hours: 105 },
    { month: 'Jul', hours: 135 },
    { month: 'Aug', hours: 117 },
    { month: 'Sep', hours: 123 },
    { month: 'Oct', hours: 82, inProgress: true },
  ];

  // Daily pattern heatmap mock generator (Jan-Dec)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysOfWeek = ['Mon', 'Wed', 'Fri'];

  return (
    <div style={{ padding: '28px 32px 56px', maxWidth: 1280, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.38rem', fontWeight: 800, color: 'var(--color-charcoal)', letterSpacing: '-0.02em' }}>
              Yearly overview
            </h2>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                backgroundColor: '#FEF6EB',
                color: '#965B0A',
                border: '1px solid #F8D9A8',
                borderRadius: 4,
                padding: '2px 8px',
              }}
            >
              Phase 2 · PRD §10 analytics
            </span>
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-stone)', marginTop: 2 }}>
            1 January – 21 October 2026 · trends across your recorded attendance
          </div>
        </div>

        {/* Year Dropdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-control)',
            padding: '7px 14px',
            fontSize: '0.86rem',
            fontWeight: 600,
            color: 'var(--color-charcoal)',
            boxShadow: 'var(--shadow-subtle)',
            cursor: 'pointer',
          }}
        >
          <span>{selectedYear}</span>
          <ChevronDown size={15} color="var(--color-stone)" />
        </div>
      </div>

      {/* KPI Cards (Page 11) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 28,
        }}
        className="tabular-numbers"
      >
        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Days recorded</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>
            {data.totalDaysRecorded}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>Jan – Oct</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Complete days</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1D8350', marginTop: 4 }}>
            {data.completeDays}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>95% of recorded</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Incomplete</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#BF3A4C', marginTop: 4 }}>
            {data.incompleteDays}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#BF3A4C', marginTop: 2 }}>missing check-out</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Net work</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>
            {data.totalNetWorkHours}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>complete days</div>
        </div>

        <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', padding: '16px 20px', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--color-stone)' }}>Avg net / day</div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-charcoal)', marginTop: 4 }}>
            {data.averageNetPerDay}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#8E857C', marginTop: 2 }}>7 days with break over 1h</div>
        </div>
      </div>

      {/* Main Row: Monthly Chart and Monthly Table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          gap: 24,
          marginBottom: 24,
        }}
      >
        {/* Net work hours by month Bar Chart */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px 26px',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
              Net work hours by month
            </h3>
            <span style={{ fontSize: '0.74rem', color: '#8E857C' }}>
              * Oct in progress
            </span>
          </div>

          <div
            style={{
              height: 200,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 12,
              paddingBottom: 24,
              borderBottom: '1px solid var(--color-border)',
              position: 'relative',
            }}
            className="tabular-numbers"
          >
            {chartBars.map((b) => {
              const maxHours = 150;
              const heightPct = (b.hours / maxHours) * 100;
              return (
                <div
                  key={b.month}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    height: '100%',
                    justifyContent: 'flex-end',
                  }}
                >
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                    {b.hours}
                  </span>
                  <div
                    title={`${b.month}: ${b.hours}h`}
                    style={{
                      width: '100%',
                      maxWidth: 32,
                      height: `${heightPct}%`,
                      backgroundColor: b.inProgress ? '#F4A261' : 'var(--color-coral)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.3s ease',
                      opacity: b.inProgress ? 0.75 : 1,
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-stone)', marginTop: 4 }}>
                    {b.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Breakdown Table */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-card)',
            border: '1px solid var(--color-border)',
            padding: '24px 26px',
            boxShadow: 'var(--shadow-card)',
            overflowX: 'auto',
          }}
        >
          <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)', marginBottom: 16 }}>
            Monthly summary
          </h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }} className="tabular-numbers">
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--color-border)', color: 'var(--color-stone)' }}>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>MONTH</th>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>RECORDED</th>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>INCOMPLETE</th>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>NET WORK</th>
                <th style={{ padding: '8px 6px', fontWeight: 600 }}>AVG / DAY</th>
              </tr>
            </thead>
            <tbody>
              {(data.monthlySummaries || []).map((m, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '10px 6px', fontWeight: 600, color: 'var(--color-charcoal)' }}>
                    {m.monthName}
                  </td>
                  <td style={{ padding: '10px 6px', color: 'var(--color-stone)' }}>
                    {m.recordedDays}
                  </td>
                  <td style={{ padding: '10px 6px', color: m.incompleteDays > 0 ? '#BF3A4C' : 'var(--color-stone)', fontWeight: m.incompleteDays > 0 ? 600 : 400 }}>
                    {m.incompleteDays}
                  </td>
                  <td style={{ padding: '10px 6px', fontWeight: 700, color: 'var(--color-charcoal)' }}>
                    {m.netWorkHours}
                  </td>
                  <td style={{ padding: '10px 6px', color: '#1D8350', fontWeight: 600 }}>
                    {m.averagePerDay}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily Pattern Contribution Heatmap (Page 11) */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--color-border)',
          padding: '24px 28px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-charcoal)' }}>
            Daily pattern
          </h3>

          {/* Color Scale Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.72rem', color: 'var(--color-stone)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#86EFAC' }} />
              +5h 45m
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#22C55E' }} />
              5h 45m–6h 10m
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#15803D' }} />
              &gt;6h 10m net
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#EFA537' }} />
              Break over 1h
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#BF3A4C' }} />
              Incomplete
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#E8E2D9' }} />
              No record
            </span>
          </div>
        </div>

        {/* 52-week x 7-day grid */}
        <div style={{ overflowX: 'auto', paddingBottom: 6 }}>
          {/* Month labels */}
          <div style={{ display: 'flex', gap: 34, fontSize: '0.7rem', color: '#8E857C', marginBottom: 6, marginLeft: 30 }}>
            {months.map(m => (
              <span key={m}>{m}</span>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            {/* Day of week labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.68rem', color: '#8E857C', width: 24, paddingTop: 2 }}>
              <span>Mon</span>
              <span style={{ marginTop: 6 }}>Wed</span>
              <span style={{ marginTop: 6 }}>Fri</span>
            </div>

            {/* Matrix of cells */}
            <div style={{ display: 'flex', gap: 3 }}>
              {Array.from({ length: 42 }).map((_, weekIdx) => (
                <div key={weekIdx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {Array.from({ length: 7 }).map((_, dayIdx) => {
                    const isWeekend = dayIdx === 5 || dayIdx === 6;
                    let color = '#E8E2D9';
                    if (!isWeekend) {
                      const seed = (weekIdx * 7 + dayIdx) % 17;
                      if (seed === 3) color = '#BF3A4C'; // incomplete
                      else if (seed === 7) color = '#EFA537'; // break over 1h
                      else if (seed % 3 === 0) color = '#15803D'; // high net
                      else if (seed % 2 === 0) color = '#22C55E';
                      else color = '#86EFAC';
                    }
                    return (
                      <div
                        key={dayIdx}
                        title={`Week ${weekIdx + 1}, Day ${dayIdx + 1}`}
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 2,
                          backgroundColor: color,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: '0.74rem', color: '#8E857C', fontStyle: 'italic' }}>
          ⓘ No attendance percentage is calculated; working-day and holiday policies are deferred per PRD v1.0.
        </div>
      </div>
    </div>
  );
};
