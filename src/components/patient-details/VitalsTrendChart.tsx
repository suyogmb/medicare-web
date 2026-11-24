import { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity } from 'lucide-react';
import type { PatientClinicalProfile } from '../../types';
import { SegmentedControl } from '../ui/Controls';
import { SectionCard } from '../ui/Section';

type Metric = 'Heart Rate' | 'Blood Pressure';
const AXIS_TICK = { fill: '#434654', fontSize: 11, fontFamily: 'JetBrains Mono' };

/** Trend chart styled like the dashboard "Weekly Appointments Overview". */
export function VitalsTrendChart({ trend }: { trend: PatientClinicalProfile['vitalsTrend'] }) {
  const [metric, setMetric] = useState<Metric>('Heart Rate');

  return (
    <SectionCard
      title="Vitals Trend"
      icon={Activity}
      subtitle="Last 8 recorded encounters"
      actions={<SegmentedControl label="Vital sign" options={['Heart Rate', 'Blood Pressure'] as const} value={metric} onChange={setMetric} />}
    >
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e8f0" strokeDasharray="4 4" />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} dy={8} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} domain={['dataMin - 10', 'dataMax + 10']} />
            <Tooltip
              contentStyle={{ background: '#2c3137', border: 'none', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 11, color: '#eef1f9' }}
              itemStyle={{ color: '#eef1f9' }}
              labelStyle={{ color: '#eef1f9', fontWeight: 600 }}
            />
            {metric === 'Heart Rate' ? (
              <Line isAnimationActive={false} type="monotone" dataKey="heartRate" name="bpm" stroke="#2d67e4" strokeWidth={2.5} dot={{ r: 3, fill: '#2d67e4', strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#dae1ff', strokeWidth: 4 }} />
            ) : (
              <>
                <Line isAnimationActive={false} type="monotone" dataKey="systolic" name="Systolic" stroke="#2d67e4" strokeWidth={2.5} dot={{ r: 3, fill: '#2d67e4', strokeWidth: 0 }} />
                <Line isAnimationActive={false} type="monotone" dataKey="diastolic" name="Diastolic" stroke="#5b5f65" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
