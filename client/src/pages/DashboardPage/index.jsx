import { Button, Card, Table, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api/client.js';
import { STOCK_OPERATIONS } from '../../shared/config/constants.js';

function StatIcon({ children }) {
  return <span className="stat-icon">{children}</span>;
}

export function DashboardPage() {
  const [data, setData] = useState({ movements: [] });
  const [loading, setLoading] = useState(true);
  const [movementsLimit, setMovementsLimit] = useState(10);

  useEffect(() => {
    setLoading(true);
    api.get('/dashboard', { params: { movements_limit: movementsLimit } })
      .then((response) => setData({ ...response.data, movements: Array.isArray(response.data?.movements) ? response.data.movements : [] }))
      .catch(() => message.error('Не удалось загрузить Dashboard'))
      .finally(() => setLoading(false));
  }, [movementsLimit]);

  const canLoadMoreMovements = (data.movements?.length || 0) < (data.movements_total || 0);

  const stats = [
    { title: 'Всего деталей', value: data.parts_count, className: 'stat-parts', icon: <StatIcon><svg viewBox="0 0 24 24"><path d="M5 4h14v4H5V4Zm0 6h14v10H5V10Zm3 3v2h8v-2H8Z" /></svg></StatIcon> },
    { title: 'Оборудование', value: data.equipment_count, className: 'stat-equipment', icon: <StatIcon><svg viewBox="0 0 24 24"><path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2.1-1.6-2-3.5-2.5 1a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.9A7.7 7.7 0 0 0 7 6.4l-2.5-1-2 3.5 2.1 1.6c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2.1 1.6 2 3.5 2.5-1c.8.7 1.6 1.2 2.6 1.5L10 22h4l.4-2.9c1-.3 1.8-.8 2.6-1.5l2.5 1 2-3.5-2.1-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" /></svg></StatIcon> },
    { title: 'Ремонтов', value: data.repairs_count, className: 'stat-repairs', icon: <StatIcon><svg viewBox="0 0 24 24"><path d="m22 19.6-6.3-6.3a6.5 6.5 0 0 1-8.1-8.1l4 4 2.8-2.8-4-4a6.5 6.5 0 0 1 8.1 8.1l6.3 6.3-2.8 2.8Z" /></svg></StatIcon> },
    { title: 'Заканчиваются', value: data.low_stock_count, className: 'stat-low', icon: <StatIcon><svg viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" /></svg></StatIcon> },
  ];

  return (
    <div>
      <Typography.Title level={2}>Дашборд</Typography.Title>
      <div className="stats-grid">
        {stats.map((stat) => (
          <Card className={`stat-card ${stat.className}`} key={stat.title} bordered={false}>
            <div className="stat-card-content">
              <div>
                <Typography.Text className="stat-label">{stat.title}</Typography.Text>
                <Typography.Title className="stat-value" level={2}>{stat.value || 0}</Typography.Title>
              </div>
              {stat.icon}
            </div>
          </Card>
        ))}
      </div>
      <Card title="Последние движения склада">
        <Table rowKey="id" dataSource={data.movements || []} loading={loading} pagination={false} rowClassName={(row) => `stock-row-${String(row.operation_type).toLowerCase()}`} columns={[
          { title: 'Дата', dataIndex: 'created_at' },
          { title: 'Деталь', dataIndex: 'part_name' },
          { title: 'Операция', dataIndex: 'operation_type', render: (value) => STOCK_OPERATIONS[value] || value },
          { title: 'Количество', dataIndex: 'quantity' },
          { title: 'Комментарий', dataIndex: 'comment' },
        ]} />
        {canLoadMoreMovements && (
          <div className="load-more-wrap">
            <Button type="primary" loading={loading} onClick={() => setMovementsLimit((value) => value + 10)}>Загрузить еще</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
