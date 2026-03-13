// Certificate Notification Service
// Uses server-side MongoDB API so notifications work across different devices/browsers

import { API_BASE_URL } from '../utils/apiConfig';

/**
 * Fetch unread certificate notifications for a student from the server
 * Called by GlobalNotificationChecker every few seconds
 * @param {string} identifier - Student's MongoDB _id or register number
 * @returns {Promise<Array>} Array of unread notification objects
 */
export const fetchUnreadNotifications = async (identifier) => {
    if (!identifier) return [];

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(
            `${API_BASE_URL}/certificates/notifications/${encodeURIComponent(identifier)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                }
            }
        );

        if (!response.ok) {
            console.warn('⚠️ Notifications fetch returned status:', response.status);
            return [];
        }

        const data = await response.json();
        return data.notifications || [];
    } catch (error) {
        console.error('❌ Error fetching certificate notifications:', error);
        return [];
    }
};

/**
 * Mark one or more certificate notifications as read on the server
 * @param {string} identifier - Student's MongoDB _id or register number
 * @param {Array<string>} certificateIds - IDs of certificates to mark as read
 */
export const markNotificationsAsRead = async (identifier, certificateIds = []) => {
    if (!identifier) return false;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(
            `${API_BASE_URL}/certificates/notifications/mark-read`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({ studentId: identifier, regNo: identifier, certificateIds })
            }
        );

        if (!response.ok) {
            console.warn('⚠️ Mark-as-read returned status:', response.status);
            return false;
        }

        const data = await response.json();
        console.log(`✅ Marked ${data.updated} notification(s) as read`);
        return true;
    } catch (error) {
        console.error('❌ Error marking notifications as read:', error);
        return false;
    }
};

export default { fetchUnreadNotifications, markNotificationsAsRead };
