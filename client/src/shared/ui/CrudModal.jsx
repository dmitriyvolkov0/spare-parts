import { Modal, Form, Input, InputNumber, Select } from 'antd';

export function CrudModal({ open, title, fields, initialValues, onCancel, onSubmit }) {
  const [form] = Form.useForm();

  return (
    <Modal open={open} title={title} okText="Сохранить" cancelText="Отмена" onCancel={onCancel} onOk={() => form.submit()} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={initialValues} onFinish={onSubmit}>
        {fields.map((field) => (
          <Form.Item key={field.name} name={field.name} label={field.label} rules={field.required ? [{ required: true }] : []}>
            {field.type === 'number' && <InputNumber min={0} style={{ width: '100%' }} />}
            {field.type === 'select' && <Select options={field.options} />}
            {!field.type && <Input />}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
}
