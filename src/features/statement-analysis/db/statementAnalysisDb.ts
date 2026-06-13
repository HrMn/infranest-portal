const DB_NAME    = 'infranest_analysis'
const DB_VERSION = 1
const FILES_STORE = 'statement_files'
const ROWS_STORE  = 'statement_rows'

export interface DbFile {
  id?: number
  filename: string
  uploadedAt: string
  rowCount: number
  dateFrom: string
  dateTo: string
}

export interface DbRow {
  id?: number
  fileId: number
  date: string
  vendorName: string
  rawDescription: string
  expenditure: number | null
  income: number | null
  balance: number | null
  category: string
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(FILES_STORE)) {
        db.createObjectStore(FILES_STORE, { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains(ROWS_STORE)) {
        const store = db.createObjectStore(ROWS_STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('fileId', 'fileId', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror  = () => reject(req.error)
  })
}

export async function dbSaveFile(file: Omit<DbFile, 'id'>): Promise<number> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(FILES_STORE, 'readwrite')
    const req = tx.objectStore(FILES_STORE).add(file)
    req.onsuccess = () => resolve(req.result as number)
    req.onerror   = () => reject(req.error)
  })
}

export async function dbSaveRows(rows: Omit<DbRow, 'id'>[]): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(ROWS_STORE, 'readwrite')
    const store = tx.objectStore(ROWS_STORE)
    for (const row of rows) store.add(row)
    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function dbDeleteFile(fileId: number): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx        = db.transaction([FILES_STORE, ROWS_STORE], 'readwrite')
    tx.objectStore(FILES_STORE).delete(fileId)

    const rowStore = tx.objectStore(ROWS_STORE)
    const idxReq   = rowStore.index('fileId').openCursor(IDBKeyRange.only(fileId))
    idxReq.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
      if (cursor) { cursor.delete(); cursor.continue() }
    }

    tx.oncomplete = () => resolve()
    tx.onerror    = () => reject(tx.error)
  })
}

export async function dbGetAllFiles(): Promise<DbFile[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(FILES_STORE, 'readonly').objectStore(FILES_STORE).getAll()
    req.onsuccess = () => resolve(req.result as DbFile[])
    req.onerror   = () => reject(req.error)
  })
}

export async function dbGetAllRows(): Promise<DbRow[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(ROWS_STORE, 'readonly').objectStore(ROWS_STORE).getAll()
    req.onsuccess = () => resolve(req.result as DbRow[])
    req.onerror   = () => reject(req.error)
  })
}
