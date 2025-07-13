
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarChartProps {
  data: {
    subject: string;
    score: number;
    fullMark: number;
  }[];
}

export const RadarChartComponent: React.FC<RadarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-80 bg-white p-4 rounded-xl shadow-sm border">
        <h3 className="text-xl font-bold text-on-surface text-center mb-2">Domain Performance</h3>
        <ResponsiveContainer>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#5F6368', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'transparent' }} />
            <Radar name="Score" dataKey="score" stroke="#4285F4" fill="#4285F4" fillOpacity={0.6} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(5px)',
                    border: '1px solid #DADCE0',
                    borderRadius: '8px',
                }}
            />
            <Legend wrapperStyle={{ bottom: -10 }}/>
            </RadarChart>
        </ResponsiveContainer>
    </div>
  );
};
