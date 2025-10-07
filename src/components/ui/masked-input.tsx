import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";
import { InputProps } from "@/components/ui/input";

export interface MaskedInputProps extends Omit<InputProps, 'onChange'> {
  mask: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, error, onChange, ...props }, ref) => {
    return (
      <InputMask
        mask={mask}
        onChange={onChange}
        {...props}
      >
        {(inputProps: any) => (
          <input
            {...inputProps}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-colors",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
          />
        )}
      </InputMask>
    );
  },
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
