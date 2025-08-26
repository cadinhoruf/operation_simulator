import { useEffect, useState } from "react";
import { Input } from "./ui/input";

interface CurrencyInputProps {
  value?: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function CurrencyInput({
  value = 0,
  onChange,
  placeholder,
  className,
  onKeyDown,
}: CurrencyInputProps) {
  const parseCurrency = (val: string) => {
    const onlyNumbers = val.replace(/[^0-9]/g, "");
    return Number(onlyNumbers) / 100;
  };

  const [display, setDisplay] = useState(value);

  const brazilianFormatter = Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  });

  useEffect(() => {
    setDisplay(value);
  }, [value]);

  return (
    <Input
      inputMode="numeric"
      value={brazilianFormatter.format(display)}
      placeholder={placeholder}
      onChange={(e) => {
        const raw = e.target.value;
        const parsed = parseCurrency(raw);
        setDisplay(parsed);
        onChange(parsed);
      }}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
}
