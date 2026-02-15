import { useId, type ChangeEvent } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'password';
  inputMode?: 'text' | 'numeric';
  maxLength?: number;
  onChange: (value: string) => void;
}

export function TextField({
  label,
  value,
  placeholder,
  disabled = false,
  type = 'text',
  inputMode,
  maxLength,
  onChange
}: TextFieldProps) {
  const inputId = useId();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className="field" htmlFor={inputId}>
      <span className="field__label">{label}</span>
      <input
        id={inputId}
        className="field__input"
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
