import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/branding/Logo'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { AuthLayout } from '../../layouts/AuthLayout'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()
    const nextErrors: typeof errors = {}

    if (!cleanEmail) {
      nextErrors.email = 'Informe seu e-mail.'
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }

    if (!cleanPassword) {
      nextErrors.password = 'Informe sua senha.'
    } else if (cleanPassword.length < 8) {
      nextErrors.password = 'A senha deve ter no mínimo 8 caracteres.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsLoading(true)
    try {
      // Lógica de submissão da API/autenticação aqui
      setEmail('')
      setPassword('')
      setErrors({})
    } catch (error) {
      // Tratamento de erro de login.
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Entre com sua conta para continuar</p>

      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <Input
          name="email"
          type="email"
          label="E-mail"
          placeholder="seu.email@exemplo.com"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
        />
        <PasswordInput
          name="password"
          label="Senha"
          placeholder="Mínimo de 8 caracteres"
          autoComplete="current-password"
          maxLength={128}
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
        />
        <Button type="submit" size="lg" fullWidth className="mt-2" disabled={isLoading}>
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="type-small text-muted">
        Não possui uma conta?{' '}
        <Link to="/cadastro" className="text-primary hover:underline">
          Cadastre-se
        </Link>
      </p>
    </AuthLayout>
  )
}