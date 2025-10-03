import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RankingData {
  category: string;
  position: number;
  total: number;
}

// Mock data - will be replaced with real data later
const mockRankings: RankingData[] = [
  { category: "Ranking Geral", position: 15, total: 5420 },
  { category: "Product Management", position: 3, total: 156 },
];

export function MarketPositionCard() {
  const calculateProgress = (position: number, total: number): number => {
    // Better position (lower number) = higher progress
    // Position 1 = 100%, worst position = ~0%
    return ((total - position + 1) / total) * 100;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posição no Mercado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {mockRankings.map((ranking, index) => (
          <div key={index} className="space-y-2">
            {/* First line: Category name and position */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{ranking.category}</span>
              <span className="text-sm">
                <span className="font-bold text-primary">#{ranking.position}</span>
                <span className="text-muted-foreground"> de {ranking.total.toLocaleString('pt-BR')}</span>
              </span>
            </div>
            
            {/* Second line: Progress bar */}
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress(ranking.position, ranking.total)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
