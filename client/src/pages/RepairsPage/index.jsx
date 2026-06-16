import { Button, Input, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../shared/api/client.js';
import { getCurrentUser } from '../../features/auth/auth.js';

export function RepairsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [repairParts, setRepairParts] = useState({});
  const [partsLoading, setPartsLoading] = useState({});
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const canCreateRepair = ['admin', 'technician'].includes(getCurrentUser()?.role);
  useEffect(() => { setLoading(true); api.get('/repairs').then((r) => { if (!Array.isArray(r.data)) throw new Error('Invalid repairs response'); setRows(r.data); }).catch(() => message.error('Не удалось загрузить ремонты')).finally(() => setLoading(false)); }, []);

  function loadRepairParts(repairId) {
    if (repairParts[repairId] || partsLoading[repairId]) return;
    setPartsLoading((state) => ({ ...state, [repairId]: true }));
    api.get(`/repairs/${repairId}`)
      .then((response) => setRepairParts((state) => ({ ...state, [repairId]: Array.isArray(response.data.parts) ? response.data.parts : [] })))
      .catch(() => message.error('Не удалось загрузить детали ремонта'))
      .finally(() => setPartsLoading((state) => ({ ...state, [repairId]: false })));
  }

  function renderRepairParts(row) {
    return (
      <div className="repair-parts-expanded">
        <Table rowKey="id" size="small" loading={partsLoading[row.id]} dataSource={repairParts[row.id] || []} pagination={false} columns={[
          { title: 'Артикул', dataIndex: 'part_article' },
          { title: 'Деталь', dataIndex: 'part_name' },
          { title: 'Количество', dataIndex: 'quantity' },
          { title: 'Ед. изм.', dataIndex: 'part_unit' },
        ]} />
      </div>
    );
  }

  const filteredRows = (Array.isArray(rows) ? rows : []).filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [row.id, row.equipment_name, row.repair_date, row.mechanic_full_name, row.mechanic_login, row.description]
      .some((value) => String(value || '').toLowerCase().includes(query));
  });

  return <div className="page-card"><div className="page-title"><h1>Ремонты</h1>{canCreateRepair && <Button type="primary" onClick={() => navigate('/repairs/create')}>Создать</Button>}</div><Input.Search className="table-search" allowClear placeholder="Поиск по ремонтам" value={search} onChange={(event) => setSearch(event.target.value)} /><Table className="repairs-table" rowKey="id" dataSource={filteredRows} loading={loading} expandable={{ expandedRowRender: renderRepairParts, onExpand: (expanded, row) => { if (expanded) loadRepairParts(row.id); } }} columns={[{ title: 'ID', dataIndex: 'id' }, { title: 'Оборудование', dataIndex: 'equipment_name' }, { title: 'Дата', dataIndex: 'repair_date', className: 'date-cell' }, { title: 'Мастер', render: (_, row) => `${row.mechanic_full_name} @${row.mechanic_login}` }, { title: 'Описание', dataIndex: 'description', className: 'repair-description-cell' }, { title: 'Действия', render: (_, row) => canCreateRepair ? <Button onClick={() => navigate(`/repairs/${row.id}/edit`)}>Редактировать</Button> : null }]} /></div>;
}
