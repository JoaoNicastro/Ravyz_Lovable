import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RadarChartProps {
  candidatePillars: Record<string, number>;
  jobPillars: Record<string, number>;
}

export const MatchRadarChart = ({ candidatePillars, jobPillars }: RadarChartProps) => {
  // Map candidate pillars to job pillars for comparison
  // Based on MATCH RAVYZ methodology
  const pillarMappings = [
    { label: 'Compensação', candidate: 'Compensation', job: 'Ambição' },
    { label: 'Ambiente', candidate: 'Ambiente', job: 'TrabalhoGrupo' },
    { label: 'Propósito', candidate: 'Propósito', job: 'Liderança' },
    { label: 'Crescimento', candidate: 'Crescimento', job: 'Autonomia' },
  ];

  // Create data array with mapped values
  const data = pillarMappings.map(({ label, candidate, job }) => ({
    pillar: label,
    candidate: candidatePillars[candidate] || 0,
    job: jobPillars[job] || 0,
  }));

  // Add risk pillar if available in job
  if (jobPillars['Risco'] !== undefined) {
    data.push({
      pillar: 'Risco',
      candidate: candidatePillars['Crescimento'] || 0, // Growth correlates with risk
      job: jobPillars['Risco'] || 0,
    });
  }

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
          <Radar
            name="Vaga"
            dataKey="job"
            stroke="hsl(var(--secondary))"
            fill="hsl(var(--secondary))"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};