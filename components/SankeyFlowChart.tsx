
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
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isDark ? "#6366f1" : "#4f46e5"}
        fillOpacity={0.8}
        rx={2}
      />
      <text
        x={x + width / 2}
        y={y + height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontSize="10"
        fontWeight="bold"
        style={{ pointerEvents: 'none' }}
      >
        {payload.name}
      </text>
    </g>
  );
};

const SankeyFlowChart: React.FC<SankeyFlowChartProps> = ({ theme }) => {
  return (
    <div className="w-full h-[400px] bg-white dark:bg-gray-800 rounded-xl p-4 shadow-inner border border-gray-100 dark:border-gray-700">
      <ResponsiveContainer width="100%" height="100%">
        <Sankey
          data={data}
          node={<CustomNode theme={theme} />}
          nodePadding={50}
          margin={{ top: 20, left: 20, right: 20, bottom: 20 }}
          link={{ stroke: theme === 'dark' ? '#312e81' : '#e0e7ff' }}
        >
          <Tooltip 
            contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#1f2937' : '#fff', 
                border: 'none', 
                borderRadius: '8px', 
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                color: theme === 'dark' ? '#fff' : '#000'
            }} 
          />
        </Sankey>
      </ResponsiveContainer>
    </div>
  );
};

export default SankeyFlowChart;
