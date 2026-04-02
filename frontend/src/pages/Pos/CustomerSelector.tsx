import { useState } from 'react'
import AsyncSelect from 'react-select/async'
import { components, type MenuProps, type GroupBase } from 'react-select'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/stores/cartStore'
import { UserPlus, X, Search, Edit2 } from 'lucide-react'
import api from '@/lib/axios'
import type { PaginatedResponse } from '@/types/catalog'
import type { Customer } from '@/types/sales'
import { CustomerFormModal } from './CustomerFormModal'

interface CustomerOption {
  value: number
  label: string
  customer: Customer
}

export function CustomerSelector() {
  const customer = useCartStore((s) => s.customer)
  const setCustomer = useCartStore((s) => s.setCustomer)
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const loadOptions = async (inputValue: string) => {
    if (!inputValue || inputValue.length < 1) return []
    try {
      const { data } = await api.get<PaginatedResponse<Customer>>(`/customers?search=${encodeURIComponent(inputValue)}`)
      return data.data.map((c) => ({
        value: c.id,
        label: `${c.name} (${c.phone || 'Sin tel.'})`,
        customer: c,
      }))
    } catch (error) {
      console.error('Error fetching customers:', error)
      return []
    }
  }

  const handleSelect = (option: CustomerOption | null) => {
    if (option) {
      setCustomer(option.customer)
    } else {
      setCustomer(null)
    }
  }

  const handleClear = () => {
    setCustomer(null)
  }

  const handleSuccess = (updatedOrNewCustomer: Customer) => {
    setCustomer(updatedOrNewCustomer)
    setShowModal(false)
    setIsEditing(false)
  }

  const handleCreateNew = () => {
    setIsEditing(false)
    setShowModal(true)
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowModal(true)
  }

  // Custom components for react-select to match shadcn/ui
  const CustomMenu = (props: MenuProps<CustomerOption, false, GroupBase<CustomerOption>>) => {
    return (
      <components.Menu {...props}>
        <div>
          {props.children}
          <div className="border-t border-border p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs h-8"
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleCreateNew()
              }}
            >
              <UserPlus className="h-3.5 w-3.5 mr-2" />
              Crear nuevo cliente
            </Button>
          </div>
        </div>
      </components.Menu>
    )
  }

  if (customer) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border animate-in fade-in duration-200">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{customer.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {customer.phone || 'Sin teléfono'} {customer.email ? `• ${customer.email}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={handleEdit}
            title="Editar cliente"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground" 
            onClick={handleClear}
            title="Quitar cliente"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <CustomerFormModal
          open={showModal}
          onOpenChange={setShowModal}
          onSuccess={handleSuccess}
          customer={isEditing ? customer : null}
        />
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <div className="relative group">
        <AsyncSelect<CustomerOption, false>
          cacheOptions
          loadOptions={loadOptions}
          onChange={(option) => handleSelect(option as CustomerOption | null)}
          placeholder="Buscar cliente (nombre o tel)..."
          noOptionsMessage={({ inputValue }) => 
            inputValue.length < 1 ? "Escribe para buscar..." : "No se encontraron clientes"
          }
          loadingMessage={() => "Buscando..."}
          components={{
            Menu: CustomMenu,
            DropdownIndicator: () => (
              <div className="px-2">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
            ),
            IndicatorSeparator: () => null,
          }}
          className="react-select-container"
          classNamePrefix="react-select"
          styles={{
            control: (base, state) => ({
              ...base,
              backgroundColor: 'transparent',
              borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
              borderRadius: 'var(--radius)',
              minHeight: '2.25rem',
              boxShadow: 'none',
              '&:hover': {
                borderColor: state.isFocused ? 'var(--ring)' : 'var(--input)',
              },
            }),
            menu: (base) => ({
              ...base,
              backgroundColor: 'var(--popover)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--radius)',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              overflow: 'hidden',
              zIndex: 50,
            }),
            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected 
                ? 'var(--primary)' 
                : state.isFocused 
                  ? 'var(--accent)' 
                  : 'transparent',
              color: state.isSelected 
                ? 'var(--primary-foreground)' 
                : 'var(--foreground)',
              fontSize: '0.875rem',
              cursor: 'pointer',
              '&:active': {
                backgroundColor: 'var(--accent)',
              },
            }),
            input: (base) => ({
              ...base,
              color: 'var(--foreground)',
              fontSize: '0.875rem',
            }),
            placeholder: (base) => ({
              ...base,
              color: 'var(--muted-foreground)',
              fontSize: '0.875rem',
            }),
            singleValue: (base) => ({
              ...base,
              color: 'var(--foreground)',
              fontSize: '0.875rem',
            }),
            noOptionsMessage: (base) => ({
              ...base,
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
            }),
            loadingMessage: (base) => ({
              ...base,
              fontSize: '0.875rem',
              color: 'var(--muted-foreground)',
            }),
          }}
        />
      </div>

      <CustomerFormModal
        open={showModal}
        onOpenChange={setShowModal}
        onSuccess={handleSuccess}
        customer={null}
      />
    </div>
  )
}

