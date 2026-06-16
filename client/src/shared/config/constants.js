export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const ROLES = {
  admin: 'Администратор',
  technician: 'Механик',
  storekeeper: 'Кладовщик',
};

export const STOCK_OPERATIONS = {
  INCOME: 'Поступление',
  EXPENSE: 'Списание',
};
