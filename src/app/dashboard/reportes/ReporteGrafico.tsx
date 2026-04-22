'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function ReporteGrafico({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return <div className="h-64 flex items-center justify-center text-gray-500">No hay datos suficientes para graficar.</div>
    }

    return (
        <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 12 }} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#6B7280', fontSize: 12 }} 
                    />
                    {/* Tooltip interactivo corporativo */}
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', borderRadius: '8px', border: 'none', color: '#fff' }}
                        itemStyle={{ color: '#E5E7EB' }}
                        cursor={{ fill: '#F3F4F6', opacity: 0.1 }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="Aprobadas" fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="Rechazadas" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="Pendientes" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
