import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { DollarSign, Vault } from 'lucide-react'
import { toast } from 'sonner'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useOpenCashRegister, useActiveCashRegister } from '@/hooks/useCashRegister'
import { ForceCloseModal } from './ForceCloseModal'
import { CloseRegisterModal } from './CloseRegisterModal'
import type { CashRegister } from '@/types/cashRegister'

interface FormValues {
  initial_amount: string
}

export function OpenRegisterView() {
  const { mutate: openRegister, isPending } = useOpenCashRegister()
  const { refetch: refetchActive } = useActiveCashRegister()

  const [conflictRegister, setConflictRegister] = useState<CashRegister | null>(null)
  const [forceCloseOpen, setForceCloseOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { initial_amount: '' } })

  const onSubmit = (values: FormValues) => {
    const amount = parseFloat(values.initial_amount)
    if (isNaN(amount) || amount < 0) {
      toast.error('Ingresa un monto inicial válido.')
      return
    }

    openRegister(
      { initial_amount: amount },
      {
        onSuccess: () => {
          toast.success('Caja abierta correctamente.')
        },
        onError: async (err: unknown) => {
          // 409 means there's already an open register — force user to close it first
          if (axios.isAxiosError(err) && err.response?.status === 409) {
            const { data: existing } = await refetchActive()
            if (existing) {
              setConflictRegister(existing)
              setForceCloseOpen(true)
            } else {
              toast.error('Ya existe una caja abierta. Recarga la página.')
            }
          } else {
            const message =
              err instanceof Error ? err.message : 'Error al abrir la caja.'
            toast.error(message)
          }
        },
      }
    )
  }

  const handleProceedToClose = () => {
    setForceCloseOpen(false)
    setCloseModalOpen(true)
  }

  const handleCloseModalDone = () => {
    setCloseModalOpen(false)
    setConflictRegister(null)
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Vault className="h-7 w-7 text-primary" />
            </div>
            <CardTitle>Abrir Caja</CardTitle>
            <CardDescription>
              Ingresa el saldo inicial en efectivo para comenzar el turno.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="initial_amount">Monto inicial en efectivo</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="initial_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="pl-9"
                    {...register('initial_amount', {
                      required: 'El monto inicial es requerido.',
                      min: { value: 0, message: 'El monto no puede ser negativo.' },
                    })}
                  />
                </div>
                {errors.initial_amount && (
                  <p className="text-sm text-destructive">{errors.initial_amount.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Abriendo...' : 'Abrir Caja'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Guard: previous unclosed register */}
      {conflictRegister && (
        <>
          <ForceCloseModal
            open={forceCloseOpen}
            register={conflictRegister}
            onProceedToClose={handleProceedToClose}
          />
          <CloseRegisterModal
            open={closeModalOpen}
            onClose={handleCloseModalDone}
            register={conflictRegister}
          />
        </>
      )}
    </>
  )
}
