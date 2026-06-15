import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/shared/utils/formatters'
import { useMMCRates } from '../hooks/useMMC'

interface Props {
  open:    boolean
  fy:      string
  onClose: () => void
}

export function MMCRateModal({ open, fy, onClose }: Props) {
  const { data, isLoading } = useMMCRates(fy)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-sm">MMC Rate Card — {fy}</DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {isLoading ? (
            <div className="space-y-3 pt-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !data?.revisions.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No rate data found for {fy}.
            </p>
          ) : (
            <div className="space-y-6">
              {data.revisions.map((rev, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 mb-2">
                    {idx === 0 ? (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary border border-primary/20">
                        Current
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground border">
                        Previous
                      </span>
                    )}
                    <p className="text-xs font-medium">Effective from {rev.effectiveFrom}</p>
                  </div>

                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">Apt Type</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Monthly MMC</th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">Monthly Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {rev.rates.map((r) => (
                          <tr key={r.aptType} className="hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium">{r.aptType}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {r.amount != null ? formatCurrency(r.amount) : '—'}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {r.revenue != null ? formatCurrency(r.revenue) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
