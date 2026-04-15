import { API_BASE_URL } from '../utils/apiConfig';

export const fetchUnreadOfferNotifications = async (identifier) => {
  if (!identifier) return [];

  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_BASE_URL}/placed-students/offer-notifications/${encodeURIComponent(identifier)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        }
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error('Offer notification fetch error:', error);
    return [];
  }
};

export const markOfferNotificationsAsRead = async (identifier, notificationIds = []) => {
  if (!identifier) return false;

  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_BASE_URL}/placed-students/offer-notifications/mark-read`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
        },
        body: JSON.stringify({
          studentId: identifier,
          regNo: identifier,
          notificationIds
        })
      }
    );

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Offer notification mark-read error:', error);
    return false;
  }
};

export default {
  fetchUnreadOfferNotifications,
  markOfferNotificationsAsRead
};
