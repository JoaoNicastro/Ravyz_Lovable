import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface AddableInputProps {
  placeholder: string;
  value: string[];
  onChange: (value: string[]) => void;
  description?: string;
}

export const AddableInput: React.FC<AddableInputProps> = ({
  placeholder,
  value = [],
  onChange,
  description,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          onClick={handleAdd}
          size="icon"
          variant="outline"
          className="shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-muted/30">
          {value.map((item, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="gap-1 animate-in fade-in-0 zoom-in-95"
            >
              {item}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
