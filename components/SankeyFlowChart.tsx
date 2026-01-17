
import React from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

interface SankeyFlowChartProps {
  theme: 'light' | 'dark';
}

const data = {
  nodes: [
    { name: "Acessou Site" },
    { name: "Encontrou Produto" },
    { name: "No Carrinho" },
    { name: "Favoritos" },
    { name: "Pagamento" },
    { name: "Cancelou" },
    { name: "Abandonado" }
  ],
  links: [
    { source: 0, target: 1, value: 1000 },
    { source: 1, target: 2, value: 450 },
    { source: 1, target: 3, value: 200 },
    { source: 2, target: 4, value: 150 },
    { source: 2, target: 5, value: 40 },
    { source: 2, target: 6, value: 260 },
    { source: 3, target: 2, value: 80 }
  ]
};

const CustomNode = (props: any) => {
  const { x, y, width, height, index, payload, theme } = props;
  const isDark = theme === 'dark';
  
  // Cores diferentes para cada estágio do funil
  const getNodeColor = (name: string) => {
    if (isDark) {
      if (name.includes('Site')) return '#3b82f6'; // Azul
      if (name.includes('Produto')) return '#8b5cf6'; // Roxo
      if (name.includes('Carrinho')) return '#6366f1'; // Indigo
      if (name.includes('Favoritos')) return '#a855f7'; // Roxo claro
      if (name.includes('Pagamento')) return '#10b981'; // Verde
      if (name.includes('Cancelou')) return '#ef4444'; // Vermelho
      if (name.includes('Abandonado')) return '#f97316'; // Laranja
      return '#6366f1';
    } else {
      if (name.includes('Site')) return '#2563eb'; // Azul
      if (name.includes('Produto')) return '#7c3aed'; // Roxo
      if (name.includes('Carrinho')) return '#4f46e5'; // Indigo
      if (name.includes('Favoritos')) return '#9333ea'; // Roxo claro
      if (name.includes('Pagamento')) return '#059669'; // Verde
      if (name.includes('Cancelou')) return '#dc2626'; // Vermelho
      if (name.includes('Abandonado')) return '#ea580c'; // Laranja
      return '#4f46e5';
    }
  };
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={getNodeColor(payload.name)}
        fillOpacity={0.9}
        rx={4}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#ffffff"
        fontSize="14"
        fontWeight="700"
        style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
      >
        {payload.name}
      </text>
    </g>
  );
};

const SankeyFlowChart: React.FC<SankeyFlowChartProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  
  return (
    <div className="w-full h-[400px] bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl p-4 shadow-inner border border-gray-200 dark:border-gray-700">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={<CustomNode theme={theme} />}
          nodePadding={50}
          margin={{ top: 20, left: 20, right: 20, bottom: 20 }}
          link={{ stroke: isDark ? '#4b5563' : '#d1d5db', opacity: 0.3 }}
        >
          <Tooltip 
            contentStyle={{ 
                backgroundColor: isDark ? '#1f2937' : '#fff', 
                border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, 
                borderRadius: '12px', 
                boxShadow: isDark ? '0 10px 25px -5px rgba(0,0,0,0.5)' : '0 10px 25px -5px rgba(0,0,0,0.1)',
                color: isDark ? '#f9fafb' : '#111827',
                padding: '12px'
            }} 
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};

export default SankeyFlowChart;
