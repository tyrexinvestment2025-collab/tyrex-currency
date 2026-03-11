import React, { memo } from 'react';
import { 
    Radar, RadarChart, PolarGrid, PolarAngleAxis, 
    ResponsiveContainer 
} from 'recharts';

interface ChartDataPoint {
    subject: string;
    Tyrex: number;
    Compare: number;
}

interface RadarChartComponentProps {
    data: ChartDataPoint[];
    selectedAsset: string;
    activeCategory: string;
}

const RadarChartComponent: React.FC<RadarChartComponentProps> = memo(({ data, selectedAsset, activeCategory }) => {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart 
                key={`${activeCategory}-${selectedAsset}`} 
                cx="50%" 
                cy="50%" 
                outerRadius="75%" 
                data={data}
            >
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fill: '#555', fontSize: 10, fontWeight: 'bold' }} 
                />
                
                {/* Область КОНКУРЕНТА */}
                <Radar 
                    dataKey="Compare" 
                    stroke="#444" 
                    strokeWidth={1}
                    fill="#333" 
                    fillOpacity={0.3} 
                    animationDuration={600}
                />
                
                {/* Область TYREX */}
                <Radar 
                    dataKey="Tyrex" 
                    stroke="#FDB931" 
                    strokeWidth={2.5} 
                    fill="#FDB931" 
                    fillOpacity={0.4} 
                    animationDuration={900}
                    animationBegin={300}
                />
            </RadarChart>
        </ResponsiveContainer>
    );
});

RadarChartComponent.displayName = 'RadarChartComponent';

export default RadarChartComponent;