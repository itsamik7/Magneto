import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').optional().or(z.literal('')),
  email: z.string().trim().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const tripSchema = z.object({
  destinationName: z.string().trim().min(2, 'Destination name must be at least 2 characters'),
  magnetKey: z.enum(['paris', 'japan', 'goa', 'switzerland', 'london', 'bali']),
  targetBudgetRupees: z
    .number()
    .positive('Target budget must be greater than zero')
    .max(100000000, 'Budget exceeds allowed limit'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate)
    }
    return true
  },
  {
    message: 'End date cannot precede start date',
    path: ['endDate'],
  }
)

export const savingsDepositSchema = z.object({
  amountRupees: z
    .number()
    .positive('Deposit amount must be greater than zero')
    .max(100000000, 'Deposit exceeds maximum allowable amount'),
  note: z.string().optional().or(z.literal('')),
})

export const itinerarySchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  activityDate: z.string().optional().or(z.literal('')),
  tripDay: z.number().int().positive().optional().nullable(),
  activityTime: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const checklistSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required'),
  dueDate: z.string().optional().or(z.literal('')),
})

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type TripFormData = z.infer<typeof tripSchema>
export type SavingsDepositFormData = z.infer<typeof savingsDepositSchema>
export type ItineraryFormData = z.infer<typeof itinerarySchema>
export type ChecklistFormData = z.infer<typeof checklistSchema>
