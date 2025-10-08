import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RadarChartProps {
  candidatePillars: Record<string, number>;
  jobPillars: Record<string, number>;
}

export const MatchRadarChart = ({ candidatePillars, jobPillars }: RadarChartProps) => {
  // Map candidate pillars - try both capitalized and lowercase keys
  const getPillarValue = (obj: Record<string, number>, ...keys: string[]) => {
    for (const key of keys) {
      if (obj[key] !== undefined) return obj[key];
    }
    return 0;
  };

  const pillarMappings = [
    { 
      label: 'Ambiente', 
      candidateKeys: ['ambiente', 'Ambiente', 'environment'],
      jobKeys: ['ambiente', 'Ambiente', 'environment']
    },
    { 
      label: 'Propósito', 
      candidateKeys: ['proposito', 'Propósito', 'purpose'],
      jobKeys: ['proposito', 'Propósito', 'purpose']
    },
    { 
      label: 'Crescimento', 
      candidateKeys: ['crescimento', 'Crescimento', 'growth'],
      jobKeys: ['crescimento', 'Crescimento', 'growth']
    },
    { 
      label: 'Remuneração', 
      candidateKeys: ['compensation', 'Remuneração', 'remuneracao'],
      jobKeys: ['compensation', 'Remuneração', 'remuneracao']
    },
  ];

  // Create data array with mapped values
  const data = pillarMappings.map(({ label, candidateKeys, jobKeys }) => ({
    pillar: label,
    candidate: getPillarValue(candidatePillars, ...candidateKeys),
    job: Object.keys(jobPillars).length > 0 ? getPillarValue(jobPillars, ...jobKeys) : undefined,
  }));

  const hasJobData = Object.keys(jobPillars).length > 0;

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="pillar" className="text-xs" />
          <PolarRadiusAxis 
            angle={90} 
            domain={[0, 5]} 
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Candidato"
            dataKey="candidate"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          {hasJobData && (
            <Radar
              name="Vaga"
              dataKey="job"
              stroke="hsl(var(--secondary))"
              fill="hsl(var(--secondary))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          )}
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: any) => {
              const num = typeof value === 'number' ? value : parseFloat(value);
              return isNaN(num) ? '0.0' : num.toFixed(1);
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};