import { Button, DatePicker, Form, Input, InputNumber, Result, Select, Space, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../shared/api/client.js';
import { getCurrentUser } from '../../features/auth/auth.js';

export function RepairCreatePage() {
  const [form] = Form.useForm();
  const [equipment, setEquipment] = useState([]);
  const [parts, setParts] = useState([]);
  const [usedParts, setUsedParts] = useState([{ part_id: null, quantity: 1 }]);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const canCreateRepair = ['admin', 'technician'].includes(getCurrentUser()?.role);

  useEffect(() => {
    if (!canCreateRepair) return;
    api.get('/equipment').then((r) => setEquipment(Array.isArray(r.data) ? r.data : []));
    api.get('/parts').then((r) => setParts(Array.isArray(r.data) ? r.data : []));
    if (isEdit) {
      api.get(`/repairs/${id}`).then((response) => {
        const repair = response.data;
        form.setFieldsValue({
          equipment_id: repair.equipment_id,
          repair_date: dayjs(repair.repair_date),
          description: repair.description,
        });
        setUsedParts((repair.parts || []).map((part) => ({ part_id: part.part_id, quantity: Number(part.quantity) })));
      }).catch(() => message.error('Не удалось загрузить ремонт'));
    }
  }, [canCreateRepair, form, id, isEdit]);

  async function submit(values) {
    try {
      const payload = { ...values, repair_date: values.repair_date.format('YYYY-MM-DD'), parts: usedParts.filter((p) => p.part_id && p.quantity) };
      if (isEdit) await api.put(`/repairs/${id}`, payload); else await api.post('/repairs', payload);
      message.success('Ремонт сохранён');
      navigate('/repairs');
    } catch (error) { message.error(error.response?.data?.message || 'Не удалось сохранить ремонт'); }
  }

  function changePart(index, patch) { setUsedParts(usedParts.map((row, i) => (i === index ? { ...row, ...patch } : row))); }

  async function generateDescription() {
    const values = form.getFieldsValue();
    const selectedEquipment = equipment.find((item) => item.id === values.equipment_id);
    const selectedParts = usedParts
      .filter((row) => row.part_id && row.quantity)
      .map((row) => {
        const part = parts.find((item) => item.id === row.part_id);
        return { article: part?.article, name: part?.name, unit: part?.unit, quantity: row.quantity };
      });

    if (!selectedEquipment && !values.repair_date && !values.description && selectedParts.length === 0) {
      message.warning('Укажите оборудование, дату ремонта или добавьте комплектующие, чтобы ИИ мог сформировать описание.');
      return;
    }

    setGenerating(true);
    try {
      const { data } = await api.post('/ai/repair-description', {
        equipment_name: selectedEquipment ? `${selectedEquipment.inventory_number} ${selectedEquipment.name}` : '',
        repair_date: values.repair_date ? values.repair_date.format('YYYY-MM-DD') : '',
        description: values.description || '',
        parts: selectedParts,
      });
      form.setFieldsValue({ description: data.description });
      message.success('Описание сгенерировано');
    } catch (error) {
      message.error(error.response?.data?.message || 'Не удалось сгенерировать описание');
    } finally {
      setGenerating(false);
    }
  }

  if (!canCreateRepair) {
    return <div className="page-card"><Result status="403" title="Доступ запрещён" subTitle="Кладовщик не может создавать записи ремонта." extra={<Button onClick={() => navigate('/repairs')}>К списку ремонтов</Button>} /></div>;
  }

  return (
    <div className="page-card">
      <h1>{isEdit ? 'Редактирование ремонта' : 'Создание ремонта'}</h1>
      <Form form={form} layout="vertical" onFinish={submit} initialValues={{ repair_date: dayjs() }}>
        <Form.Item name="equipment_id" label="Оборудование" rules={[{ required: true }]}>
          <Select options={equipment.map((e) => ({ value: e.id, label: `${e.inventory_number} ${e.name}` }))} />
        </Form.Item>
        <Form.Item name="repair_date" label="Дата ремонта" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Комплектующие">
          {usedParts.map((row, index) => (
            <div className="repair-part-row" key={index}>
              <Select placeholder="Деталь" value={row.part_id} options={parts.map((p) => ({ value: p.id, label: `${p.article} ${p.name} (${p.quantity})` }))} onChange={(value) => changePart(index, { part_id: value })} />
              <InputNumber min={0.01} value={row.quantity} onChange={(value) => changePart(index, { quantity: value })} />
              <Button danger onClick={() => setUsedParts(usedParts.filter((_, i) => i !== index))}>X</Button>
            </div>
          ))}
          <Button onClick={() => setUsedParts([...usedParts, { part_id: null, quantity: 1 }])}>Добавить деталь</Button>
        </Form.Item>
        <Form.Item label="Описание">
          <Space className="description-actions">
            <Button loading={generating} onClick={generateDescription}>Сгенерировать описание</Button>
          </Space>
          <Form.Item name="description" noStyle>
            <Input.TextArea rows={3} placeholder="Введите исходные данные или сгенерируйте описание по оборудованию и комплектующим" />
          </Form.Item>
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">{isEdit ? 'Сохранить изменения' : 'Сохранить ремонт'}</Button>
        </Space>
      </Form>
    </div>
  );
}
