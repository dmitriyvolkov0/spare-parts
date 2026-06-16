import { Button, Space, Table, message } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '../../shared/api/client.js';
import { CrudModal } from '../../shared/ui/CrudModal.jsx';
import { ROLES } from '../../shared/config/constants.js';

export function UsersPage() {
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const fields = [
    { name: 'full_name', label: 'ФИО', required: true }, { name: 'login', label: 'Логин', required: true },
    { name: 'password', label: 'Пароль' }, { name: 'role', label: 'Роль', type: 'select', required: true, options: [{ value: 'admin', label: ROLES.admin }, { value: 'technician', label: ROLES.technician }, { value: 'storekeeper', label: ROLES.storekeeper }] },
  ];
  function load() { setLoading(true); api.get('/users').then((r) => { if (!Array.isArray(r.data)) throw new Error('Invalid users response'); setRows(r.data); }).catch(() => message.error('Не удалось загрузить пользователей')).finally(() => setLoading(false)); }
  useEffect(load, []);
  async function save(values) { try { editing?.id ? await api.put(`/users/${editing.id}`, values) : await api.post('/users', values); setEditing(null); load(); } catch { message.error('Ошибка сохранения'); } }
  async function remove(id) { try { await api.delete(`/users/${id}`); load(); } catch { message.error('Ошибка удаления'); } }
  return <div className="page-card"><div className="page-title"><h1>Пользователи</h1><Button type="primary" onClick={() => setEditing({ role: 'technician' })}>Добавить</Button></div><Table rowKey="id" dataSource={rows} loading={loading} columns={[{ title: 'ФИО', dataIndex: 'full_name' }, { title: 'Логин', dataIndex: 'login' }, { title: 'Роль', dataIndex: 'role', render: (v) => ROLES[v] || v }, { title: 'Действия', render: (_, row) => <Space><Button onClick={() => setEditing(row)}>Редактировать</Button><Button danger onClick={() => remove(row.id)}>Удалить</Button></Space> }]} /><CrudModal open={!!editing} title="Пользователь" fields={fields} initialValues={editing} onCancel={() => setEditing(null)} onSubmit={save} /></div>;
}
