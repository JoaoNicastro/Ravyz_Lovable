import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Star } from "lucide-react";

interface DreamJobCardProps {
  desiredPosition?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  industries?: string[];
  values?: string[];
}

export const DreamJobCard = ({
  desiredPosition = "Head of Product",
  salaryRange = { min: 18000, max: 28000 },
  industries = ["Tecnologia", "Fintech", "E-commerce"],
  values = ["Inovação", "Work-life balance", "Crescimento profissional", "Diversidade"]
}: DreamJobCardProps) => {
  const formatSalary = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-secondary-foreground" />
          </div>
          <span>Cargo dos Sonhos</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Seção 1: Posição Desejada */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Posição Desejada</p>
          <h3 className="text-2xl font-bold text-secondary-foreground">{desiredPosition}</h3>
          <p className="text-sm text-muted-foreground">
            {formatSalary(salaryRange.min)} - {formatSalary(salaryRange.max)}
          </p>
        </div>

        {/* Seção 2: Indústrias de Interesse */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Indústrias de Interesse</p>
          <div className="flex flex-wrap gap-2">
            {industries.map((industry, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-muted hover:bg-muted/80 text-foreground"
              >
                {industry}
              </Badge>
            ))}
          </div>
        </div>

        {/* Seção 3: Valores Importantes */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Valores Importantes</p>
          <ul className="space-y-2">
            {values.map((value, index) => (
              <li key={index} className="flex items-center gap-2">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="text-sm">{value}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
