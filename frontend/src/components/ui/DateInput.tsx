import { CalendarDays } from 'lucide-react'
import { Input, type InputProps } from './Input'

export type DateInputProps = Omit<InputProps, 'type' | 'trailing'>

/** Campo de data nativo (seletor do navegador) com ícone do design. */
export function DateInput(props: DateInputProps) {
  return (
    <Input
      {...props}
      type="date"
      className="[&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:size-5 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
      trailing={<CalendarDays size={18} aria-hidden="true" className="pointer-events-none mr-2 text-muted" />}
    />
  )
}
