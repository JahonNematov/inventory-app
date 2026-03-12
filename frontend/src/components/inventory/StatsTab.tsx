import { Card, Row, Col, Statistic, Table, Spin } from 'antd'
import { useGetStatsQuery } from '../../store/api/inventoryApi'

export function StatsTab({ inventoryId }: { inventoryId: string }) {
  const { data: stats, isLoading } = useGetStatsQuery(inventoryId)

  if (isLoading) return <Spin />
  if (!stats) return null

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic title="Total Items" value={stats.totalItems} prefix="📦" />
          </Card>
        </Col>

        {Object.values(stats.fields || {}).map((fieldStat: any) => (
          <Col span={24} key={fieldStat.title}>
            <Card title={`📊 ${fieldStat.title}`}>
              {fieldStat.type === 'NUMBER' && (
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="Average" value={fieldStat._avg?.valueNum?.toFixed(2) || 0} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Min" value={fieldStat._min?.valueNum || 0} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Max" value={fieldStat._max?.valueNum || 0} />
                  </Col>
                </Row>
              )}
              {fieldStat.type === 'STRING' && (
                <Table
                  size="small"
                  dataSource={fieldStat.topValues || []}
                  columns={[
                    { title: 'Value', dataIndex: 'valueStr' },
                    {
                      title: 'Count',
                      dataIndex: '_count',
                      render: (c: any) => c.valueStr,
                    },
                  ]}
                  pagination={false}
                  rowKey={(r: any) => r.valueStr || Math.random().toString()}
                />
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}
