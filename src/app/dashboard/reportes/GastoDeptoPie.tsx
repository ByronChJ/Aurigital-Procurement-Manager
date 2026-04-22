'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function GastoDeptoPie({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-500 italic">No hay datos de gasto por departamento.</div>
    }

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                        itemStyle={{ color: '#E5E7EB' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Gasto']}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
