"use client"

import { getPasswordStrength } from "@/lib/utils/password-validation"

interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null

  const { strength, score } = getPasswordStrength(password)

  const strengthConfig = {
    'very-weak': { color: 'bg-red-500', text: 'Very Weak' },
    'weak': { color: 'bg-orange-500', text: 'Weak' },
    'medium': { color: 'bg-yellow-500', text: 'Medium' },
    'strong': { color: 'bg-green-500', text: 'Strong' },
    'very-strong': { color: 'bg-green-600', text: 'Very Strong' }
  }

  const config = strengthConfig[strength]

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Password strength:</span>
        <span className={`font-medium ${
          strength === 'very-weak' || strength === 'weak' ? 'text-red-500' :
          strength === 'medium' ? 'text-yellow-500' : 'text-green-500'
        }`}>
          {config.text}
        </span>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5, 6].map((index) => (
          <div
            key={index}
            className={`h-2 flex-1 rounded-full transition-colors ${
              index <= score ? config.color : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
    </div>
  )
}