import { memo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, PolarRadiusAxis } from 'recharts';

const RadarChartComponent = memo(({ data, compareColor = '#00F0FF' }: any) => {
    return (
        <div className="w-full h-full relative flex items-center justify-center overflow-visible">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart 
                    cx="50%" cy="50%" 
                    outerRadius="80%" 
                    data={data}
                    style={{ outline: 'none' }}
                >
                    <PolarGrid stroke="#FFFFFF" strokeOpacity={0.2} />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#fff', fontSize: 10, fontWeight: 900, opacity: 0.9 }} 
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    
                    {/* TYREX - ЗОЛОТО (СНИЗУ) */}
                    <Radar 
                        name="Tyrex" 
                        dataKey="Tyrex" 
                        stroke="#FFB800" 
                        fill="#FFB800" 
                        fillOpacity={0.2} 
                        strokeWidth={4} 
                    />
                    
                    {/* АКТИВ - НЕОН (СВЕРХУ) */}
                    <Radar 
                        name="Asset" 
                        dataKey="Compare" 
                        stroke={compareColor} 
                        fill={compareColor} 
                        fillOpacity={0.15} 
                        strokeWidth={2.5} 
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
});

export default RadarChartComponent;