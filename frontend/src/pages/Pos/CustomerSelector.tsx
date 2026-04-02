import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useCartStore } from '@/stores/cartStore'
import { useCustomerSearch, useCreateCustomer } from '@/hooks/useCustomers'
import type { Customer } from '@/types/sales'
import { UserPlus, X, Search } from 'lucide-react'
import { toast } from 'sonner'

export function CustomerSelector() {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  const customer = useCartStore((s) => s.customer)
  const setCustomer = useCartStore((s) => s.setCustomer)

  const { data: results } = useCustomerSearch(query)
  const createCustomer = useCreateCustomer()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (c: Customer) => {
    setCustomer(c)
    setQuery('')
    setShowDropdown(false)
  }

  const handleClear = () => {
    setCustomer(null)
    setQuery('')
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Nombre y teléfono son requeridos')
      return
    }
    try {
      const c = await createCustomer.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || null,
      })
      setCustomer(c)
      setShowNewModal(false)
      setNewName('')
      setNewPhone('')
      setNewEmail('')
      toast.success('Cliente registrado')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear cliente'
      toast.error(msg)
    }
  }

  if (customer) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
        <div className="flex-1">
          <p className="text-sm font-medium">{customer.name}</p>
          <p className="text-xs text-muted-foreground">{customer.phone}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleClear}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente (opcional)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setShowDropdown(true)
            }}
            onFocus={() => setShowDropdown(true)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          title="Registrar nuevo cliente"
          onClick={() => setShowNewModal(true)}
        >
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>

      {showDropdown && results && results.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
          {results.map((c) => (
            <button
              key={c.id}
              className="w-full text-left px-3 py-2 hover:bg-accent transition-colors text-sm"
              onClick={() => handleSelect(c)}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-muted-foreground ml-2">{c.phone}</span>
            </button>
          ))}
        </div>
      )}

      {/* New Customer Modal */}
      <Dialog open={showNewModal} onOpenChange={setShowNewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre completo" />
            </div>
            <div className="space-y-1.5">
              <Label>Teléfono *</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="300-000-0000" />
            </div>
            <div className="space-y-1.5">
              <Label>Correo (opcional)</Label>
              <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="correo@ejemplo.com" type="email" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewModal(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={createCustomer.isPending}>
              {createCustomer.isPending ? 'Guardando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
