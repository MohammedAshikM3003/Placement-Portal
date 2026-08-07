import { API_BASE_URL } from '../utils/apiConfig';

/**
 * Fetch unread semester notifications for a student from the server
 * Called by GlobalSemesterNotificationChecker every few seconds
 * @param {string} identifier - Student's MongoDB _id or register number
 * @returns {Promise<Array>} Array of unread notification objects
 */
export const fetchUnreadSemesterNotifications = async (identifier) => {
    if (!identifier) return [];

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(
            `${API_BASE_URL}/semester-notifications/${encodeURIComponent(identifier)}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                }
            }
        );

        if (!response.ok) {
            console.warn('⚠️ Semester notifications fetch returned status:', response.status);
            return [];
        }

        const data = await response.json();
        return data.notifications || [];
    } catch (error) {
        console.error('❌ Error fetching semester notifications:', error);
        return [];
    }
};

/**
 * Mark one or more semester notifications as read on the server
 * @param {string} identifier - Student's MongoDB _id or register number
 * @param {Array<string>} notificationIds - IDs of notifications to mark as read
 */
export const markSemesterNotificationsAsRead = async (identifier, notificationIds = []) => {
    if (!identifier) return false;

    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(
            `${API_BASE_URL}/semester-notifications/mark-read`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
                },
                body: JSON.stringify({ studentId: identifier, regNo: identifier, notificationIds })
            }
        );

        if (!response.ok) {
            console.warn('⚠️ Mark-semester-read returned status:', response.status);
            return false;
        }

        const data = await response.json();
        console.log(`✅ Marked ${data.updated} semester notification(s) as read`);
        return true;
    } catch (error) {
        console.error('❌ Error marking semester notifications as read:', error);
        return false;
    }
};

export default { fetchUnreadSemesterNotifications, markSemesterNotificationsAsRead };
