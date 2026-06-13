import { create } from 'zustand'
import { AnalysisFile, AnalysisRow } from '../types'
import {
  dbDeleteFile,
  dbGetAllFiles,
  dbGetAllRows,
  dbSaveFile,
  dbSaveRows,
} from '../db/statementAnalysisDb'

interface StatementAnalysisStore {
  files:    AnalysisFile[]
  rows:     AnalysisRow[]
  loading:  boolean
  error:    string | null

  loadFromDb:    () => Promise<void>
  addStatement:  (
    fileMeta: Omit<AnalysisFile, 'id'>,
    rows:     Omit<AnalysisRow, 'id' | 'fileId'>[],
  ) => Promise<void>
  removeStatement: (fileId: number) => Promise<void>
}

export const useStatementAnalysisStore = create<StatementAnalysisStore>((set, get) => ({
  files:   [],
  rows:    [],
  loading: false,
  error:   null,

  loadFromDb: async () => {
    set({ loading: true, error: null })
    try {
      const [files, rows] = await Promise.all([dbGetAllFiles(), dbGetAllRows()])
      set({
        files:   files as AnalysisFile[],
        rows:    rows  as AnalysisRow[],
        loading: false,
      })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  addStatement: async (fileMeta, newRows) => {
    set({ loading: true, error: null })
    try {
      const fileId = await dbSaveFile(fileMeta)
      const rowsWithFileId = newRows.map((r) => ({ ...r, fileId }))
      await dbSaveRows(rowsWithFileId)

      const savedFile: AnalysisFile = { ...fileMeta, id: fileId }
      const savedRows: AnalysisRow[] = rowsWithFileId.map((r, i) => ({
        ...r,
        id: i, // placeholder; actual ids from DB are not needed for in-memory use
      }))

      // Reload rows from DB so IDs are accurate
      const allRows = await dbGetAllRows()
      set((s) => ({
        files:   [...s.files, savedFile],
        rows:    allRows as AnalysisRow[],
        loading: false,
      }))
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  removeStatement: async (fileId) => {
    set({ loading: true, error: null })
    try {
      await dbDeleteFile(fileId)
      set((s) => ({
        files:   s.files.filter((f) => f.id !== fileId),
        rows:    s.rows.filter((r)  => r.fileId !== fileId),
        loading: false,
      }))
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },
}))
