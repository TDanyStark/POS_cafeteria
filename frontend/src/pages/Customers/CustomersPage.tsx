import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useCustomers, useCreateCustomer } from '@/hooks/useCustomers'
import { Search, UserPlus, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

export function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showNewModal, setShowNewModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')

  const page   = parseInt(searchParams.get('page') ?? '1')
  const search = searchParams.get('search') ?? ''

  const { data, isLoading } = useCustomers({ page, limit: 20, search })
  const createCustomer = useCreateCustomer()

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      if (value) {
        next.set(key, value)
      } else {
        next.delete(key)
      }
      next.set('page', '1')
      return next
    })
  }

  const setPage = (p: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('page', String(p))
      return next
    })
  }

  const handleCreate = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      toast.error('Nombre y teléfono son requeridos')
      return
    }
    try {
      await createCustomer.mutateAsync({
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || null,
      })
      toast.success('Cliente registrado')
      setShowNewModal(false)
      setNewName('')
      setNewPhone('')
      setNewEmail('')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar cliente'
      toast.error(msg)
    }
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <Button onClick={() => setShowNewModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nuevo cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, teléfono..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Registrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No se encontraron clientes
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-mono text-sm text-muted-foreground">{customer.id}</TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {customer.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.email ? (
                      <div className="flex items-center gap-1.5 text-sm">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {customer.email}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm italic">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(customer.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {data.pagination.total} clientes
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
            <span className="flex items-center px-2 text-muted-foreground">
              {page} / {data.pagination.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.total_pages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
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
