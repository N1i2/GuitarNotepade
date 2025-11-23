import { ApiError } from '@/lib/api/client'

// 👇 Функция для извлечения конкретных ошибок из сообщения
export const parseBackendError = (error: ApiError | Error): { 
  fieldErrors: { [key: string]: string[] },
  generalError: string | null 
} => {
  const fieldErrors: { [key: string]: string[] } = {}
  let generalError: string | null = null

  if (error instanceof ApiError && error.errors) {
    // Если есть структурированные ошибки от бэкенда
    return {
      fieldErrors: error.errors,
      generalError: error.message
    }
  }

  const message = error.message

  // 👇 Парсим сообщения от ваших кастомных исключений
  if (message.includes('Email:')) {
    fieldErrors.email = [extractErrorMessage(message, 'Email:')]
  } else if (message.includes('Password:')) {
    fieldErrors.password = [extractErrorMessage(message, 'Password:')]
  } else if (message.includes('NikName:')) {
    fieldErrors.nikName = [extractErrorMessage(message, 'NikName:')]
  } else if (message.includes('User with this email already exists')) {
    fieldErrors.email = ['User with this email already exists']
  } else if (message.includes('User with this nickname already exists')) {
    fieldErrors.nikName = ['User with this nickname already exists']
  } else {
    // Общая ошибка
    generalError = message
  }

  return { fieldErrors, generalError }
}

// 👇 Вспомогательная функция для извлечения текста ошибки
const extractErrorMessage = (fullMessage: string, prefix: string): string => {
  const startIndex = fullMessage.indexOf(prefix) + prefix.length
  const endIndex = fullMessage.indexOf(',', startIndex)
  
  if (endIndex === -1) {
    return fullMessage.slice(startIndex).trim()
  }
  
  return fullMessage.slice(startIndex, endIndex).trim()
}

// 👇 Функция для показа пользовательских сообщений об ошибках
export const showErrorToast = (error: unknown, toast: any) => {
  if (error instanceof ApiError) {
    const { fieldErrors, generalError } = parseBackendError(error)
    
    if (Object.keys(fieldErrors).length > 0) {
      // Показываем первую ошибку поля
      const firstField = Object.keys(fieldErrors)[0]
      const firstError = fieldErrors[firstField]?.[0]
      
      toast.error("Validation error", {
        description: firstError || "Please check the form for errors"
      })
    } else if (generalError) {
      toast.error("Error", {
        description: generalError
      })
    } else {
      toast.error("Error", {
        description: error.message
      })
    }
  } else if (error instanceof Error) {
    toast.error("Error", {
      description: error.message
    })
  } else {
    toast.error("Error", {
      description: "An unexpected error occurred"
    })
  }
}