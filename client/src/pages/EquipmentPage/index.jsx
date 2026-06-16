import { Button, Input, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api/client.js';
import { CrudModal } from '../../shared/ui/CrudModal.jsx';
import { getCurrentUser } from '../../features/auth/auth.js';

export function EquipmentPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const isAdmin = getCurrentUser()?.role === 'admin';
  const fields = [{ name: 'inventory_number', label: 'Инвентарный номер', required: true }, { name: 'name', label: 'Наименование', required: true }];
  function load() { setLoading(true); api.get('/equipment').then((r) => { if (!Array.isArray(r.data)) throw new Error('Invalid equipment response'); setRows(r.data); }).catch(() => message.error('Не удалось загрузить оборудование')).finally(() => setLoading(false)); }
  useEffect(load, []);
  async function save(values) { try { editing?.id ? await api.put(`/equipment/${editing.id}`, values) : await api.post('/equipment', values); setEditing(null); load(); } catch { message.error('Ошибка сохранения'); } }
  async function remove(id) { try { await api.delete(`/equipment/${id}`); load(); } catch { message.error('Ошибка удаления'); } }
  const filteredRows = (Array.isArray(rows) ? rows : []).filter((row) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [row.inventory_number, row.name].some((value) => String(value || '').toLowerCase().includes(query));
  });
  return <div className="page-card"><div className="page-title"><h1>Оборудование</h1>{isAdmin && <Button type="primary" onClick={() => setEditing({})}>Добавить</Button>}</div><Input.Search className="table-search" allowClear placeholder="Поиск по оборудованию" value={search} onChange={(event) => setSearch(event.target.value)} /><Table rowKey="id" dataSource={filteredRows} loading={loading} columns={[{ title: 'Инвентарный номер', dataIndex: 'inventory_number' }, { title: 'Наименование', dataIndex: 'name' }, { title: 'Действия', render: (_, row) => isAdmin ? <Space><Button onClick={() => setEditing(row)}>Редактировать</Button><Button danger onClick={() => remove(row.id)}>Удалить</Button></Space> : null }]} /><CrudModal open={!!editing} title="Оборудование" fields={fields} initialValues={editing} onCancel={() => setEditing(null)} onSubmit={save} /></div>;
}
