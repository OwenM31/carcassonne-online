import type { CSSProperties, ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className,
  style
}: ButtonProps) {
  const classes = ['button', `button--${variant}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} type={type} onClick={onClick} disabled={disabled} style={style}>
      {children}
    </button>
  );
}
