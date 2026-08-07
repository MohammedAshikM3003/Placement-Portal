import API_BASE_URL from './apiConfig';

/**
 * Checks if global Mail/Email Service is enabled.
 * Queries local cache and syncs with backend /api/v1/health/mail-status endpoint.
 * @returns {Promise<boolean>}
 */
export async function checkMailServiceEnabled() {
    try {
        const cached = localStorage.getItem('placement_portal_mail_service_enabled');
        if (cached === 'false') {
            return false;
        }

        const res = await fetch(`${API_BASE_URL}/health/mail-status`).catch(() => null);
        if (res && res.ok) {
            const data = await res.json();
            const enabled = data?.config?.mailServiceEnabled ?? data?.mailServiceEnabled ?? true;
            localStorage.setItem('placement_portal_mail_service_enabled', enabled ? 'true' : 'false');
            return enabled;
        }
    } catch (err) {
        console.warn('[MailServiceUtils] Failed querying mail status:', err.message);
    }
    return true;
}

/**
 * Centralized helper to evaluate if OTP modal should open or be skipped.
 * If mail service is disabled, invokes onSkipOtp() directly without opening the modal.
 * If enabled, invokes onOpenOtp().
 */
export async function triggerOtpOrExecute({ onSkipOtp, onOpenOtp }) {
    const enabled = await checkMailServiceEnabled();
    if (!enabled) {
        console.log('[OTP Helper] Mail service is DISABLED globally. Skipping OTP modal.');
        if (onSkipOtp) {
            await onSkipOtp();
        }
        return false;
    }
    if (onOpenOtp) {
        await onOpenOtp();
    }
    return true;
}
