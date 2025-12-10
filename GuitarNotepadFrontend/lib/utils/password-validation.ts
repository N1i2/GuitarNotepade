export interface PasswordValidationResult {
  isValid: boolean
  errors: string[]
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&* etc.)')
  }

  const weakPasswords = [
    'password', '12345678', 'qwerty', 'admin', 'welcome',
    'password1', '123456789', 'abc123', 'password123'
  ]
  
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common and insecure')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword
}

export const getPasswordStrength = (password: string): {
  strength: 'very-weak' | 'weak' | 'medium' | 'strong' | 'very-strong'
  score: number
} => {
  let score = 0

  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  const strengthMap = {
    0: 'very-weak',
    1: 'very-weak',
    2: 'weak',
    3: 'medium',
    4: 'strong',
    5: 'very-strong',
    6: 'very-strong'
  } as const

  return {
    strength: strengthMap[Math.min(score, 6) as keyof typeof strengthMap],
    score
  }
}