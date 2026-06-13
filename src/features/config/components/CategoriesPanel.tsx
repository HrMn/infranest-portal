import { useState } from 'react'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigItem } from '@/shared/types'
import { useConfigData, useUpsertConfigItem, useDeleteConfigItem } from '../hooks/useConfig'

interface Props { fy: string }

const CONFIG_TYPE = 'CATEGORY'

export function CategoriesPanel({ fy }: Props) {
  const { data, isLoading } = useConfigData(fy, CONFIG_TYPE)
  const upsert = useUpsertConfigItem(fy)
  const remove = useDeleteConfigItem(fy)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing,    setEditing]    = useState<ConfigItem | null>(null)
  const [keyValue,   setKeyValue]   = useState('')
  const [error,      setError]      = useState('')

  const items = data?.items ?? []

  function openAdd() {
    setEditing(null); setKeyValue(''); setError(''); setDialogOpen(true)
  }

  function openEdit(item: ConfigItem) {
    setEditing(item); setKeyValue(item.key); setError(''); setDialogOpen(true)
  }

  async function handleSave() {
    const key = keyValue.trim()
    if (!key) { setError('Category name is required'); return }
    const duplicate = items.some((i) => i.key.toLowerCase() === key.toLowerCase() && i.rowIndex !== editing?.rowIndex)
    if (duplicate) { setError('This category already exists'); return }

    await upsert.mutateAsync({
      configType: CONFIG_TYPE,
      key,
      status:   editing?.status ?? 'Active',
      rowIndex: editing?.rowIndex,
    })
    setDialogOpen(false)
  }

  async function handleToggleStatus(item: ConfigItem) {
    await upsert.mutateAsync({
      configType: CONFIG_TYPE,
      key:        item.key,
      status:     item.status === 'Active' ? 'Inactive' : 'Active',
      rowIndex:   item.rowIndex,
    })
  }

  async function handleDelete(item: ConfigItem) {
    if (!confirm(`Delete category "${item.key}"?`)) return
    await remove.mutateAsync(item.rowIndex)
  }

  if (isLoading) {
    return (
      <div className="space-y-2 pt-2">
        {[0,1,2,3].map(i => <Skeleton key={i} className="h-10 rounded-lg" />)}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{items.length} categor{items.length === 1 ? 'y' : 'ies'} configured</p>
        <Button size="sm" onClick={openAdd} className="h-8 gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Add Category
        </Button>
      </div>

      <div className="rounded-lg border divide-y">
        {items.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No categories yet. Click "Add Category" to get started.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.rowIndex} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{item.key}</span>
                <Badge variant={item.status === 'Active' ? 'success' : 'secondary'} className="text-xs">
                  {item.status}
                </Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  title={item.status === 'Active' ? 'Deactivate' : 'Activate'}
                  onClick={() => handleToggleStatus(item)}
                  disabled={upsert.isPending}
                >
                  {item.status === 'Active'
                    ? <ToggleRight className="h-4 w-4 text-emerald-500" />
                    : <ToggleLeft  className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-7 w-7"
                  onClick={() => handleDelete(item)}
                  disabled={remove.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive/70 hover:text-destructive" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => !o && setDialogOpen(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-key">Category Name</Label>
              <Input
                id="cat-key"
                placeholder="e.g. MMC Collection"
                value={keyValue}
                onChange={(e) => { setKeyValue(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
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
