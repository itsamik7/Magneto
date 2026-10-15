import { describe, it, expect } from 'vitest'
import { verifyUserAdminRole, adminSignIn, getAdminSetupInstructions } from './adminService'
import type { User } from '@supabase/supabase-js'

describe('adminService', () => {
  it('should deny null user', async () => {
    const res = await verifyUserAdminRole(null)
    expect(res.isAdmin).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('should authorize user with app_metadata role admin or super_admin', async () => {
    const adminUser = {
      id: 'usr-admin-1',
      email: 'admin@example.com',
      app_metadata: { role: 'admin' },
    } as unknown as User

    const res = await verifyUserAdminRole(adminUser)
    expect(res.isAdmin).toBe(true)
    expect(res.role).toBe('admin')

    const superAdminUser = {
      id: 'usr-admin-2',
      email: 'super@example.com',
      app_metadata: { role: 'super_admin' },
    } as unknown as User

    const resSuper = await verifyUserAdminRole(superAdminUser)
    expect(resSuper.isAdmin).toBe(true)
    expect(resSuper.role).toBe('super_admin')
  })

  it('should authorize primary super admin account 1amiteshk@gmail.com', async () => {
    const ownerUser = {
      id: 'usr-owner-1',
      email: '1amiteshk@gmail.com',
      app_metadata: {},
      user_metadata: {},
    } as unknown as User

    const res = await verifyUserAdminRole(ownerUser)
    expect(res.isAdmin).toBe(true)
    expect(res.role).toBe('super_admin')
  })

  it('should deny standard user without admin role', async () => {
    const normalUser = {
      id: 'usr-normal-1',
      email: 'traveler@gmail.com',
      app_metadata: { role: 'authenticated' },
      user_metadata: {},
    } as unknown as User

    const res = await verifyUserAdminRole(normalUser)
    expect(res.isAdmin).toBe(false)
  })

  it('should validate email and password requirement in adminSignIn', async () => {
    const emptyRes = await adminSignIn('', '')
    expect(emptyRes.success).toBe(false)
    expect(emptyRes.error).toContain('required')
  })

  it('should provide setup instructions for provisioning first administrator', () => {
    const guide = getAdminSetupInstructions()
    expect(guide.title).toBeDefined()
    expect(guide.steps.length).toBeGreaterThan(0)
    expect(guide.sqlSnippet).toContain('INSERT INTO public.user_roles')
  })
})
