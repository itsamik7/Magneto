import { describe, it, expect } from 'vitest'
import {
  tripSchema,
  savingsDepositSchema,
  itinerarySchema,
  checklistSchema,
  loginSchema,
  signupSchema,
} from './validation'

describe('Zod Validation Schemas', () => {
  describe('Trip Schema', () => {
    it('accepts valid trip payload', () => {
      const result = tripSchema.safeParse({
        destinationName: 'Tokyo, Japan',
        magnetKey: 'japan',
        targetBudgetRupees: 65000,
        startDate: '2027-03-01',
        endDate: '2027-03-10',
        notes: 'Spring sakura trip',
      })
      expect(result.success).toBe(true)
    })

    it('rejects empty destination name', () => {
      const result = tripSchema.safeParse({
        destinationName: '',
        magnetKey: 'paris',
        targetBudgetRupees: 50000,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-positive budget', () => {
      const zeroBudget = tripSchema.safeParse({
        destinationName: 'Paris',
        magnetKey: 'paris',
        targetBudgetRupees: 0,
      })
      expect(zeroBudget.success).toBe(false)

      const negativeBudget = tripSchema.safeParse({
        destinationName: 'Paris',
        magnetKey: 'paris',
        targetBudgetRupees: -500,
      })
      expect(negativeBudget.success).toBe(false)
    })

    it('rejects end date before start date', () => {
      const result = tripSchema.safeParse({
        destinationName: 'Goa',
        magnetKey: 'goa',
        targetBudgetRupees: 25000,
        startDate: '2026-12-25',
        endDate: '2026-12-20', // before start date
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('End date cannot precede start date')
      }
    })
  })

  describe('Savings Deposit Schema', () => {
    it('accepts positive deposit amount', () => {
      const result = savingsDepositSchema.safeParse({
        amountRupees: 5000,
        note: 'October savings',
      })
      expect(result.success).toBe(true)
    })

    it('rejects zero or negative deposit', () => {
      expect(savingsDepositSchema.safeParse({ amountRupees: 0 }).success).toBe(false)
      expect(savingsDepositSchema.safeParse({ amountRupees: -100 }).success).toBe(false)
    })
  })

  describe('Planning Schemas', () => {
    it('requires itinerary title', () => {
      expect(itinerarySchema.safeParse({ title: '' }).success).toBe(false)
      expect(itinerarySchema.safeParse({ title: 'Visit Louvre' }).success).toBe(true)
    })

    it('requires checklist title', () => {
      expect(checklistSchema.safeParse({ title: '' }).success).toBe(false)
      expect(checklistSchema.safeParse({ title: 'Check passport expiry' }).success).toBe(true)
    })
  })

  describe('Auth Schemas', () => {
    it('validates email format', () => {
      expect(loginSchema.safeParse({ email: 'not-an-email', password: 'password123' }).success).toBe(false)
      expect(loginSchema.safeParse({ email: 'traveler@example.com', password: 'password123' }).success).toBe(true)
    })

    it('requires matching passwords for signup', () => {
      const mismatched = signupSchema.safeParse({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'mismatchpassword',
      })
      expect(mismatched.success).toBe(false)
    })
  })
})
