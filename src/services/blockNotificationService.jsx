import authService from './authService.jsx';

const normalizeValue = (value) => (value ?? '').toString().trim();

const buildQueryString = ({ role, identifier, department }) => {
  const params = new URLSearchParams();

  if (role) params.set('role', normalizeValue(role));
  if (identifier) params.set('identifier', normalizeValue(identifier));
  if (department) params.set('department', normalizeValue(department));

  return params.toString();
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken') || '';
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchUnreadBlockNotifications = async ({ role, identifier, department } = {}) => {
  const queryString = buildQueryString({ role, identifier, department });
  const cacheBust = `_ts=${Date.now()}`;
  const finalQuery = queryString ? `${queryString}&${cacheBust}` : cacheBust;
  const endpoint = `/block-notifications?${finalQuery}`;
  const response = await authService.apiCall(endpoint, {
    headers: {
      ...getAuthHeaders(),
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    },
    cache: 'no-store'
  });
  return Array.isArray(response?.notifications) ? response.notifications : [];
};

export const createBlockNotifications = async (payload = {}) => {
  const normalizedAction = (payload.actionType || payload.type || payload.status || payload.state || '').toString().trim().toLowerCase();
  const isBlocked = typeof payload.isBlocked === 'boolean' ? payload.isBlocked : normalizedAction === 'blocked';
  const studentsPayload =
    (Array.isArray(payload.students) && payload.students.length ? payload.students : null) ||
    (Array.isArray(payload.studentRecords) && payload.studentRecords.length ? payload.studentRecords : null) ||
    (Array.isArray(payload.records) && payload.records.length ? payload.records : null) ||
    (Array.isArray(payload.selectedStudents) && payload.selectedStudents.length ? payload.selectedStudents : null) ||
    [];

  return authService.apiCall('/block-notifications', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...payload,
      actionType: normalizedAction || (isBlocked ? 'blocked' : 'unblocked'),
      type: normalizedAction || (isBlocked ? 'blocked' : 'unblocked'),
      status: normalizedAction || (isBlocked ? 'blocked' : 'unblocked'),
      state: normalizedAction || (isBlocked ? 'blocked' : 'unblocked'),
      isBlocked,
      recipientRole: payload.recipientRole || payload.targetRole || payload.role,
      students: studentsPayload,
      studentRecords: studentsPayload,
      records: studentsPayload,
      selectedStudents: studentsPayload,
      student: payload.student || studentsPayload[0] || null
    })
  });
};

export const markBlockNotificationsAsRead = async ({ role, identifier, department, notificationIds = [] } = {}) => {
  return authService.apiCall('/block-notifications/mark-read', {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      role,
      identifier,
      department,
      notificationIds
    })
  });
};

export default {
  fetchUnreadBlockNotifications,
  createBlockNotifications,
  markBlockNotificationsAsRead
};
