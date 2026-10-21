import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from './IconButton';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'type' | 'trailing'>;

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <IconButton
          label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
          icon={visible ? <EyeOff size={16} /> : <Eye size={16} />}
        />
      }
    />
  );
}
