import { describe, it, expect, vi } from 'vitest'
import { verifyUserAdminRole, adminSignIn, getAdminSetupInstructions } from './adminService'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

describe('adminService', () => {
  it('should deny null user', async () => {
    const res = await verifyUserAdminRole(null)
    expect(res.isAdmin).toBe(false)
    expect(res.error).toBeDefined()
  })

  it('should authorize user when supabase.rpc(is_admin) returns true', async () => {
    const adminUser = {
      id: 'usr-admin-1',
      email: 'admin@example.com',
      app_metadata: { role: 'admin' },
    } as unknown as User

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: true,
      error: null,
    } as any)

    const res = await verifyUserAdminRole(adminUser)
    expect(res.isAdmin).toBe(true)
    expect(rpcSpy).toHaveBeenCalledWith('is_admin')
    rpcSpy.mockRestore()
  })

  it('should deny standard user when supabase.rpc(is_admin) returns false', async () => {
    const normalUser = {
      id: 'usr-normal-1',
      email: 'traveler@gmail.com',
      app_metadata: { role: 'authenticated' },
      user_metadata: {},
    } as unknown as User

    const rpcSpy = vi.spyOn(supabase, 'rpc').mockResolvedValueOnce({
      data: false,
      error: null,
    } as any)

    const res = await verifyUserAdminRole(normalUser)
    expect(res.isAdmin).toBe(false)
    rpcSpy.mockRestore()
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
