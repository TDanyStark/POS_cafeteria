import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/axios'
import type { ApiResponse } from '@/types/catalog'
import type { EmailSettings, UpdateEmailSettingsPayload } from '@/types/settings'

export function useEmailSettings() {
  return useQuery<EmailSettings>({
    queryKey: ['settings', 'email'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<EmailSettings>>('/settings/email')
      return data.data!
    },
  })
}

export function useUpdateEmailSettings() {
  const queryClient = useQueryClient()

  return useMutation<EmailSettings, Error, UpdateEmailSettingsPayload>({
    mutationFn: async (payload) => {
      const { data } = await api.put<ApiResponse<EmailSettings>>('/settings/email', payload)
      return data.data!
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'email'] })
    },
  })
}

export function useSendTestEmail() {
  return useMutation<void, Error>({
    mutationFn: async () => {
      await api.post('/settings/email/test')
    },
  })
}
