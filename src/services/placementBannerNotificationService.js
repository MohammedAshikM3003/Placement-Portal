import { API_BASE_URL } from '../utils/apiConfig';

export const claimPlacementBannerNotification = async (payload = {}) => {
  const studentId = String(payload.studentId || '').trim();
  const signature = String(payload.signature || '').trim();
  const status = String(payload.status || '').trim();

  if (!studentId || !signature || !status) {
    return { success: false, claimed: false };
  }

  try {
    const authToken = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/placement-banner-notifications/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        studentId,
        regNo: payload.regNo || '',
        signature,
        status,
        companyName: payload.companyName || '',
        jobRole: payload.jobRole || '',
        roundName: payload.roundName || '',
        roundNumber: payload.roundNumber,
        driveId: payload.driveId || '',
        source: payload.source || 'placement-banner'
      })
    });

    if (!response.ok) {
      return { success: false, claimed: false };
    }

    return await response.json();
  } catch (error) {
    console.error('Placement banner claim error:', error);
    return { success: false, claimed: false };
  }
};

export default {
  claimPlacementBannerNotification
};