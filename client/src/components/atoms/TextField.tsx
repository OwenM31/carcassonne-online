import { useId, type ChangeEvent } from 'react';

interface TextFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export function TextField({
  label,
  value,
  placeholder,
  disabled = false,
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
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        disabled={disabled}
      />
    </label>
  );
}
