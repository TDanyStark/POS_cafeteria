import axios from 'axios'

interface ErrorPayload {
  message?: string
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ErrorPayload>(error)) {
    return error.response?.data?.message ?? fallback
  }

  if (error instanceof Error) {
    return error.message
  }

  return fallback
}
