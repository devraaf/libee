import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../shared/components/branding/Logo'
import { Button } from '../../shared/components/ui/Button'
import { Input } from '../../shared/components/ui/Input'
import { PasswordInput } from '../../shared/components/ui/PasswordInput'
import { AuthLayout } from '../../shared/layouts/AuthLayout'
import { loginSchema } from './schemas/auth.schema'

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
    
    // Validação utilizando o Schema isolado do Zod
    const validationResult = loginSchema.safeParse({ email, password })

    if (!validationResult.success) {
      const formattedErrors: { email?: string; password?: string } = {}
      validationResult.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof typeof formattedErrors
        if (!formattedErrors[fieldName]) {
          formattedErrors[fieldName] = issue.message
        }
      })
      setErrors(formattedErrors)
      return
    }

    setIsLoading(true)
    try {

      setEmail('')
      setPassword('')
      setErrors({})
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