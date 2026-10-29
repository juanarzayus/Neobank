import { ref, computed } from 'vue';

export type NotificationType = 'success' | 'warning' | 'danger' | 'info';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

const currentUserId = ref<string>('guest');
const items = ref<AppNotification[]>([]);

const getStorageKey = (uid: string) => `nova_notifications_${uid || 'guest'}`;

export const loadUserNotifications = (uid?: string | null) => {
  currentUserId.value = uid || 'guest';
  if (typeof localStorage === 'undefined') return;
  try {
    const raw = localStorage.getItem(getStorageKey(currentUserId.value));
    items.value = raw ? JSON.parse(raw) : [];
  } catch {
    items.value = [];
  }
};

const persist = () => {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(currentUserId.value), JSON.stringify(items.value));
  } catch {
    // silent
  }
};

export const notifications = computed(() => items.value);

export const unreadCount = computed(() => items.value.filter(n => !n.read).length);

export const pushNotification = (payload: {
  title: string;
  message: string;
  type?: NotificationType;
}) => {
  const newNotif: AppNotification = {
    id: 'ntf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    title: payload.title,
    message: payload.message,
    type: payload.type ?? 'info',
    read: false,
    createdAt: new Date().toISOString(),
  };
  items.value.unshift(newNotif);
  if (items.value.length > 40) {
    items.value = items.value.slice(0, 40);
  }
  persist();
};

export const markAsRead = (id: string) => {
  const target = items.value.find(n => n.id === id);
  if (target && !target.read) {
    target.read = true;
    persist();
  }
};

export const markAllAsRead = () => {
  let changed = false;
  items.value.forEach(n => {
    if (!n.read) {
      n.read = true;
      changed = true;
    }
  });
  if (changed) persist();
};

export const clearNotifications = () => {
  items.value = [];
  persist();
};

