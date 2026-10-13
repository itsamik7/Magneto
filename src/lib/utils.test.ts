import { describe, it, expect } from 'vitest'
import {
  rupeesToPaise,
  paiseToRupees,
  formatINR,
  deriveMagnetState,
  calculateAmountRemaining,
  calculateProgressPercentage,
} from './utils'

describe('Magneto Financial Rules & Currency Conversions', () => {
  it('converts Rupees to integer Paise correctly', () => {
    expect(rupeesToPaise(50000)).toBe(5000000)
    expect(rupeesToPaise(5000)).toBe(500000)
    expect(rupeesToPaise(10.5)).toBe(1050)
    expect(rupeesToPaise(0)).toBe(0)
    expect(rupeesToPaise(-100)).toBe(0)
  })

  it('converts Paise to Rupees correctly', () => {
    expect(paiseToRupees(5000000)).toBe(50000)
    expect(paiseToRupees(500000)).toBe(5000)
    expect(paiseToRupees(1050)).toBe(10.5)
    expect(paiseToRupees(0)).toBe(0)
  })

  it('formats INR according to Indian currency conventions', () => {
    const formatted50k = formatINR(5000000)
    expect(formatted50k).toContain('50,000')

    const formatted1Lakh = formatINR(10000000)
    expect(formatted1Lakh).toContain('1,00,000')
  })

  it('matches the exact financial specification example for Japan', () => {
    // Example from spec:
    // Destination: Japan
    // Target budget: 50,000 INR = 5,000,000 paise
    // Deposits: 5,000 INR (500,000 paise) + 10,000 INR (1,000,000 paise)
    // Total saved: 15,000 INR (1,500,000 paise)
    // Amount remaining: 35,000 INR (3,500,000 paise)
    // Progress percentage: 30%

    const targetBudgetMinor = rupeesToPaise(50000)
    const deposit1Minor = rupeesToPaise(5000)
    const deposit2Minor = rupeesToPaise(10000)

    const totalSavedMinor = deposit1Minor + deposit2Minor
    expect(totalSavedMinor).toBe(1500000)
    expect(paiseToRupees(totalSavedMinor)).toBe(15000)

    const amountRemainingMinor = calculateAmountRemaining(targetBudgetMinor, totalSavedMinor)
    expect(amountRemainingMinor).toBe(3500000)
    expect(paiseToRupees(amountRemainingMinor)).toBe(35000)

    const progressPercentage = calculateProgressPercentage(totalSavedMinor, targetBudgetMinor)
    expect(progressPercentage).toBe(30)

    const magnetState = deriveMagnetState(totalSavedMinor, targetBudgetMinor)
    expect(magnetState).toBe('saving')
  })

  it('correctly transitions between Dreaming, Saving, and Ready to Go states', () => {
    const target = 5000000 // 50,000 INR

    // 1. Dreaming: saved === 0
    expect(deriveMagnetState(0, target)).toBe('dreaming')

    // 2. Saving: 0 < saved < target
    expect(deriveMagnetState(100, target)).toBe('saving')
    expect(deriveMagnetState(4999999, target)).toBe('saving')

    // 3. Ready to Go: saved >= target
    expect(deriveMagnetState(5000000, target)).toBe('ready_to_go')
    expect(deriveMagnetState(6000000, target)).toBe('ready_to_go')
  })

  it('caps progress percentage at 100% when saved exceeds budget', () => {
    const target = 5000000 // 50,000 INR
    const saved = 7500000  // 75,000 INR (150%)
    
    expect(calculateProgressPercentage(saved, target)).toBe(100)
    expect(calculateAmountRemaining(target, saved)).toBe(0)
  })
})
