import { Layout, Menu, Button, Modal, Popover, Space, Tag, Typography, message } from 'antd';
import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../../features/auth/auth.js';
import { api } from '../../shared/api/client.js';
import { ROLES } from '../../shared/config/constants.js';

const { Header, Sider, Content } = Layout;

const roleColors = {
  admin: 'role-admin',
  technician: 'role-technician',
  storekeeper: 'role-storekeeper',
};

function Icon({ children }) {
  return <span className="menu-icon">{children}</span>;
}

const icons = {
  dashboard: <Icon><svg viewBox="0 0 24 24"><path d="M4 13h7V4H4v9Zm0 7h7v-5H4v5Zm9 0h7v-9h-7v9Zm0-16v5h7V4h-7Z" /></svg></Icon>,
  parts: <Icon><svg viewBox="0 0 24 24"><path d="M5 4h14v4H5V4Zm0 6h14v10H5V10Zm3 3v2h8v-2H8Z" /></svg></Icon>,
  equipment: <Icon><svg viewBox="0 0 24 24"><path d="M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2.1-1.6-2-3.5-2.5 1a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.9A7.7 7.7 0 0 0 7 6.4l-2.5-1-2 3.5 2.1 1.6c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2.1 1.6 2 3.5 2.5-1c.8.7 1.6 1.2 2.6 1.5L10 22h4l.4-2.9c1-.3 1.8-.8 2.6-1.5l2.5 1 2-3.5-2.1-1.6ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z" /></svg></Icon>,
  repairs: <Icon><svg viewBox="0 0 24 24"><path d="m22 19.6-6.3-6.3a6.5 6.5 0 0 1-8.1-8.1l4 4 2.8-2.8-4-4a6.5 6.5 0 0 1 8.1 8.1l6.3 6.3-2.8 2.8Z" /></svg></Icon>,
  users: <Icon><svg viewBox="0 0 24 24"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-6 1.7-6 3.8V20h12v-3.2c0-2.1-2.7-3.8-6-3.8Zm8.5-1a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0 1.5c-.7 0-1.4.1-2 .3 1 .8 1.5 1.8 1.5 3V20h5v-2.7c0-2.1-2-3.8-4.5-3.8Z" /></svg></Icon>,
  info: <Icon><svg viewBox="0 0 24 24"><path d="M11 17h2v-6h-2v6Zm1-8a1.2 1.2 0 1 0 0-2.4A1.2 1.2 0 0 0 12 9Zm0 13a10 10 0 1 1 0-20 10 10 0 0 1 0 20Z" /></svg></Icon>,
};

function BurgerIcon({ collapsed }) {
  return (
    <span className={`burger-icon ${collapsed ? 'is-collapsed' : ''}`}>
      <span />
      <span />
      <span />
    </span>
  );
}

function UserIcon() {
  return (
    <span className="user-icon">
      <svg viewBox="0 0 24 24"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v1.5c0 .8.7 1.5 1.5 1.5h13c.8 0 1.5-.7 1.5-1.5V19c0-2.8-3.6-5-8-5Z" /></svg>
    </span>
  );
}

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth <= 700);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [seedLoading, setSeedLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const items = [
    { key: '/', label: 'Дашборд', icon: icons.dashboard },
    { key: '/parts', label: 'Склад', icon: icons.parts },
    { key: '/equipment', label: 'Оборудование', icon: icons.equipment },
    { key: '/repairs', label: 'Ремонты', icon: icons.repairs },
  ];

  if (user?.role === 'admin') {
    items.push({ key: '/users', label: 'Пользователи', icon: icons.users });
  }

  const selectedKey = location.pathname.startsWith('/repairs') ? '/repairs' : location.pathname;

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth <= 700) {
        setCollapsed(true);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function confirmResetDemo() {
    setProfileOpen(false);
    Modal.confirm({
      title: 'Заполнить БД тестовыми данными?',
      content: 'Текущие данные склада, оборудования, ремонтов и движений будут удалены и заменены тестовыми. Пользователи сохранятся.',
      okText: 'Заполнить',
      cancelText: 'Отмена',
      okButtonProps: { danger: true },
      onOk: async () => {
        setSeedLoading(true);
        try {
          await api.post('/admin/reset-demo');
          message.success('Тестовые данные загружены');
          navigate('/');
          window.location.reload();
        } catch (error) {
          message.error(error.response?.data?.message || 'Не удалось загрузить тестовые данные');
        } finally {
          setSeedLoading(false);
        }
      },
    });
  }

  const profileContent = (
    <div className="profile-card">
      <div className="profile-head">
        <UserIcon />
        <div>
          <Typography.Text strong>{user?.full_name || user?.login}</Typography.Text>
          <Typography.Text type="secondary">@{user?.login}</Typography.Text>
        </div>
      </div>
      <div className="profile-info">
        <div><span>ФИО</span><strong>{user?.full_name || '-'}</strong></div>
        <div><span>Логин</span><strong>@{user?.login}</strong></div>
        <div><span>Роль</span><Tag className={`role-pill ${roleColors[user?.role] || ''}`}>{ROLES[user?.role] || user?.role}</Tag></div>
      </div>
      <Space className="profile-actions" direction="vertical" size={8}>
        {user?.role === 'admin' && <Button block loading={seedLoading} onClick={confirmResetDemo}>Заполнить БД тестовыми данными</Button>}
        <Button block onClick={handleLogout}>Выйти</Button>
      </Space>
    </div>
  );

  return (
    <Layout className="app-layout">
      <Sider className="sidebar" collapsible collapsed={collapsed} collapsedWidth={72} trigger={null} width={240}>
        <div className="sidebar-head">
          <div className="logo">{collapsed ? 'РУ' : 'РемУчёт'}</div>
          <Button className="sidebar-toggle" type="text" aria-label="Переключить меню" onClick={() => setCollapsed(!collapsed)}>
            <BurgerIcon collapsed={collapsed} />
          </Button>
        </div>
        <div className="sidebar-body">
          <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={items} onClick={({ key }) => { navigate(key); if (window.innerWidth <= 700) setCollapsed(true); }} />
          <div className="sidebar-divider" />
          <Menu theme="dark" mode="inline" selectable={false} items={[{ key: 'about', label: 'О программе', icon: icons.info }]} onClick={() => setAboutOpen(true)} />
        </div>
      </Sider>
      <Layout className="main-layout">
        <Header className="topbar">
          <Popover open={profileOpen} onOpenChange={setProfileOpen} content={profileContent} trigger="click" placement="bottomRight">
            <button className="user-menu-button" type="button">
              <UserIcon />
              <span>{user?.full_name || user?.login}</span>
            </button>
          </Popover>
        </Header>
        <Content className="content"><Outlet /></Content>
      </Layout>
      <Modal open={aboutOpen} footer={null} onCancel={() => setAboutOpen(false)}>
        <Typography.Title level={4}>РемУчёт</Typography.Title>
        <Typography.Paragraph>
          Информационная система для учёта запасных частей ремонтного подразделения и автоматического списания комплектующих при выполнении ремонта.
        </Typography.Paragraph>
        <Typography.Text strong>Автор: </Typography.Text>
        <Typography.Text>Студент группы ЗБИВТ-231 Волков Дмитрий</Typography.Text>
      </Modal>
    </Layout>
  );
}
