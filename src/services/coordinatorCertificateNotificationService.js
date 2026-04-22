import { API_BASE_URL } from '../utils/apiConfig';

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchUnreadCoordinatorCertificateNotifications = async () => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/certificates/coordinator-notifications?_ts=${Date.now()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache'
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return Array.isArray(data?.notifications) ? data.notifications : [];
  } catch (error) {
    console.error('Coordinator certificate notifications fetch error:', error);
    return [];
  }
};

export const markCoordinatorCertificateNotificationsAsRead = async (notificationIds = []) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/certificates/coordinator-notifications/mark-read`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ notificationIds })
      }
    );

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Coordinator certificate notifications mark-read error:', error);
    return false;
  }
};

export default {
  fetchUnreadCoordinatorCertificateNotifications,
  markCoordinatorCertificateNotificationsAsRead
};
