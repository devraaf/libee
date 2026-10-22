import { useState, type FormEvent, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../../components/branding/Logo'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { PasswordInput } from '../../components/ui/PasswordInput'
import { RadioGroup } from '../../components/ui/RadioGroup'
import { Select } from '../../components/ui/Select'
import { AuthLayout } from '../../layouts/AuthLayout'

const relationshipOptions = [
  { value: 'student', label: 'Aluno' },
  { value: 'teacher', label: 'Professor' },
  { value: 'staff', label: 'Colaborador' }, 
]

//regex nome e m=email ======================================================
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'relationship' | 'course' | 'password' | 'confirmPassword' | 'terms', string>>

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    course: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  })

  const [relationship, setRelationship] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Errors>({})

  const isStudent = relationship === 'student'

  function handleInputChange(field: keyof typeof formData, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof Errors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handlePhoneChange(e: ChangeEvent<HTMLInputElement>) {
    const formatted = formatPhone(e.target.value)
    handleInputChange('phone', formatted)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors: Errors = {}

    const cleanName = formData.name.trim()
    const cleanEmail = formData.email.trim().toLowerCase()
    const rawPhone = formData.phone.replace(/\D/g, '')

    // Validação de Nome
    if (!cleanName) {
      nextErrors.name = 'Informe seu nome completo.'
    } else if (!NAME_REGEX.test(cleanName)) {
      nextErrors.name = 'O nome não deve conter números ou caracteres especiais.'
    } else if (cleanName.split(' ').filter(Boolean).length < 2) {
      nextErrors.name = 'Informe seu nome e sobrenome.'
    }

    // Validação de Telefone
    if (rawPhone && rawPhone.length < 10) {
      nextErrors.phone = 'Informe um telefone válido com DDD.'
    }

    // Validação de E-mail
    if (!cleanEmail) {
      nextErrors.email = 'Informe seu e-mail.'
    } else if (!EMAIL_REGEX.test(cleanEmail)) {
      nextErrors.email = 'Informe um e-mail válido.'
    }

    // Validação de Vínculo
    if (!relationship) {
      nextErrors.relationship = 'Selecione seu vínculo.'
    }

    // Validação de Curso (Apenas para Alunos)
    if (isStudent && !formData.course) {
      nextErrors.course = 'Selecione seu curso.'
    }

    // Validação de Senha (Para TODOS os vínculos)
    if (!formData.password) {
      nextErrors.password = 'Crie uma senha.'
    } else if (formData.password.length < 8) {
      nextErrors.password = 'A senha deve ter no mínimo 8 caracteres.'
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Confirme sua senha.'
    } else if (formData.confirmPassword !== formData.password) {
      nextErrors.confirmPassword = 'As senhas não coincidem.'
    }

    // Validação dos Termos de Uso
    if (!formData.termsAccepted) {
      nextErrors.terms = 'Você deve aceitar os termos de uso para continuar.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setIsLoading(true)
    try {
      // Lógica de envio para a API 

      // Limpa todos os campos e reseta o formulário após  sucesso
      setFormData({
        name: '',
        phone: '',
        email: '',
        course: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
      })
      setRelationship('')
      setErrors({})
    } catch (error) {
      // Tratar erros de requisição
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout>
      <Logo heightClassName="h-36" />
      <p className="type-small text-fg">Crie uma conta para continuar</p>

      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-3.5">
        <Input
          name="name"
          label="Nome completo"
          placeholder="ex. Maria da Silva"
          autoComplete="name"
          maxLength={100}
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          error={errors.name}
        />
        <Input
          name="phone"
          type="tel"
          label="Telefone"
          placeholder="(11) 99999-9999"
          autoComplete="tel"
          maxLength={15}
          value={formData.phone}
          onChange={handlePhoneChange}
          error={errors.phone}
        />
        <Input
          name="email"
          type="email"
          label="E-mail"
          placeholder="seu.email@exemplo.com"
          autoComplete="email"
          maxLength={254}
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          error={errors.email}
        />
        <RadioGroup
          legend="Tipo vínculo"
          name="relationship"
          options={relationshipOptions}
          value={relationship}
          onChange={(value) => {
            setRelationship(value)
            if (value !== 'student') {
              handleInputChange('course', '')
            }
            setErrors({})
          }}
          error={errors.relationship}
        />

        {/* Curso exibido apenas para o vínculo de Aluno */}
        {isStudent && (
          <Select
            name="course"
            label="Curso"
            options={[]}
            placeholder="Selecione"
            value={formData.course}
            onChange={(e) => handleInputChange('course', e.target.value)}
            error={errors.course}
          />
        )}

       
        <PasswordInput
          name="password"
          label="Senha"
          placeholder="Mínimo de 8 caracteres"
          autoComplete="new-password"
          maxLength={128}
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          error={errors.password}
        />
        <PasswordInput
          name="confirmPassword"
          label="Confirmar senha"
          placeholder="Digite a senha novamente"
          autoComplete="new-password"
          maxLength={128}
          value={formData.confirmPassword}
          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
        />

        <div className="flex flex-col gap-1 mt-1">
          <label className="flex items-center gap-2 text-sm text-fg cursor-pointer">
            <input
              type="checkbox"
              checked={formData.termsAccepted}
              onChange={(e) => handleInputChange('termsAccepted', e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span>Li e aceito os termos de uso e privacidade</span>
          </label>
          {errors.terms && <span className="text-xs text-red-500">{errors.terms}</span>}
        </div>

        <Button type="submit" size="lg" fullWidth className="mt-2" disabled={isLoading}>
          {isLoading ? 'Criando conta...' : 'Criar conta'}
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