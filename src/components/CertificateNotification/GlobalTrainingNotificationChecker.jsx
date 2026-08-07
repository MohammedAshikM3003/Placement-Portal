import React, { useEffect, useState, useCallback, useRef } from "react";
import mongoDBService from "../../services/mongoDBService.jsx";
import styles from "./GlobalTrainingNotification.module.css";

const POLL_INTERVAL_MS = 2000;

const normalizeYearToken = (value = "") => {
    const raw = value.toString().trim().toUpperCase();
    if (!raw) return "";
    const compact = raw.replace(/[^A-Z0-9]/g, "");
    if (!compact) return "";
    const yearAliases = {
        "1": "I", "01": "I", "1ST": "I", "FIRST": "I", "I": "I",
        "2": "II", "02": "II", "2ND": "II", "SECOND": "II", "II": "II",
        "3": "III", "03": "III", "3RD": "III", "THIRD": "III", "III": "III",
        "4": "IV", "04": "IV", "4TH": "IV", "FOURTH": "IV", "IV": "IV"
    };
    return yearAliases[compact] || compact;
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
};

const getTotalDays = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    const diff = Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 0;
};

const GlobalTrainingNotificationChecker = () => {
    const [toast, setToast] = useState(null);
    const [isClosing, setIsClosing] = useState(false);
    const pollingRef = useRef(null);
    const isShowingRef = useRef(false);
    const toastTimerRef = useRef(null);

    const getStudentInfo = useCallback(() => {
        try {
            const full = JSON.parse(localStorage.getItem("completeStudentData") || "null");
            if (full?.student) {
                return {
                    regNo: (full.student.regNo || full.student.registerNo || "").toString().trim(),
                    currentYear: (full.student.currentYear || full.student.year || "").toString().trim(),
                };
            }
            const basic = JSON.parse(localStorage.getItem("studentData") || "null");
            if (basic) {
                return {
                    regNo: (basic.regNo || basic.registerNo || "").toString().trim(),
                    currentYear: (basic.currentYear || basic.year || "").toString().trim(),
                };
            }
        } catch (e) {}
        return { regNo: "", currentYear: "" };
    }, []);

    const getSeenPhases = useCallback((regNo) => {
        try {
            return JSON.parse(localStorage.getItem(`trainingPhasesSeen_${regNo}`) || "[]");
        } catch {
            return [];
        }
    }, []);

    const closeToast = useCallback(() => {
        setIsClosing(true);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setTimeout(() => {
            setToast(null);
            setIsClosing(false);
            isShowingRef.current = false;
        }, 400);
    }, []);

    const poll = useCallback(async () => {
        if (isShowingRef.current) return;
        const { regNo, currentYear } = getStudentInfo();
        if (!regNo || !currentYear) return;

        try {
            const schedulesResponse = await mongoDBService.getScheduledTrainings().catch(() => []);
            const allSchedules = Array.isArray(schedulesResponse) ? schedulesResponse : [];
            const activeYear = normalizeYearToken(currentYear);
            const newPhaseEntries = [];
            const newSigs = [];

            allSchedules.forEach((schedule) => {
                const schedulePhases = Array.isArray(schedule?.phases) ? schedule.phases : [];
                schedulePhases.forEach((phase) => {
                    const phaseNumber = (phase?.phaseNumber || "").toString().trim();
                    if (!phaseNumber) return;
                    const phaseYear = normalizeYearToken(phase?.applicableYear || "");
                    if (activeYear && phaseYear && phaseYear !== activeYear) return;
                    const startDate = (phase?.startDate || schedule?.startDate || "").toString().trim();
                    const endDate = (phase?.endDate || schedule?.endDate || "").toString().trim();
                    const companyName = (schedule?.companyName || "").toString().trim();
                    const trainingName = (phase?.trainingName || "").toString().trim();
                    const sig = `${companyName}::${phaseNumber}::${trainingName}::${startDate}::${endDate}`;
                    newSigs.push(sig);
                    newPhaseEntries.push({ sig, phaseNumber, trainingName, companyName, startDate, endDate });
                });
            });

            const seenSigs = getSeenPhases(regNo);
            const unseenEntries = newPhaseEntries.filter((e) => !seenSigs.includes(e.sig));
            const allSigs = [...new Set([...seenSigs, ...newSigs])];
            localStorage.setItem(`trainingPhasesSeen_${regNo}`, JSON.stringify(allSigs));

            if (unseenEntries.length === 0) return;

            const best = unseenEntries.reduce((prev, cur) => {
                const prevNum = Number.parseInt((prev?.phaseNumber || "").toString(), 10);
                const curNum = Number.parseInt((cur?.phaseNumber || "").toString(), 10);
                if (Number.isNaN(prevNum)) return cur;
                if (Number.isNaN(curNum)) return prev;
                return curNum > prevNum ? cur : prev;
            });

            if (!best) return;
            isShowingRef.current = true;

            const normalizePhaseLocal = (val) => {
                const text = (val || "").toString().trim();
                const match = text.match(/\d+/);
                return match ? match[0] : text.toLowerCase();
            };

            const bestPhaseKey = normalizePhaseLocal(best.phaseNumber);
            const allCompaniesForPhase = newPhaseEntries
                .filter(e => normalizePhaseLocal(e.phaseNumber) === bestPhaseKey)
                .map(e => (e.companyName || "").toString().trim())
                .filter(Boolean);
            const combinedCompanyName = [...new Set(allCompaniesForPhase)].join(' / ') || best.companyName;

            const totalDays = getTotalDays(best.startDate, best.endDate);
            const endDateFormatted = formatDate(best.endDate);
            const startDateFormatted = formatDate(best.startDate);
            const subtitleParts = [
                best.trainingName,
                combinedCompanyName,
                startDateFormatted,
                endDateFormatted ? `End: ${endDateFormatted}` : "",
                totalDays > 0 ? `${totalDays} Days` : "",
            ].filter(Boolean);

            setToast({
                title: `Training Scheduled - Phase ${best.phaseNumber}`,
                subtitle: subtitleParts.join(" \u00B7 "),
            });

            toastTimerRef.current = setTimeout(() => { closeToast(); }, 6000);
        } catch (err) {
            console.error("GlobalTrainingChecker poll error:", err);
        }
    }, [getStudentInfo, getSeenPhases, closeToast]);

    useEffect(() => {
        let isActive = true;

        const runPoll = async () => {
            if (!isActive) return;
            if (isShowingRef.current) {
                pollingRef.current = setTimeout(runPoll, POLL_INTERVAL_MS);
                return;
            }

            await poll();

            if (isActive) {
                pollingRef.current = setTimeout(runPoll, POLL_INTERVAL_MS);
            }
        };

        pollingRef.current = setTimeout(runPoll, 1000);

        return () => {
            isActive = false;
            if (pollingRef.current) clearTimeout(pollingRef.current);
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        };
    }, [poll]);

    if (!toast) return null;

    return (
        <div className={`${styles.toastContainer} ${isClosing ? styles.toastSlideOut : ""}`}>
            <div className={styles.toast}>
                <div className={styles.toastIconWrapper}>
                    <svg className={styles.toastIcon} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                            d="M8.246 20.25h-6a1.5 1.5 0 0 1-1.5-1.5V2.25a1.5 1.5 0 0 1 1.5-1.5h15a1.5 1.5 0 0 1 1.5 1.5V9m-10.5-3.75h6m-9 4.5h9m-9 4.5h7.5m9.881.62L15 22.5l-3.75.75.75-3.75 7.127-7.127a2.25 2.25 0 0 1 3.004 3.252z" />
                    </svg>
                </div>
                <div className={styles.toastContent}>
                    <p className={styles.toastTitle}>{toast.title}</p>
                    <div className={styles.toastMarqueeWrapper}>
                        <span className={styles.toastMarqueeText}>{toast.subtitle}</span>
                    </div>
                </div>
                <button type="button" className={styles.toastCloseBtn} onClick={closeToast} aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default GlobalTrainingNotificationChecker;
