import { Typography, Space } from 'antd'

interface Props {
  title: string
  subtitle?: string
  extra?: React.ReactNode
}

export function PageHeader({ title, subtitle, extra }: Props) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Space direction="vertical" size={2}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {subtitle && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {subtitle}
          </Typography.Text>
        )}
      </Space>
      {extra && <div>{extra}</div>}
    </div>
  )
}
