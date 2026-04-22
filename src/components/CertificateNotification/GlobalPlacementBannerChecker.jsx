import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mongoDBService from '../../services/mongoDBService.jsx';
import PlacementStatusBanner from './PlacementStatusBanner';
import useBannerQueueSlot from '../../hooks/useBannerQueueSlot';
import {
	fetchUnreadOfferNotifications,
	markOfferNotificationsAsRead
} from '../../services/offerLetterNotificationService';

const POLL_INTERVAL_MS = 5000;
const PLACEMENT_POPUP_STORAGE_PREFIX = 'placementPopupSeen';

const normalizeText = (value) =>
	(value ?? '')
		.toString()
		.trim()
		.toLowerCase();

const normalizeStudentId = (value) =>
	(value ?? '')
		.toString()
		.trim();

const extractStudentRegNo = () => {
	try {
		const full = JSON.parse(localStorage.getItem('completeStudentData') || 'null');
		const fromFull = full?.student?.regNo || full?.student?.registerNo;
		if (fromFull) return fromFull;

		const basic = JSON.parse(localStorage.getItem('studentData') || 'null');
		return basic?.regNo || basic?.registerNo || null;
	} catch (error) {
		console.error('❌ [PlacementChecker] Failed to resolve student regNo:', error);
		return null;
	}
};

const extractStudentIdentifier = () => {
	try {
		const full = JSON.parse(localStorage.getItem('completeStudentData') || 'null');
		const fromFull = full?.student?._id || full?.student?.id;
		if (fromFull) return fromFull;

		const basic = JSON.parse(localStorage.getItem('studentData') || 'null');
		return basic?._id || basic?.id || null;
	} catch (error) {
		console.error('❌ [PlacementChecker] Failed to resolve student identifier:', error);
		return null;
	}
};

const getPlacementSnapshot = (student) => {
	const placementCandidates = [
		student?.placementStatus,
		student?.placement,
		student?.placementResult,
		student?.finalPlacementStatus,
		student?.companyPlacementStatus,
		student?.jobStatus,
		student?.status
	]
		.map((value) => normalizeText(value))
		.filter(Boolean);

	const placedByStatus = placementCandidates.some((value) =>
		value === 'placed' ||
		value === 'selected' ||
		value === 'offer received' ||
		value === 'hired'
	);

	const placedByBoolean = typeof student?.isPlaced === 'boolean' ? student.isPlaced : false;
	const isPlaced = placedByStatus || placedByBoolean;

	const companyName =
		student?.companyPlaced ||
		student?.placedCompany ||
		student?.companyName ||
		student?.lastDriveAttended ||
		'';

	const signature = [
		placementCandidates.join('|'),
		companyName,
		student?.packageOffered || student?.package || ''
	].join('::');

	return { isPlaced, companyName, signature, status: 'placed' };
};

const mapApplicationStatusToBannerStatus = (statusValue) => {
	const normalized = normalizeText(statusValue);
	if (!normalized) return null;
	if (normalized === 'placed' || normalized === 'selected' || normalized === 'offer received' || normalized === 'hired') return 'placed';
	if (normalized === 'passed') return 'passed';
	if (normalized === 'failed' || normalized === 'rejected') return 'failed';
	if (normalized === 'absent') return 'absent';
	return null;
};

const getLatestApplicationSnapshot = (applications = []) => {
	const normalizedApps = Array.isArray(applications) ? applications : [];
	const candidates = [];

	normalizedApps.forEach((app) => {
		const driveId = (app?.driveId || '').toString().trim();
		const companyName = (app?.companyName || '').toString().trim();
		const jobRole = (app?.jobRole || '').toString().trim();
		const packageName = (app?.package || app?.ctc || app?.salaryPackage || app?.packageOffered || '').toString().trim();
		const startDate = (app?.startingDate || app?.startDate || app?.nasaDate || '').toString().trim();
		const rounds = Array.isArray(app?.rounds) ? app.rounds : [];
		const configuredTotalRounds = Number(app?.totalRounds || app?.roundDetails?.length || 0);
		const sortedRounds = rounds
			.slice()
			.sort((left, right) => {
				const rightRound = Number(right?.roundNumber) || 0;
				const leftRound = Number(left?.roundNumber) || 0;
				if (rightRound !== leftRound) {
					return rightRound - leftRound;
				}
				return new Date(right?.date || right?.updatedAt || 0) - new Date(left?.date || left?.updatedAt || 0);
			});
		const latestRound = sortedRounds[0] || null;
		const latestRoundStatus = normalizeText(latestRound?.status);
		const allRoundsPassed = rounds.length > 0 && rounds.every((round) => normalizeText(round?.status) === 'passed');
		const finalRoundCompleted =
			configuredTotalRounds > 0 &&
			allRoundsPassed &&
			rounds.length >= configuredTotalRounds;

		if (rounds.length) {
			if (finalRoundCompleted && latestRoundStatus === 'passed') {
				candidates.push({
					status: 'placed',
					companyName,
					jobRole,
					packageName,
					roundName: '',
					roundNumber: null,
					signature: [driveId || companyName, jobRole, startDate, 'placed', packageName].join('::'),
					recordedAt: new Date(app?.updatedAt || latestRound?.date || app?.appliedDate || 0).getTime()
				});
			} else {
				const bannerStatus = mapApplicationStatusToBannerStatus(latestRound?.status);
				if (bannerStatus) {
				candidates.push({
					status: bannerStatus,
					companyName,
					jobRole,
					packageName,
					roundName: latestRound?.roundName || latestRound?.name || '',
					roundNumber: Number(latestRound?.roundNumber) || null,
					signature: [
						driveId || companyName,
						jobRole,
						startDate,
						Number(latestRound?.roundNumber) || 0,
						bannerStatus
					].join('::'),
					recordedAt: new Date(latestRound?.date || app?.updatedAt || app?.appliedDate || 0).getTime()
				});
				}
			}
		}

		const appLevelStatus = mapApplicationStatusToBannerStatus(app?.status);

		if (appLevelStatus === 'placed') {
			candidates.push({
				status: 'placed',
				companyName,
				jobRole,
				packageName,
				roundName: '',
				roundNumber: null,
				signature: [driveId || companyName, jobRole, startDate, 'placed', packageName].join('::'),
				recordedAt: new Date(app?.updatedAt || latestRound?.date || app?.appliedDate || 0).getTime()
			});
		}

	});

	if (!candidates.length) return null;

	const latest = candidates
		.slice()
		.sort((left, right) => {
			const byTime = (right.recordedAt || 0) - (left.recordedAt || 0);
			if (byTime !== 0) return byTime;
			const statusPriority = { placed: 4, passed: 3, failed: 2, present: 1, absent: 1 };
			return (statusPriority[right.status] || 0) - (statusPriority[left.status] || 0);
		})[0];

	return {
		isPlaced: true,
		companyName: latest.companyName,
		jobRole: latest.jobRole,
		packageName: latest.packageName,
		roundName: latest.roundName,
		roundNumber: latest.roundNumber,
		signature: latest.signature,
		status: latest.status,
		recordedAt: latest.recordedAt || 0
	};
};

const getLatestAttendanceSnapshot = (attendanceRecords = []) => {
	const records = Array.isArray(attendanceRecords) ? attendanceRecords : [];
	const attendanceStatusRecords = records.filter((record) => {
		const status = normalizeText(record?.status);
		return status === 'absent' || status === 'present';
	});
	if (!attendanceStatusRecords.length) return null;

	const latestAttendance = attendanceStatusRecords
		.slice()
		.sort((left, right) => {
			const rightTs = new Date(right?.updatedAt || right?.submittedAt || right?.startDate || right?.endDate || 0).getTime();
			const leftTs = new Date(left?.updatedAt || left?.submittedAt || left?.startDate || left?.endDate || 0).getTime();
			return rightTs - leftTs;
		})[0];

	const attendanceStatus = normalizeText(latestAttendance?.status) === 'present' ? 'present' : 'absent';

	const driveId = (latestAttendance?.driveId || '').toString().trim();
	const companyName = (latestAttendance?.companyName || '').toString().trim();
	const jobRole = (latestAttendance?.jobRole || '').toString().trim();
	const startDate = (latestAttendance?.startDate || '').toString().trim();
	const recordedAt = new Date(latestAttendance?.updatedAt || latestAttendance?.submittedAt || latestAttendance?.startDate || latestAttendance?.endDate || 0).getTime();

	return {
		isPlaced: true,
		status: attendanceStatus,
		companyName,
		jobRole,
		roundName: 'Attendance',
		roundNumber: 0,
		signature: [driveId || companyName, jobRole, startDate, attendanceStatus, recordedAt].join('::'),
		recordedAt
	};
};

const normalizeIncomingBannerPayload = (incomingPayload) => {
	const payload = { ...(incomingPayload || {}) };
	const normalizedStatus = normalizeText(payload?.status);
	const roundNumber = Number(payload?.roundNumber || 0);
	const totalRounds = Number(payload?.totalRounds || 0);
	const isFinalRound = Boolean(payload?.isFinalRound) || (totalRounds > 0 && roundNumber > 0 && roundNumber >= totalRounds);

	let effectiveStatus = normalizedStatus;
	if (normalizedStatus === 'passed' && isFinalRound) {
		effectiveStatus = 'placed';
	}

	payload.status = effectiveStatus || payload.status;

	const studentId = normalizeStudentId(payload?.studentId);
	const driveOrCompany = (payload?.driveId || payload?.companyName || 'no-drive').toString().trim();
	const statusForSignature = payload.status || 'placed';
	if (studentId) {
		payload.signature = `${studentId}:${driveOrCompany}:${roundNumber || 0}:${statusForSignature}`;
	}

	return payload;
};

const GlobalPlacementBannerChecker = () => {
	const [studentId, setStudentId] = useState(null);
	const [studentRegNo, setStudentRegNo] = useState(null);
	const [bannerData, setBannerData] = useState(null);
	const showingRef = useRef(false);
	const pollCountRef = useRef(0);
	const queueSlotId = useMemo(() => {
		if (!bannerData) return null;
		return `placement-notification:${bannerData.signature || `${bannerData.status || 'placed'}:${bannerData.companyName || ''}:${bannerData.roundNumber || 0}`}`;
	}, [bannerData]);
	const canDisplayBanner = useBannerQueueSlot(queueSlotId, Boolean(bannerData));

	const getSeenStorageKeys = useCallback((extraStudentId = null) => {
		const keys = [];
		const candidates = [studentId, studentRegNo, extraStudentId]
			.map((value) => normalizeStudentId(value))
			.filter(Boolean);

		candidates.forEach((value) => {
			const key = `${PLACEMENT_POPUP_STORAGE_PREFIX}:${value}`;
			if (!keys.includes(key)) {
				keys.push(key);
			}
		});

		return keys;
	}, [studentId, studentRegNo]);

	const readSeenSignatures = useCallback((storageKey) => {
		const rawValue = localStorage.getItem(storageKey);
		if (!rawValue) return [];

		try {
			const parsed = JSON.parse(rawValue);
			if (Array.isArray(parsed)) {
				return parsed.map((value) => normalizeText(value)).filter(Boolean);
			}
		} catch (error) {
			// Backward compatibility for legacy pipe-delimited storage format.
		}

		return rawValue
			.split('|')
			.map((value) => normalizeText(value))
			.filter(Boolean);
	}, []);

	const writeSeenSignatures = useCallback((storageKey, signatures) => {
		localStorage.setItem(storageKey, JSON.stringify(signatures));
	}, []);

	const hasSeenSignature = useCallback((candidateSignature, extraStudentId = null) => {
		const normalizedSignature = normalizeText(candidateSignature);
		if (!normalizedSignature) return false;

		const keys = getSeenStorageKeys(extraStudentId);
		if (!keys.length) return false;

		return keys.some((storageKey) => readSeenSignatures(storageKey).includes(normalizedSignature));
	}, [getSeenStorageKeys, readSeenSignatures]);

	const resolveStudentId = useCallback(() => {
		const resolved = extractStudentIdentifier();
		const resolvedRegNo = extractStudentRegNo();
		if (resolved) {
			console.log('🔔 [PlacementChecker] Resolved studentId:', resolved);
			setStudentId(resolved);
		} else {
			console.warn('🔔 [PlacementChecker] Could not resolve studentId from storage');
			setStudentId(null);
		}

		if (resolvedRegNo) {
			setStudentRegNo(resolvedRegNo);
		} else {
			setStudentRegNo(null);
		}
	}, []);

	const markSignatureAsSeen = useCallback((signature, extraStudentId = null) => {
		const normalizedSignature = normalizeText(signature);
		if (!normalizedSignature) return;

		const keys = getSeenStorageKeys(extraStudentId);
		if (!keys.length) return;

		keys.forEach((storageKey) => {
			const currentSeen = readSeenSignatures(storageKey);
			if (currentSeen.includes(normalizedSignature)) return;
			writeSeenSignatures(storageKey, [...currentSeen, normalizedSignature]);
		});

		console.log('🔔 [PlacementChecker] Marked signature as seen:', normalizedSignature, 'keys:', keys);
	}, [getSeenStorageKeys, readSeenSignatures, writeSeenSignatures]);

	useEffect(() => {
		console.log('🔔 [PlacementChecker] Mounted on route:', window.location.pathname);
		resolveStudentId();

		const handleStorage = (event) => {
			resolveStudentId();

			if (event?.key !== 'placementBannerBroadcast' || !event.newValue) {
				return;
			}

			try {
				const payload = normalizeIncomingBannerPayload(JSON.parse(event.newValue));
				const payloadStudentId = normalizeStudentId(payload?.studentId);
				const currentStudentId = normalizeStudentId(studentId);

				if (!payloadStudentId || !currentStudentId || payloadStudentId !== currentStudentId) {
					return;
				}

				if (hasSeenSignature(payload?.signature, payloadStudentId)) {
					console.log('🔔 [PlacementChecker] Storage event ignored (already seen):', payload?.signature);
					return;
				}

				console.log('🔔 [PlacementChecker] Received storage broadcast for current student:', payload);
				markSignatureAsSeen(payload?.signature, payloadStudentId);
				showingRef.current = true;
				setBannerData(payload);
			} catch (error) {
				console.error('❌ [PlacementChecker] Failed to parse placementBannerBroadcast:', error);
			}
		};

		// Listen for round result events from AdminCompanyDrivedet
		const handleRoundResultEvent = (event) => {
			console.log('🔔 [PlacementChecker] Round result event received:', event.detail);

			// Verify the event is for the current student
			const eventStudentId = normalizeStudentId(event.detail?.studentId);
			if (!eventStudentId) {
				console.warn('🔔 [PlacementChecker] Event missing studentId');
				return;
			}

			// Only process if this event is for the currently logged-in student
			if (normalizeStudentId(studentId) && eventStudentId === normalizeStudentId(studentId)) {
				const normalizedPayload = normalizeIncomingBannerPayload(event.detail);
				if (normalizeText(normalizedPayload?.status) === 'placed') {
					// Placed notifications are handled via backend unread offer notifications
					// so they are consistent across devices.
					return;
				}
				if (hasSeenSignature(normalizedPayload?.signature, eventStudentId)) {
					console.log('🔔 [PlacementChecker] Event ignored (already seen):', normalizedPayload?.signature);
					return;
				}

				console.log('🔔 [PlacementChecker] Event is for current student, showing banner');
				markSignatureAsSeen(normalizedPayload?.signature, eventStudentId);
				showingRef.current = true;
				setBannerData(normalizedPayload);
			} else if (!studentId) {
				console.log('🔔 [PlacementChecker] No current studentId yet, buffering event');
			} else {
				console.log('🔔 [PlacementChecker] Event is for different student, ignoring');
			}
		};

		window.addEventListener('storage', handleStorage);
		window.addEventListener('profileUpdated', handleStorage);
		window.addEventListener('studentDataUpdated', handleStorage);
		window.addEventListener('roundResultNotification', handleRoundResultEvent);

		return () => {
			console.log('🔔 [PlacementChecker] Unmounted');
			window.removeEventListener('storage', handleStorage);
			window.removeEventListener('profileUpdated', handleStorage);
			window.removeEventListener('studentDataUpdated', handleStorage);
			window.removeEventListener('roundResultNotification', handleRoundResultEvent);
		};
	}, [resolveStudentId, studentId, hasSeenSignature, markSignatureAsSeen]);

	const pollPlacement = useCallback(async () => {
		if ((!studentId && !studentRegNo) || showingRef.current) return;
		pollCountRef.current += 1;
		console.log(`🔔 [PlacementChecker] Polling for: ${studentId || studentRegNo} (count=${pollCountRef.current})`);

		try {
			const [appResponse, attendanceResponseByRegNo, attendanceResponseByStudentId] = await Promise.all([
				studentId ? mongoDBService.getStudentApplications(studentId).catch(() => null) : Promise.resolve(null),
				studentRegNo ? mongoDBService.getStudentAttendanceByRegNo(studentRegNo).catch(() => null) : Promise.resolve(null),
				!studentRegNo && studentId ? mongoDBService.getStudentAttendance(studentId).catch(() => null) : Promise.resolve(null)
			]);

			const applicationCount = Array.isArray(appResponse?.applications) ? appResponse.applications.length : 0;
			console.log('🔔 [PlacementChecker] Applications fetched:', applicationCount);
			const appsSnapshot = getLatestApplicationSnapshot(appResponse?.applications || []);
			const attendanceData = attendanceResponseByRegNo?.data || attendanceResponseByStudentId?.data || [];
			const attendanceSnapshot = getLatestAttendanceSnapshot(attendanceData);

			let snapshot = [appsSnapshot, attendanceSnapshot]
				.filter(Boolean)
				.sort((left, right) => (right?.recordedAt || 0) - (left?.recordedAt || 0))[0] || null;

			// Backward compatible fallback: profile-level placement fields.
			if (!snapshot && studentId) {
				console.log('🔔 [PlacementChecker] No app/attendance snapshot found, checking profile fallback');
				const student = await mongoDBService.getStudentById(studentId);
				snapshot = getPlacementSnapshot(student);
			}

			console.log('🎯 [PlacementChecker] Poll result:', {
				studentId: studentId || studentRegNo,
				hasSnapshot: !!snapshot,
				isPlaced: !!snapshot?.isPlaced,
				status: snapshot?.status || '',
				companyName: snapshot?.companyName || ''
			});

			if (!snapshot || !snapshot.isPlaced) return;

			if (normalizeText(snapshot?.status) === 'placed') {
				const identifier = studentId || studentRegNo;
				if (!identifier) return;

				const unreadOfferNotifications = await fetchUnreadOfferNotifications(identifier);
				if (!Array.isArray(unreadOfferNotifications) || unreadOfferNotifications.length === 0) {
					return;
				}

				const latestNotification = unreadOfferNotifications[0];
				const notificationId = String(latestNotification?.id || '').trim();
				if (!notificationId) return;

				showingRef.current = true;
				setBannerData({
					status: 'placed',
					companyName: latestNotification?.companyName || snapshot?.companyName || '',
					jobRole: latestNotification?.jobRole || snapshot?.jobRole || '',
					packageName: latestNotification?.packageName || snapshot?.packageName || '',
					roundName: '',
					roundNumber: null,
					notificationId,
					signature: `offer-notification:${notificationId}`
				});
				return;
			}

			if (hasSeenSignature(snapshot.signature)) {
				console.log('🔔 [PlacementChecker] Already shown for signature:', snapshot.signature);
				return;
			}

			console.log('🔔 [PlacementChecker] Triggering banner for company:', snapshot.companyName || '(unknown)');
			markSignatureAsSeen(snapshot.signature);
			showingRef.current = true;
			setBannerData(snapshot);
		} catch (error) {
			console.error('❌ [PlacementChecker] Poll failed:', error);
		}
	}, [studentId, studentRegNo, hasSeenSignature, markSignatureAsSeen]);

	useEffect(() => {
		if (!studentId && !studentRegNo) return;
		console.log('🔔 [PlacementChecker] Starting poll loop for student:', studentId || studentRegNo);

		const timer = setTimeout(pollPlacement, 700);
		const interval = setInterval(pollPlacement, POLL_INTERVAL_MS);

		window.__placementCheckerDebug = {
			studentId,
			studentRegNo,
			forcePoll: pollPlacement,
			clearSeen: () => {
				const keys = getSeenStorageKeys();
				keys.forEach((seenKey) => localStorage.removeItem(seenKey));
				console.log('🔔 [PlacementChecker] Cleared seen signature keys:', keys);
			}
		};

		return () => {
			console.log('🔔 [PlacementChecker] Stopping poll loop for student:', studentId || studentRegNo);
			clearTimeout(timer);
			clearInterval(interval);
			if (window.__placementCheckerDebug?.studentId === studentId) {
				delete window.__placementCheckerDebug;
			}
		};
	}, [studentId, studentRegNo, pollPlacement, getSeenStorageKeys]);

	const handleClose = useCallback(async () => {
		const status = normalizeText(bannerData?.status);
		const notificationId = String(bannerData?.notificationId || '').trim();

		if (status === 'placed' && notificationId) {
			const identifier = studentId || studentRegNo;
			if (identifier) {
				try {
					await markOfferNotificationsAsRead(identifier, [notificationId]);
				} catch (error) {
					console.error('❌ [PlacementChecker] Failed to mark placed notification as read:', error);
				}
			}
		} else if (bannerData?.signature) {
			markSignatureAsSeen(bannerData.signature);
		}

		setBannerData(null);
		showingRef.current = false;
	}, [bannerData, markSignatureAsSeen, studentId, studentRegNo]);

	if (!bannerData || !canDisplayBanner) return null;

	return (
		<PlacementStatusBanner
			status={bannerData.status || 'placed'}
			companyName={bannerData.companyName}
			jobRole={bannerData.jobRole}
			packageName={bannerData.packageName}
			roundName={bannerData.roundName}
			roundNumber={bannerData.roundNumber}
			onClose={handleClose}
		/>
	);
};

export default GlobalPlacementBannerChecker;
