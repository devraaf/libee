import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../shared/components/branding/Logo'
import { Button } from '../../shared/components/ui/Button'
import { Input } from '../../shared/components/ui/Input'
import { PasswordInput } from '../../shared/components/ui/PasswordInput'
import { AuthLayout } from '../../shared/layouts/AuthLayout'
import { registerSchema } from './schemas/auth.schema'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
    confirmPassword?: string
  }>({})

  function handleEmailChange(e: ChangeEvent<HTMLInputElement>) {
    setEmail(e.target.value)
    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
  }

  function handlePasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setPassword(e.target.value)
    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }))
  }

  function handleConfirmPasswordChange(e: ChangeEvent<HTMLInputElement>) {
    setConfirmPassword(e.target.value)
    if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Validação com o schema do Zod
    const validationResult = registerSchema.safeParse({
      email,
      password,
      confirmPassword,
    })

    if (!validationResult.success) {
      const formattedErrors: typeof errors = {}
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
      // Submissão bem-sucedida
      // const cleanData = validationResult.data

      // Limpeza dos campos e erros após envio bem-sucedido
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setErrors({})
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Crie sua conta para começar</p>

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
          autoComplete="new-password"
          maxLength={128}
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
        />

        <PasswordInput
          name="confirmPassword"
          label="Confirmar Senha"
          placeholder="Repita sua senha"
          autoComplete="new-password"
          maxLength={128}
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword}
        />

        <Button type="submit" size="lg" fullWidth className="mt-2" disabled={isLoading}>
          {isLoading ? 'Cadastrando...' : 'Cadastrar'}
        </Button>
      </form>

      <p className="type-small text-muted">
        Já possui uma conta?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  )
}