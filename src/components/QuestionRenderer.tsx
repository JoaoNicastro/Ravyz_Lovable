import React from 'react';
import { Question } from '@/lib/schemas';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface QuestionRendererProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  className?: string;
}

export function QuestionRenderer({ question, value, onChange, className = '' }: QuestionRendererProps) {
  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={question.description}
            className="w-full"
            minLength={question.validation?.minLength}
            maxLength={question.validation?.maxLength}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={question.description}
            className="w-full"
            min={question.validation?.min}
            max={question.validation?.max}
          />
        );

      case 'select':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionText = typeof option === 'string' ? option : option.text || option.value;
              const isSelected = value === optionValue;
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onChange(optionValue)}
                  className="w-full justify-start text-left"
                >
                  {optionText}
                </Button>
              );
            })}
          </div>
        );

      case 'multiselect':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionText = typeof option === 'string' ? option : option.text || option.value;
              const isSelected = Array.isArray(value) && value.includes(optionValue);
              const canSelect = !question.maxSelections || !Array.isArray(value) || 
                               value.length < question.maxSelections || isSelected;
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => {
                    if (!canSelect && !isSelected) return;
                    
                    const currentArray = Array.isArray(value) ? value : [];
                    if (isSelected) {
                      onChange(currentArray.filter(v => v !== optionValue));
                    } else {
                      onChange([...currentArray, optionValue]);
                    }
                  }}
                  disabled={!canSelect && !isSelected}
                  className="w-full justify-start text-left"
                >
                  {optionText}
                  {isSelected && <Badge variant="secondary" className="ml-auto">✓</Badge>}
                </Button>
              );
            })}
            {question.maxSelections && Array.isArray(value) && (
              <p className="text-sm text-muted-foreground">
                {value.length}/{question.maxSelections} selecionados
              </p>
            )}
          </div>
        );

      case 'boolean':
        return (
          <div className="flex space-x-4">
            <Button
              variant={value === true ? 'default' : 'outline'}
              onClick={() => onChange(true)}
              className="flex-1"
            >
              Sim
            </Button>
            <Button
              variant={value === false ? 'default' : 'outline'}
              onClick={() => onChange(false)}
              className="flex-1"
            >
              Não
            </Button>
          </div>
        );

      case 'scale':
      case 'likert':
        return (
          <div className="space-y-4">
            {question.options?.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionText = typeof option === 'string' ? option : option.text || option.value;
              const isSelected = value === optionValue;
              
              return (
                <Button
                  key={index}
                  variant={isSelected ? 'default' : 'outline'}
                  onClick={() => onChange(optionValue)}
                  className="w-full justify-start text-left h-auto p-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`} />
                    <span>{optionText}</span>
                  </div>
                </Button>
              );
            })}
            {question.scale && (
              <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                <span>{question.scale.labels[0]}</span>
                <span>{question.scale.labels[question.scale.labels.length - 1]}</span>
              </div>
            )}
          </div>
        );

      case 'slider':
        if (question.skills) {
          return (
            <div className="space-y-6">
              {question.skills.map((skill) => {
                const skillValue = value?.[skill.id] || skill.default;
                return (
                  <div key={skill.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="font-medium">{skill.label}</Label>
                      <Badge variant="outline">{skillValue}</Badge>
                    </div>
                    <Slider
                      value={[skillValue]}
                      onValueChange={([newValue]) => onChange({
                        ...value,
                        [skill.id]: newValue
                      })}
                      min={skill.min}
                      max={skill.max}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{skill.min}</span>
                      <span>{skill.max}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        return null;

      case 'ranking':
        // Simplified ranking - would need drag & drop for full implementation
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => {
              const optionValue = typeof option === 'string' ? option : option.value;
              const optionText = typeof option === 'string' ? option : option.text || option.value;
              const currentArray = Array.isArray(value) ? value : [];
              const position = currentArray.indexOf(optionValue) + 1;
              
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => {
                    if (position > 0) {
                      // Remove from ranking
                      onChange(currentArray.filter(v => v !== optionValue));
                    } else {
                      // Add to ranking
                      onChange([...currentArray, optionValue]);
                    }
                  }}
                  className="w-full justify-between text-left"
                >
                  <span>{optionText}</span>
                  {position > 0 && (
                    <Badge variant="secondary">#{position}</Badge>
                  )}
                </Button>
              );
            })}
          </div>
        );

      default:
        return (
          <div className="text-muted-foreground text-center p-4">
            Tipo de pergunta não suportado: {question.type}
          </div>
        );
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-semibold">{question.question}</Label>
          {question.required && <span className="text-destructive ml-1">*</span>}
          {question.description && (
            <p className="text-muted-foreground text-sm mt-1">{question.description}</p>
          )}
        </div>
        {renderInput()}
      </div>
    </Card>
  );
}