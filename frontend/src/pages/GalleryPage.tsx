import { Bell, BookText, Library, Plus, Search, Settings, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Logo } from '../components/branding/Logo.tsx'
import { Footer } from '../components/navigation/Footer'
import { Navbar } from '../components/navigation/Navbar'
import { Sidebar } from '../components/navigation/Sidebar'
import { ThemeToggle } from '../components/navigation/ThemeToggle'
import { Topbar } from '../components/navigation/Topbar'
import { Badge } from '../components/ui/Badge'
import { Button, type ButtonVariant } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Chip } from '../components/ui/Chip'
import { DateInput } from '../components/ui/DateInput'
import { EmptyState } from '../components/ui/EmptyState'
import { FilterButton } from '../components/ui/FilterButton'
import { IconButton } from '../components/ui/IconButton'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { PageHeader } from '../components/ui/PageHeader'
import { PasswordInput } from '../components/ui/PasswordInput'
import { Pagination } from '../components/ui/Pagination'
import { RadioGroup } from '../components/ui/RadioGroup'
import { SearchInput } from '../components/ui/SearchInput'
import { Select } from '../components/ui/Select'
import { StatCard } from '../components/ui/StatCard'
import { Table, type TableColumn } from '../components/ui/Table'
import { Tabs } from '../components/ui/Tabs'
import { useDisclosure } from '../hooks/useDisclosure'
import type { NavLinkItem } from '../types/navigation'

const links: NavLinkItem[] = [
  { label: 'Item um', to: '/', icon: Library, end: true },
  { label: 'Item dois', to: '/#dois', icon: BookText },
  { label: 'Item três', to: '/#tres', icon: Users },
]

interface Row {
  id: number
  a: string
  b: string
}
const columns: TableColumn<Row>[] = [
  { key: 'a', header: 'Cabeçalho', render: (r) => r.a },
  { key: 'b', header: 'Cabeçalho', render: (r) => r.b },
  { key: 's', header: 'Status', render: () => <Badge variant="success" dot>Disponível</Badge> },
]
const rows: Row[] = [1, 2, 3].map((id) => ({ id, a: 'Célula', b: 'Célula' }))

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="flex flex-col gap-5 border-t border-line py-10">
      <h2 className="type-h2">{title}</h2>
      {children}
    </section>
  )
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="type-caption font-semibold text-muted">{label}</p>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </div>
  )
}

const buttonVariants: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost']
const categories = ['Ações', 'Formulários', 'Exibição de dados', 'Feedback e overlays', 'Navegação', 'Identidade']

export function GalleryPage() {
  const modal = useDisclosure()
  const [tab, setTab] = useState('a')
  const [page, setPage] = useState(1)
  const [radio, setRadio] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 py-8">
        <div className="flex items-center gap-4">
          <Logo heightClassName="h-14" />
          <h1 className="type-h1">Galeria de componentes Apenas a visao dos componentes reutilizaveis</h1>
        </div>
        <ThemeToggle />
      </header>
      <nav aria-label="Categorias" className="flex flex-wrap gap-2 pb-6">
        {categories.map((c) => (
          <a key={c} href={`#${c}`} className="type-small rounded-full bg-chip px-3 py-1 text-muted hover:text-fg">
            {c}
          </a>
        ))}
      </nav>

      <Section id="Ações" title="Ações">
        {buttonVariants.map((v) => (
          <Demo key={v} label={`Button — ${v}`}>
            <Button variant={v} size="sm">Pequeno</Button>
            <Button variant={v}>Médio</Button>
            <Button variant={v} size="lg">Grande</Button>
            <Button variant={v} leftIcon={<Plus size={16} />}>Com ícone</Button>
            <Button variant={v} disabled>Desabilitado</Button>
          </Demo>
        ))}
        <Demo label="IconButton">
          <IconButton label="Notificações" icon={<Bell size={18} />} />
          <IconButton label="Configurações" icon={<Settings size={18} />} variant="outline" />
          <IconButton label="Pequeno" icon={<Search size={14} />} size="sm" variant="outline" />
          <IconButton label="Desabilitado" icon={<Bell size={18} />} disabled />
        </Demo>
        <Demo label="FilterButton">
          <FilterButton />
        </Demo>
        <Demo label="ThemeToggle">
          <ThemeToggle />
        </Demo>
      </Section>

      <Section id="Formulários" title="Formulários">
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Input" placeholder="Placeholder" />
          <Input label="Com dica" placeholder="Placeholder" hint="Texto de apoio" />
          <Input label="Com erro" placeholder="Placeholder" error="Mensagem de erro" />
          <Input label="Desabilitado" placeholder="Placeholder" disabled />
          <PasswordInput label="PasswordInput" placeholder="Mínimo de 8 caracteres" />
          <DateInput label="DateInput" />
          <Select label="Select" options={[{ value: 'a', label: 'Opção A' }, { value: 'b', label: 'Opção B' }]} />
          <Select label="Select com erro" options={[]} error="Selecione uma opção" />
          <RadioGroup legend="RadioGroup" name="demo" value={radio} onChange={setRadio} options={[{ value: '1', label: 'Opção 1' }, { value: '2', label: 'Opção 2' }, { value: '3', label: 'Opção 3' }]} />
          <SearchInput />
        </div>
      </Section>

      <Section id="Exibição de dados" title="Exibição de dados">
        <Demo label="Badge">
          <Badge variant="success" dot>Disponível</Badge>
          <Badge variant="warning" dot>Reservado</Badge>
          <Badge variant="info" dot>Emprestado</Badge>
          <Badge variant="danger" dot>Atrasado</Badge>
          <Badge variant="neutral" dot>Manutenção</Badge>
          <Badge variant="success">Em dia</Badge>
          <Badge variant="neutral">Devolvido</Badge>
        </Demo>
        <Demo label="Chip">
          <Chip>Romance</Chip>
          <Chip>Ficção Científica</Chip>
          <Chip>Tecnologia</Chip>
        </Demo>
        <Demo label="Card">
          <Card className="p-4">Card padrão</Card>
          <Card tone="warm" className="p-4">Card quente</Card>
        </Demo>
        <Demo label="StatCard">
          <StatCard label="Com valor" icon={<Library size={20} />} value={100} />
          <StatCard label="Sem valor" icon={<Users size={20} />} />
        </Demo>
        <Demo label="PageHeader">
          <div className="w-full"><PageHeader title="Título" subtitle="Subtítulo da página" action={<Button leftIcon={<Plus size={16} />}>Ação</Button>} /></div>
        </Demo>
        <Demo label="Tabs">
          <Tabs label="Demo" value={tab} onChange={setTab} items={[{ id: 'a', label: 'Aba A (0)' }, { id: 'b', label: 'Aba B (0)' }]} />
        </Demo>
        <Demo label="Table + Pagination">
          <div className="w-full">
            <Table caption="Demonstração" columns={columns} rows={rows} getRowKey={(r) => r.id} footer={<Pagination page={page} totalPages={10} onPageChange={setPage} summary="Mostrando 3 de 30" />} />
          </div>
        </Demo>
        <Demo label="Table vazia">
          <div className="w-full"><Table columns={columns} rows={[]} getRowKey={(r) => r.id} emptyState={<EmptyState title="Nenhum registro disponível." />} /></div>
        </Demo>
      </Section>

      <Section id="Feedback e overlays" title="Feedback e overlays">
        <Demo label="EmptyState">
          <Card className="w-full"><EmptyState icon={<BookText size={22} />} title="Nenhum resultado encontrado." description="Ajuste a busca e tente novamente." action={<Button variant="outline">Ação</Button>} /></Card>
        </Demo>
        <Demo label="Modal">
          <Button variant="secondary" onClick={modal.open}>Abrir modal</Button>
        </Demo>
        <Modal open={modal.isOpen} onClose={modal.close} title="Título do modal" footer={<><Button variant="outline" onClick={modal.close}>Cancelar</Button><Button variant="secondary" onClick={modal.close}>Confirmar</Button></>}>
          <p className="type-body">Conteúdo do modal fornecido pela página.</p>
        </Modal>
      </Section>

      <Section id="Navegação" title="Navegação">
        <Demo label="Navbar (com sair)">
          <div className="w-full overflow-hidden rounded-xl border border-line [transform:translateZ(0)]"><Navbar links={links} showLogout /></div>
        </Demo>
        <Demo label="Sidebar + Topbar (recolhível)">
          <div className="flex h-[26rem] w-full overflow-hidden rounded-xl border border-line [transform:translateZ(0)]">
            <Sidebar links={links} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((v) => !v)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
            <div className="min-w-0 flex-1"><Topbar onOpenMenu={() => setMobileOpen(true)} /></div>
          </div>
        </Demo>
        <Demo label="Footer">
          <div className="w-full overflow-hidden rounded-xl border border-line"><Footer /></div>
        </Demo>
      </Section>

      <Section id="Identidade" title="Identidade">
        <Demo label="Logo — full / mark">
          <Logo heightClassName="h-16" />
          <Logo variant="mark" heightClassName="h-16" />
        </Demo>
      </Section>
    </div>
  )
}
