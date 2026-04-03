interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Slider({ label, value, min, max, step = 1, unit = '', onChange, disabled }: SliderProps) {
  return (
    <div className={`flex flex-col gap-1 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-sp-text-muted">{label}</span>
        <span className="text-xs font-mono text-sp-accent tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-sp-accent"
      />
    </div>
  );
}
