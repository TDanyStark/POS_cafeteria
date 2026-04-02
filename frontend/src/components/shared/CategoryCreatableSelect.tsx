import CreatableSelect from 'react-select/creatable'
import type { StylesConfig, GroupBase } from 'react-select'
import { toast } from 'sonner'
import { useCategories, useCreateCategory } from '@/hooks/useCategories'

interface Option {
  value: string
  label: string
  __isNew__?: boolean
}

interface Props {
  value: string
  onChange: (value: string) => void
  hasError?: boolean
}

/**
 * Select de categoría con soporte para crear una nueva desde el mismo campo.
 * Se integra visualmente con el sistema de diseño (Shadcn + variables CSS del tema).
 */
export function CategoryCreatableSelect({ value, onChange, hasError }: Props) {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()

  const options: Option[] =
    categories?.map((cat) => ({
      value: String(cat.id),
      label: cat.name,
    })) ?? []

  const selected = options.find((o) => o.value === value) ?? null

  const handleChange = (option: Option | null) => {
    onChange(option ? option.value : '')
  }

  const handleCreate = async (inputValue: string) => {
    try {
      const newCat = await createCategory.mutateAsync({ name: inputValue })
      toast.success(`Categoría "${newCat.name}" creada`)
      onChange(String(newCat.id))
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al crear la categoría'
      toast.error(message)
    }
  }

  const styles: StylesConfig<Option, false, GroupBase<Option>> = {
    control: (base, state) => ({
      ...base,
      minHeight: '2rem',
      height: '2rem',
      fontSize: '0.875rem',
      backgroundColor: 'transparent',
      borderColor: hasError
        ? `var(--destructive)`
        : state.isFocused
        ? `var(--ring)`
        : `var(--border)`,
      borderRadius: 'var(--radius)',
      boxShadow: state.isFocused
        ? hasError
          ? '0 0 0 3px color-mix(in oklch, var(--destructive) 20%, transparent)'
          : '0 0 0 3px color-mix(in oklch, var(--ring) 50%, transparent)'
        : 'none',
      '&:hover': {
        borderColor: hasError ? `var(--destructive)` : `var(--ring)`,
      },
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 0.5rem',
    }),
    singleValue: (base) => ({
      ...base,
      color: `var(--foreground)`,
      margin: 0,
    }),
    placeholder: (base) => ({
      ...base,
      color: `var(--muted-foreground)`,
      fontSize: '0.875rem',
    }),
    input: (base) => ({
      ...base,
      color: `var(--foreground)`,
      margin: 0,
      padding: 0,
    }),
    indicatorSeparator: () => ({ display: 'none' }),
    dropdownIndicator: (base) => ({
      ...base,
      color: `var(--muted-foreground)`,
      padding: '0 0.375rem',
      '&:hover': { color: `var(--foreground)` },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: `var(--muted-foreground)`,
      padding: '0 0.375rem',
      '&:hover': { color: `var(--foreground)` },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: `var(--popover)`,
      border: `1px solid var(--border)`,
      borderRadius: 'var(--radius)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
      zIndex: 9999,
      overflow: 'hidden',
    }),
    menuList: (base) => ({
      ...base,
      padding: '0.25rem',
    }),
    option: (base, state) => ({
      ...base,
      fontSize: '0.875rem',
      borderRadius: 'calc(var(--radius) - 2px)',
      padding: '0.375rem 0.5rem',
      backgroundColor: state.isSelected
        ? `var(--primary)`
        : state.isFocused
        ? `var(--accent)`
        : 'transparent',
      color: state.isSelected
        ? `var(--primary-foreground)`
        : `var(--foreground)`,
      cursor: 'default',
      '&:active': {
        backgroundColor: `var(--accent)`,
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: `var(--muted-foreground)`,
      fontSize: '0.875rem',
    }),
    loadingMessage: (base) => ({
      ...base,
      color: `var(--muted-foreground)`,
      fontSize: '0.875rem',
    }),
  }

  return (
    <CreatableSelect<Option>
      options={options}
      value={selected}
      onChange={handleChange}
      onCreateOption={handleCreate}
      isLoading={isLoading || createCategory.isPending}
      isDisabled={createCategory.isPending}
      placeholder="Selecciona o escribe para crear..."
      formatCreateLabel={(input) => `Crear categoría "${input}"`}
      noOptionsMessage={() => 'Sin resultados'}
      loadingMessage={() => 'Cargando...'}
      styles={styles}
      unstyled={false}
      isClearable={false}
      classNamePrefix="rs"
    />
  )
}
