import { useState } from 'react'
import { Plus, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { AppUser } from '@/shared/types'
import { ROLE_LABELS } from '@/shared/utils/constants'
import { Role } from '@/shared/types/auth'
import { useAppUsers, useUpsertUser } from '../hooks/useConfig'

const ROLE_OPTIONS = Object.values(Role).map((r) => ({ value: r, label: ROLE_LABELS[r] }))

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'success'> = {
  TREASURER: 'default',
  COMMITTEE: 'success',
  CARETAKER: 'secondary',
  OWNER:     'outline',
  TENANT:    'outline',
}

function formatLastLogin(raw: string) {
  if (!raw) return '—'
  const d = new Date(raw)
  return isNaN(d.getTime()) ? raw : d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function UserRolesPanel() {
  const { data: users, isLoading } = useAppUsers()
  const upsert = useUpsertUser()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing,    setEditing]    = useState<AppUser | null>(null)
  const [form,       setForm]       = useState({ email: '', name: '', role: Role.OWNER })
  const [error,      setError]      = useState('')

  function openAdd() {
    setEditing(null)
    setForm({ email: '', name: '', role: Role.OWNER })
    setError('')
    setDialogOpen(true)
  }

  function openEdit(u: AppUser) {
    setEditing(u)
    setForm({ email: u.email, name: u.name, role: u.role as Role })
    setError('')
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.email.trim()) { setError('Email is required'); return }
    if (!form.name.trim())  { setError('Name is required');  return }
    await upsert.mutateAsync({ email: form.email.trim(), name: form.name.trim(), role: form.role })
    setDialogOpen(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        {[0,1,2].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
      </div>
    )
  }

  const list = users ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{list.length} user{list.length !== 1 ? 's' : ''} registered</p>
        <Button size="sm" onClick={openAdd} className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add User
        </Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-32">Role</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground w-32">Last Login</th>
              <th className="px-4 py-2.5 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">No users found</td></tr>
            ) : (
              list.map((u) => (
                <tr key={u.email} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{u.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_BADGE_VARIANT[u.role] ?? 'outline'} className="text-xs">
                      {ROLE_LABELS[u.role as Role] ?? u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatLastLogin(u.lastLogin)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Full name"
                value={form.name}
                onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setError('') }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => { setForm((f) => ({ ...f, email: e.target.value })); setError('') }}
                disabled={!!editing}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as Role }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={upsert.isPending}>
              {upsert.isPending ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Saving…</> : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
