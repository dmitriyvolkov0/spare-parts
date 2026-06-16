import { Button, Input, InputNumber, Modal, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api/client.js';
import { CrudModal } from '../../shared/ui/CrudModal.jsx';
import { getCurrentUser } from '../../features/auth/auth.js';
import { STOCK_OPERATIONS } from '../../shared/config/constants.js';

const fields = [
  { name: 'article', label: 'Артикул', required: true },
  { name: 'name', label: 'Наименование', required: true },
  { name: 'unit', label: 'Ед. изм.', required: true },
  { name: 'quantity', label: 'Остаток', type: 'number', required: true },
  { name: 'min_quantity', label: 'Мин. остаток', type: 'number', required: true },
  { name: 'location', label: 'Место хранения' },
];

export function PartsPage() {
  const [parts, setParts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [income, setIncome] = useState(null);
  const [movements, setMovements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [incomeQuantity, setIncomeQuantity] = useState(1);
  const [search, setSearch] = useState('');
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const canCreateStock = ['admin', 'storekeeper'].includes(user?.role);
  const canRegisterIncome = ['admin', 'storekeeper'].includes(user?.role);
  const canDeleteStock = ['admin', 'storekeeper'].includes(user?.role);

  function load() {
    setLoading(true);
    api.get('/parts')
      .then((r) => {
        if (!Array.isArray(r.data)) throw new Error('Invalid parts response');
        setParts(r.data);
      })
      .catch(() => message.error('Не удалось загрузить склад'))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function save(values) {
    try {
      if (editing?.id) await api.put(`/parts/${editing.id}`, values); else await api.post('/parts', values);
      setEditing(null); load(); message.success('Сохранено');
    } catch (error) { message.error(error.response?.data?.message || 'Ошибка сохранения'); }
  }

  async function remove(id) {
    try { await api.delete(`/parts/${id}`); load(); } catch (error) { message.error(error.response?.data?.message || 'Удаление невозможно'); }
  }

  async function addIncome() {
    try {
      await api.post('/stock/income', { part_id: income.id, quantity: incomeQuantity, comment: 'Поступление' });
      setIncome(null); load(); message.success('Поступление сохранено');
    } catch { message.error('Не удалось осуществить поступление'); }
  }

  function showMovements(part) {
    setMovements([]);
    setMovementsLoading(true);
    api.get('/stock/movements')
      .then((response) => {
        if (!Array.isArray(response.data)) throw new Error('Invalid movements response');
        setMovements(response.data.filter((row) => Number(row.part_id) === Number(part.id)));
      })
      .catch(() => message.error('Не удалось загрузить историю'))
      .finally(() => setMovementsLoading(false));
  }

  const filteredParts = (Array.isArray(parts) ? parts : []).filter((part) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [part.article, part.name, part.unit, part.location].some((value) => String(value || '').toLowerCase().includes(query));
  });

  return (
    <div className="page-card">
      <div className="page-title"><h1>Склад</h1>{canCreateStock && <Button type="primary" onClick={() => setEditing({})}>Добавить</Button>}</div>
      <Input.Search className="table-search" allowClear placeholder="Поиск по складу" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Table rowKey="id" dataSource={filteredParts} loading={loading} columns={[
        { title: 'Артикул', dataIndex: 'article' }, { title: 'Наименование', dataIndex: 'name' }, { title: 'Ед. изм.', dataIndex: 'unit' },
        { title: 'Остаток', dataIndex: 'quantity' }, { title: 'Мин. остаток', dataIndex: 'min_quantity' }, { title: 'Место хранения', dataIndex: 'location' },
        { title: 'Действия', render: (_, row) => <Space className="table-actions" wrap><Button onClick={() => showMovements(row)}>История</Button>{canRegisterIncome && <Button onClick={() => setIncome(row)}>Поступление</Button>}{isAdmin && <Button onClick={() => setEditing(row)}>Редактировать</Button>}{canDeleteStock && <Button danger onClick={() => remove(row.id)}>Удалить</Button>}</Space> },
      ]} />
      <CrudModal open={!!editing} title="Деталь" fields={fields} initialValues={editing} onCancel={() => setEditing(null)} onSubmit={save} />
      <Modal open={!!income} title="Поступление деталей" okText="Сохранить" cancelText="Отмена" onCancel={() => setIncome(null)} onOk={addIncome}>
        <p>{income?.name}</p><InputNumber min={0.01} value={incomeQuantity} onChange={setIncomeQuantity} style={{ width: '100%' }} />
      </Modal>
      <Modal open={!!movements} title="История движения" footer={null} onCancel={() => setMovements(null)} width={900}>
        <Table rowKey="id" dataSource={movements || []} loading={movementsLoading} pagination={false} rowClassName={(row) => `stock-row-${String(row.operation_type).toLowerCase()}`} columns={[{ title: 'Дата', dataIndex: 'created_at' }, { title: 'Операция', dataIndex: 'operation_type', render: (value) => STOCK_OPERATIONS[value] || value }, { title: 'Количество', dataIndex: 'quantity' }, { title: 'Комментарий', dataIndex: 'comment' }, { title: 'Пользователь', dataIndex: 'user_name' }]} />
      </Modal>
    </div>
  );
}
