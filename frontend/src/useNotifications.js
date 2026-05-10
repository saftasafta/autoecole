import { useContext } from 'react';
import { NotificationsContext } from './NotificationsContextBase';

export const useNotifications = () => useContext(NotificationsContext);
