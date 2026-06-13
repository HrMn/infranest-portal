import { useState } from 'react'
import {
  Card, Upload, Button, Table, Tag, Tooltip, Popconfirm,
  Typography, Space, Alert, Spin,
} from 'antd'
import {
  InboxOutlined, DeleteOutlined, FileExcelOutlined,
} from '@ant-design/icons'
import type { UploadFile } from 'antd'
import { parseExcelFile } from '@/shared/utils/excelParser'
import { extractVendorName } from '../utils/vendorExtractor'
import { useStatementAnalysisStore } from '../store/statementAnalysisStore'
import { AnalysisFile } from '../types'
import { formatDateDisplay } from '../utils/analyticsHelpers'

const { Dragger } = Upload
const { Text }    = Typography

export function UploadPanel() {
  const { files, loading, addStatement, removeStatement } =
    useStatementAnalysisStore()
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsing,    setParsing]    = useState(false)

  async function handleFile(file: File) {
    setParseError(null)
    // Reject if a file with the same name already exists
    if (files.some((f) => f.filename === file.name)) {
      setParseError(`"${file.name}" is already loaded. Remove it first if you want to re-import.`)
      return false
    }

    setParsing(true)
    try {
      const { rows: parsed, parseError: err } = await parseExcelFile(file)
      if (err || parsed.length === 0) {
        setParseError(err ?? 'No transactions found in this file.')
        return false
      }

      // Build AnalysisRow shapes (without id/fileId)
      const analysisRows = parsed.map((r) => ({
        date:           r.date,
        vendorName:     extractVendorName(r.particulars),
        rawDescription: r.particulars,
        expenditure:    r.expenditure,
        income:         r.income,
        balance:        r.balance,
        category:       r.category,
      }))

      // Determine date range from parsed rows
      const dates   = parsed.map((r) => r.date).sort()
      const fileMeta: Omit<AnalysisFile, 'id'> = {
        filename:   file.name,
        uploadedAt: new Date().toISOString(),
        rowCount:   parsed.length,
        dateFrom:   dates[0],
        dateTo:     dates[dates.length - 1],
      }

      await addStatement(fileMeta, analysisRows)
    } finally {
      setParsing(false)
    }
    return false  // prevent antd default upload behaviour
  }

  const columns = [
    {
      title: 'File',
      dataIndex: 'filename',
      render: (name: string) => (
        <Space>
          <FileExcelOutlined style={{ color: '#52c41a' }} />
          <Text style={{ maxWidth: 180 }} ellipsis={{ tooltip: name }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Period',
      render: (_: unknown, f: AnalysisFile) => (
        <Text style={{ fontSize: 12 }}>
          {formatDateDisplay(f.dateFrom)} – {formatDateDisplay(f.dateTo)}
        </Text>
      ),
    },
    {
      title: 'Rows',
      dataIndex: 'rowCount',
      align: 'right' as const,
      render: (n: number) => <Tag>{n.toLocaleString()}</Tag>,
    },
    {
      title: '',
      align: 'right' as const,
      render: (_: unknown, f: AnalysisFile) => (
        <Popconfirm
          title="Remove this statement?"
          description="All its transactions will be removed from the analysis."
          onConfirm={() => removeStatement(f.id)}
          okText="Remove"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Remove">
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Tooltip>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Card
      size="small"
      title="Uploaded Statements"
      style={{ marginBottom: 16 }}
      extra={
        files.length > 0 && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {files.length} file{files.length > 1 ? 's' : ''} ·{' '}
            {useStatementAnalysisStore.getState().rows.length.toLocaleString()} transactions
          </Text>
        )
      }
    >
      {parseError && (
        <Alert
          type="error"
          message={parseError}
          closable
          onClose={() => setParseError(null)}
          style={{ marginBottom: 12 }}
        />
      )}

      <Spin spinning={parsing || loading}>
        <Dragger
          accept=".xls,.xlsx"
          multiple
          showUploadList={false}
          beforeUpload={handleFile}
          fileList={[] as UploadFile[]}
          style={{ marginBottom: files.length > 0 ? 12 : 0 }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Drop SBI Excel statements here, or click to browse
          </p>
          <p className="ant-upload-hint">
            Supports .xls and .xlsx. Each file is stored locally in your browser — no data leaves your device.
          </p>
        </Dragger>

        {files.length > 0 && (
          <Table
            size="small"
            dataSource={files}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        )}
      </Spin>
    </Card>
  )
}
