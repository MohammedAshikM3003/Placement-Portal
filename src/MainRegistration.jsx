import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import BlueAdminicon from './assets/BlueAdminicon.png'
import Navbar from "./components/Navbar/mrnavbar";
import Sidebar from "./components/Sidebar/mrsidebar";
import personalinfo from "./assets/personal information icon.svg";
import academicIcon from "./assets/academic.svg";
import semesterIcon from "./assets/semester.svg";
import otherDetailsIcon from "./assets/otherdetails.svg";
import logindetailsIcon from "./assets/logindetails.svg";
// Import CSS Module
import styles from "./MainRegistration.module.css";
import mongoDBService from './services/mongoDBService';

// Helper Icons
const MdUpload = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24" height="1em" width="1em"><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"></path></svg>);
const IoMdClose = () => (<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em"><path d="M289.94 256l95-95A24 24 0 00351 127l-95 95-95-95a24 24 0 00-34 34l95 95-95 95a24 24 0 1034 34l95-95 95 95a24 24 0 0034-34z"></path></svg>);
const GraduationCapIcon = () => (<img src={BlueAdminicon} alt="Graduation Cap" style={{ width: '100px', height: '90px', marginTop: '-20px' }} />);
const FileIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px", marginRight: "8px", color: "#555", flexShrink: 0 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>);
const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "18px", height: "18px", marginRight: "8px", color: "#555", flexShrink: 0 }}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>);

const cx = (...classNames) =>
  classNames
    .filter(Boolean)
    .map((name) => styles[name] || name)
    .join(" ");

const SuccessPopup = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={cx("mr-popup-overlay")}> 
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")}>Registered !</div>
        <div className={cx("mr-popup-body")}>
          <svg className={cx("mr-success-icon") } xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={cx("mr-success-icon--circle") } cx="26" cy="26" r="25" fill="none" />
            <path className={cx("mr-success-icon--check") } fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
          <h2>Login Created 🎉</h2>
          <p>Student ID Created!</p>
          <p>Click Login button to Redirect</p>
        </div>
        <div className={cx("mr-popup-footer")}> 
          <button
            onClick={() => {
              onClose();
              window.location.href = "/";
            }}
            className={cx("mr-popup-login-btn", "mr-popup-login-btn--primary")}
          >
            <span className={cx("mr-popup-login-btn__label")}>Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const ExistingRegNoPopup = ({ isOpen, onClose, regNo }) => {
  if (!isOpen) return null;

  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Registration Number Already Exists!
        </div>
        <div className={cx("mr-popup-body")}>
          <svg className={cx("mr-error-icon") } xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={cx("mr-error-icon--circle") } cx="26" cy="26" r="25" fill="none" />
            <path className={cx("mr-error-icon--cross") } fill="none" d="M16 16l20 20M36 16l-20 20" />
          </svg>
          <h2 style={{ color: "#000" }}>Registration Number Already Exists</h2>
          <p style={{ marginBottom: "8px" }}>
            Registration Number: <strong>{regNo}</strong>
          </p>
          <p style={{ marginBottom: "8px" }}>This registration number is already registered in our system.</p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            Please use a different registration number or contact support if you believe this is an error.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const MismatchedRegNoPopup = ({ isOpen, onClose, personalRegNo, loginRegNo }) => {
  if (!isOpen) return null;

  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Registration Numbers Don't Match!
        </div>
        <div className={cx("mr-popup-body")}>
          <svg className={cx("mr-error-icon") } xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <circle className={cx("mr-error-icon--circle") } cx="26" cy="26" r="25" fill="none" />
            <path className={cx("mr-error-icon--cross") } fill="none" d="M16 16l20 20M36 16l-20 20" />
          </svg>
          <h2 style={{ color: "#000" }}>Registration Numbers Don't Match ✗</h2>
          <p style={{ marginBottom: "8px" }}>
            Personal Info Registration: <strong>{personalRegNo}</strong>
          </p>
          <p style={{ marginBottom: "8px" }}>
            Login Registration: <strong>{loginRegNo}</strong>
          </p>
          <p style={{ marginBottom: "8px" }}>The login registration number must match the personal information registration number.</p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "10px" }}>
            Please enter the same registration number in both fields.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const FileSizeErrorPopup = ({ isOpen, onClose, fileSizeKB }) => {
  if (!isOpen) return null;

  return (
    <div className={cx("mr-popup-overlay")}>
      <div className={cx("mr-popup-container")}>
        <div className={cx("mr-popup-header")} style={{ backgroundColor: "#1976d2" }}>
          Image Too Large!
        </div>
        <div className={cx("mr-popup-body")}>
          <div className={cx("mr-image-error-icon-container")}>
            <svg
              className={cx("mr-image-error-icon")}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
            >
              <g fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                <path d="M15 8h.01M12.5 21H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v6.5" />
                <path d="m3 16 5-5c.928-.893 2.072-.893 3 0l3 3m0 0 1-1c.616-.593 1.328-.792 2.008-.598M16 19a3 3 0 1 0 6 0a3 3 0 1 0-6 0m1 2 4-4" />
              </g>
            </svg>
          </div>
          <h2 style={{ color: "#d32f2f" }}>Image Size Exceeded ✗</h2>
          <p style={{ marginBottom: "16px", marginTop: "20px" }}>
            Maximum allowed: <strong>500KB</strong>
          </p>
          <p style={{ marginBottom: "16px" }}>
            Your image size: <strong>{fileSizeKB}KB</strong>
          </p>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "20px", marginBottom: "10px" }}>
            Please compress your image or choose a smaller file.
          </p>
        </div>
        <div className={cx("mr-popup-footer")}>
          <button onClick={onClose} className={cx("mr-popup-close-btn-blue")}>OK</button>
        </div>
      </div>
    </div>
  );
};

const ImagePreviewModal = ({ src, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className={cx("mr-image-preview-overlay")} onClick={onClose}>
      <div className={cx("mr-image-preview-container")} onClick={(e) => e.stopPropagation()}>
        <img src={src} alt="Profile Preview" className={cx("mr-image-preview-content")} />
        <button onClick={onClose} className={cx("mr-image-preview-close-btn")}>&times;</button>
      </div>
    </div>
  );
};

function MainRegistration() {
  const sectionList = useMemo(
    () => [
      { key: "personal", label: "Personal Information", icon: personalinfo },
      { key: "academic", label: "Academic Background", icon: academicIcon },
      { key: "semester", label: "Semester", icon: semesterIcon },
      { key: "other", label: "Other Details", icon: otherDetailsIcon },
      { key: "login", label: "Login Details", icon: logindetailsIcon },
    ],
    []
  );

  const personalRef = useRef(null);
  const academicRef = useRef(null);
  const semesterRef = useRef(null);
  const otherRef = useRef(null);
  const loginRef = useRef(null);

  const sectionRefs = useMemo(
    () => ({
      personal: personalRef,
      academic: academicRef,
      semester: semesterRef,
      other: otherRef,
      login: loginRef,
    }),
    []
  );

  const formRef = useRef(null);
  const fileInputRef = useRef(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef(null);

  const [branches, setBranches] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [selectedDegree, setSelectedDegree] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");

  const selectedDegreeDetails = useMemo(() => {
    if (!selectedDegree) return null;
    return degrees.find((degree) => {
      const degreeValue = degree?.degreeAbbreviation || degree?.degreeFullName;
      return degreeValue === selectedDegree;
    }) || null;
  }, [degrees, selectedDegree]);

  const filteredBranches = useMemo(() => {
    if (!selectedDegree) return [];

    const selectedAbbreviation = selectedDegreeDetails?.degreeAbbreviation?.toUpperCase?.();
    const selectedFullName = selectedDegreeDetails?.degreeFullName?.toLowerCase?.();
    const fallbackValue = selectedDegree?.toLowerCase?.();

    return branches.filter((branch) => {
      const branchAbbreviation = branch?.degreeAbbreviation?.toUpperCase?.();
      const branchFullName = branch?.degreeFullName?.toLowerCase?.();

      if (selectedAbbreviation && branchAbbreviation) {
        if (branchAbbreviation === selectedAbbreviation) return true;
      }

      if (selectedFullName && branchFullName) {
        if (branchFullName === selectedFullName) return true;
      }

      if (!selectedDegreeDetails) {
        return (
          (branchAbbreviation && branchAbbreviation === selectedDegree?.toUpperCase?.()) ||
          (branchFullName && branchFullName === fallbackValue)
        );
      }

      return false;
    });
  }, [branches, selectedDegree, selectedDegreeDetails]);

  const getBranchOptionValue = useCallback((branch) => {
    if (!branch) return "";
    return (
      branch.branchAbbreviation ||
      branch.branchFullName ||
      branch.id ||
      branch._id ||
      ""
    );
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;
    const branchStillAvailable = filteredBranches.some((branch) => getBranchOptionValue(branch) === selectedBranch);
    if (!branchStillAvailable) {
      setSelectedBranch("");
    }
  }, [filteredBranches, selectedBranch, getBranchOptionValue]);

  const [activeSection, setActiveSection] = useState("personal");
  const [completedSections, setCompletedSections] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dob, setDob] = useState(null);
  const [studyCategory, setStudyCategory] = useState("12th");
  const [currentYear, setCurrentYear] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");
  const [isPopupOpen, setPopupOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [uploadInfo, setUploadInfo] = useState({ name: "", date: "" });
  const [isImagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isRegisterEnabled, setIsRegisterEnabled] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isExistingRegNoPopupOpen, setExistingRegNoPopupOpen] = useState(false);
  const [existingRegNo, setExistingRegNo] = useState("");
  const [isCheckingRegNo, setIsCheckingRegNo] = useState(false);
  const [isMismatchedRegNoPopupOpen, setMismatchedRegNoPopupOpen] = useState(false);
  const [personalRegNo, setPersonalRegNo] = useState("");
  const [loginRegNo, setLoginRegNo] = useState("");
  const [isFileSizeErrorOpen, setIsFileSizeErrorOpen] = useState(false);
  const [fileSizeErrorKB, setFileSizeErrorKB] = useState("");

  const fetchBranches = useCallback(async () => {
    try {
      const branchList = await mongoDBService.getBranches();
      const activeBranches = Array.isArray(branchList)
        ? branchList.filter((branch) => branch?.isActive !== false)
        : [];
      setBranches(activeBranches);
    } catch (error) {
      console.error("Failed to load branches:", error);
    }
  }, []);

  const fetchDegrees = useCallback(async () => {
    try {
      const degreeList = await mongoDBService.getDegrees();
      const activeDegrees = Array.isArray(degreeList)
        ? degreeList.filter((degree) => degree?.isActive !== false)
        : [];
      setDegrees(activeDegrees);
    } catch (error) {
      console.error("Failed to load degrees:", error);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
    fetchDegrees();
  }, [fetchBranches, fetchDegrees]);

  const generateBatchOptions = useCallback(() => {
    const currentYearValue = new Date().getFullYear();
    const startYear = currentYearValue - 5;
    const endYear = currentYearValue + 5;
    const batches = [];

    for (let year = startYear; year <= endYear; year += 1) {
      const batchEnd = year + 4;
      batches.push({ value: `${year}-${batchEnd}`, label: `${year}-${batchEnd}` });
    }

    return batches;
  }, []);

  useEffect(() => {
    const dashboard = document.getElementById("mr-dashboard-area");
    if (!dashboard) return undefined;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const dashRect = dashboard.getBoundingClientRect();
      let bestFit = null;
      let smallestDistance = Infinity;

      sectionList.forEach(({ key }) => {
        const ref = sectionRefs[key];
        if (ref?.current) {
          const rect = ref.current.getBoundingClientRect();
          if (rect.bottom >= dashRect.top && rect.top <= dashRect.bottom) {
            const distance = Math.abs(rect.top - dashRect.top);
            if (distance < smallestDistance) {
              smallestDistance = distance;
              bestFit = key;
            }
          }
        }
      });

      if (bestFit) setActiveSection(bestFit);
    };

    dashboard.addEventListener("scroll", handleScroll, { passive: true });
    return () => dashboard.removeEventListener("scroll", handleScroll);
  }, [sectionRefs, sectionList]);

  const getRequiredGPAFields = useCallback(() => {
    if (!currentYear || !currentSemester) return [];

    if (currentYear === "IV" && currentSemester === "8") {
      return Array.from({ length: 7 }, (_, index) => `semester${index + 1}GPA`);
    }

    const semesterNum = parseInt(currentSemester, 10);
    return Array.from({ length: semesterNum - 1 }, (_, index) => `semester${index + 1}GPA`);
  }, [currentYear, currentSemester]);

  const checkSectionComplete = useCallback(
    (key) => {
      const sectionRef = sectionRefs[key]?.current;
      if (!sectionRef) return false;

      if (key === "semester") {
        if (!currentYear || !currentSemester) return false;
        return getRequiredGPAFields().every((fieldName) => {
          const input = sectionRef.querySelector(`input[name="${fieldName}"]`);
          return input && input.value.trim() !== "";
        });
      }

      if (key === "academic") {
        if (!studyCategory) return false;

        const alwaysRequired = ["tenthInstitution", "tenthBoard", "tenthPercentage", "tenthYear"];
        const twelfthRequired = studyCategory === "12th" || studyCategory === "both"
          ? ["twelfthInstitution", "twelfthBoard", "twelfthPercentage", "twelfthYear", "twelfthCutoff"]
          : [];
        const diplomaRequired = studyCategory === "diploma" || studyCategory === "both"
          ? ["diplomaInstitution", "diplomaBranch", "diplomaPercentage", "diplomaYear"]
          : [];

        const requiredSelectors = [...alwaysRequired, ...twelfthRequired, ...diplomaRequired];
        return requiredSelectors.every((fieldName) => {
          const input = sectionRef.querySelector(`input[name="${fieldName}"], select[name="${fieldName}"]`);
          return input && input.value.trim() !== "";
        });
      }

      const requiredInputs = sectionRef.querySelectorAll("input[required], select[required]");
      if (!requiredInputs.length) return false;

      const seenRadio = new Set();
      for (const input of requiredInputs) {
        if (input.type === "radio") {
          if (seenRadio.has(input.name)) continue;
          const radios = sectionRef.querySelectorAll(`input[type="radio"][name="${input.name}"]`);
          const checked = Array.from(radios).some((radio) => radio.checked);
          seenRadio.add(input.name);
          if (!checked) return false;
        } else if (!input.value || input.value.trim() === "") {
          return false;
        }
      }

      return true;
    },
    [sectionRefs, currentYear, currentSemester, studyCategory, getRequiredGPAFields]
  );

  const validateAllFields = useCallback(() => {
    if (!formRef.current) return { isValid: false, errors: ["Form not ready"] };

    const formData = new FormData(formRef.current);
    const errors = [];

    const requiredFields = {
      firstName: "First Name",
      lastName: "Last Name",
      regNo: "Registration Number",
      batch: "Batch",
      degree: "Degree",
      branch: "Branch",
      section: "Section",
      gender: "Gender",
      primaryEmail: "Primary Email",
      domainEmail: "Domain Email",
      mobileNo: "Mobile Number",
      fatherName: "Father Name",
      motherName: "Mother Name",
      community: "Community",
      aadhaarNo: "Aadhaar Number",
      mediumOfStudy: "Medium of Study",
      residentialStatus: "Residential Status",
      quota: "Quota",
      firstGraduate: "First Graduate",
      skillSet: "Skill Set",
      rationCardNo: "Ration Card Number",
      familyAnnualIncome: "Family Annual Income",
      panNo: "PAN Number",
      loginRegNo: "Login Registration Number",
      loginPassword: "Login Password",
      confirmPassword: "Confirm Password",
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      const value = formData.get(field);
      if (!value || value.trim() === "") errors.push(`${label} is required`);
    });

    if (!dob) errors.push("Date of Birth is required");

    const regNo = formData.get("regNo");
    if (regNo && !/^\d{11}$/.test(regNo)) errors.push("Registration number must be exactly 11 digits");

    const dobFormatted = dob ? dob.toLocaleDateString("en-GB").replace(/\//g, "") : "";
    if (dob && !/^\d{8}$/.test(dobFormatted)) errors.push("Please select a valid date of birth");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const primaryEmail = formData.get("primaryEmail");
    const domainEmail = formData.get("domainEmail");
    if (primaryEmail && !emailRegex.test(primaryEmail)) errors.push("Primary email format is invalid");
    if (domainEmail && !emailRegex.test(domainEmail)) errors.push("Domain email format is invalid");

    const mobileNo = formData.get("mobileNo");
    if (mobileNo && !/^\d{10}$/.test(mobileNo)) errors.push("Mobile number must be exactly 10 digits");

    const motherMobile = formData.get("motherMobile");
    if (motherMobile && !/^\d{10}$/.test(motherMobile)) errors.push("Mother mobile number must be exactly 10 digits");

    const loginRegNoValue = formData.get("loginRegNo");
    const loginPassword = formData.get("loginPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (loginRegNoValue !== regNo) errors.push("Login registration number must match the main registration number");
    if (dobFormatted && loginPassword !== dobFormatted) errors.push("Login password must be your date of birth in DDMMYYYY format");
    if (confirmPassword !== loginPassword) errors.push("Password confirmation does not match");

    if (studyCategory === "12th" || studyCategory === "both") {
      const twelfthFields = {
        twelfthInstitution: "12th Institution Name",
        twelfthBoard: "12th Board/University",
        twelfthPercentage: "12th Percentage",
        twelfthYear: "12th Year of Passing",
        twelfthCutoff: "12th Cut-off Marks",
      };
      Object.entries(twelfthFields).forEach(([field, label]) => {
        const value = formData.get(field);
        if (!value || value.trim() === "") errors.push(`${label} is required`);
      });
    }

    if (studyCategory === "diploma" || studyCategory === "both") {
      const diplomaFields = {
        diplomaInstitution: "Diploma Institution",
        diplomaBranch: "Diploma Branch",
        diplomaPercentage: "Diploma Percentage",
        diplomaYear: "Diploma Year of Passing",
      };
      Object.entries(diplomaFields).forEach(([field, label]) => {
        const value = formData.get(field);
        if (!value || value.trim() === "") errors.push(`${label} is required`);
      });
    }

    const tenthFields = {
      tenthInstitution: "10th Institution Name",
      tenthBoard: "10th Board/University",
      tenthPercentage: "10th Percentage",
      tenthYear: "10th Year of Passing",
    };
    Object.entries(tenthFields).forEach(([field, label]) => {
      const value = formData.get(field);
      if (!value || value.trim() === "") errors.push(`${label} is required`);
    });

    const currentYearValue = currentYear || formData.get("currentYear");
    const currentSemesterValue = currentSemester || formData.get("currentSemester");
    if (!currentYearValue) errors.push("Current Year is required");
    if (!currentSemesterValue) errors.push("Current Semester is required");

    getRequiredGPAFields().forEach((field) => {
      const value = formData.get(field);
      if (!value || value.trim() === "") {
        const semesterNumber = field.replace("semester", "").replace("GPA", "");
        errors.push(`Semester ${semesterNumber} GPA is required`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }, [currentYear, currentSemester, dob, studyCategory, getRequiredGPAFields]);

  const handleInputChange = useCallback(() => {
    const updated = {};
    sectionList.forEach(({ key }) => {
      updated[key] = checkSectionComplete(key);
    });
    setCompletedSections(updated);

    const validation = validateAllFields();
    setIsRegisterEnabled(validation.isValid);
    setValidationErrors(validation.errors);
  }, [sectionList, checkSectionComplete, validateAllFields]);

  useEffect(() => {
    handleInputChange();
  }, [handleInputChange, profileImage, currentYear, currentSemester, studyCategory]);

  const getAvailableSemesters = useCallback((year) => {
    const semesterMap = {
      I: ["1", "2"],
      II: ["3", "4"],
      III: ["5", "6"],
      IV: ["7", "8"],
    };
    return semesterMap[year] || [];
  }, []);

  const getAllGPAFields = useCallback(() => {
    if (!currentYear || !currentSemester) return [];
    if (currentYear === "IV" && currentSemester === "8") {
      return Array.from({ length: 8 }, (_, index) => `semester${index + 1}GPA`);
    }

    const semesterNum = parseInt(currentSemester, 10);
    return Array.from({ length: semesterNum }, (_, index) => `semester${index + 1}GPA`);
  }, [currentYear, currentSemester]);

  const handleSidebarClick = useCallback(
    (key) => {
      isScrollingRef.current = true;
      setActiveSection(key);
      const ref = sectionRefs[key];

      if (ref?.current) {
        const scrollToSection = () => {
          const sectionElement = ref.current;
          sectionElement.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });

          setTimeout(() => {
            const rect = sectionElement.getBoundingClientRect();
            const headerHeight = 65;
            const targetPosition = window.pageYOffset + rect.top - headerHeight - 20;
            window.scrollTo({ top: targetPosition, behavior: "smooth" });
          }, 200);
        };

        setTimeout(scrollToSection, 100);

        if (window.innerWidth <= 992) {
          setTimeout(() => setIsSidebarOpen(false), 300);
        }

        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = setTimeout(() => {
          isScrollingRef.current = false;
        }, 600);
      } else if (window.innerWidth <= 992) {
        setIsSidebarOpen(false);
      }
    },
    [sectionRefs]
  );

  const handleImageUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.type !== "image/jpeg") {
        alert("Invalid file type. Please upload a JPG file.");
        return;
      }

      const maxSize = 500 * 1024;
      const sizeKB = (file.size / 1024).toFixed(1);
      if (file.size > maxSize) {
        setFileSizeErrorKB(sizeKB);
        setIsFileSizeErrorOpen(true);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64String = loadEvent.target?.result;
        if (typeof base64String === "string") {
          setProfileImage(base64String);
          setUploadInfo({ name: file.name, date: new Date().toLocaleDateString("en-GB") });
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 5000);
          setTimeout(handleInputChange, 0);
        }
      };
      reader.readAsDataURL(file);
    },
    [handleInputChange]
  );

  const handleImageRemove = useCallback(
    (event) => {
      if (event?.preventDefault) event.preventDefault();
      setProfileImage(null);
      setUploadInfo({ name: "", date: "" });
      setUploadSuccess(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(handleInputChange, 0);
    },
    [handleInputChange]
  );

  const checkRegistrationNumberExists = useCallback(
    async (regNo) => {
      if (!regNo || regNo.length !== 11) return false;
      try {
        setIsCheckingRegNo(true);
        return await mongoDBService.checkStudentExists(regNo);
      } catch (error) {
        console.error("Error checking registration number:", error);
        return false;
      } finally {
        setIsCheckingRegNo(false);
      }
    },
    []
  );

  const handleRegNoBlur = useCallback(
    async (event) => {
      const regNoValue = event.target.value.trim();
      if (regNoValue.length === 11 && /^\d{11}$/.test(regNoValue)) {
        const exists = await checkRegistrationNumberExists(regNoValue);
        if (exists) {
          setExistingRegNo(regNoValue);
          setExistingRegNoPopupOpen(true);
          event.target.value = "";
          event.target.focus();
        }
      }
    },
    [checkRegistrationNumberExists]
  );

  const handleLoginRegNoBlur = useCallback(
    (event) => {
      const loginRegNoValue = event.target.value.trim();
      const personalRegNoValue = formRef.current?.querySelector('input[name="regNo"]').value.trim() || "";
      if (
        loginRegNoValue.length === 11 &&
        personalRegNoValue.length === 11 &&
        /^\d{11}$/.test(loginRegNoValue) &&
        /^\d{11}$/.test(personalRegNoValue) &&
        loginRegNoValue !== personalRegNoValue
      ) {
        setPersonalRegNo(personalRegNoValue);
        setLoginRegNo(loginRegNoValue);
        setMismatchedRegNoPopupOpen(true);
        event.target.value = "";
        event.target.focus();
      }
    },
    []
  );

  const handleSave = useCallback(
    async (event) => {
      event.preventDefault();
      setIsRegistering(true);

      try {
        const formData = new FormData(event.target);
        const regNoValue = formData.get("regNo") || "";
        const loginRegNoValue = formData.get("loginRegNo") || "";
        const loginPassword = formData.get("loginPassword") || "";
        const confirmPassword = formData.get("confirmPassword") || "";
        const dobFormatted = dob ? dob.toLocaleDateString("en-GB").replace(/\//g, "") : "";

        const invalidMessages = [];
        if (!/^\d{11}$/.test(regNoValue)) invalidMessages.push("Registration number must be exactly 11 digits");
        if (!/^\d{8}$/.test(dobFormatted)) invalidMessages.push("Please select a valid date of birth");
        if (loginRegNoValue !== regNoValue) invalidMessages.push("Login registration number must match the main registration number");
        if (loginPassword !== dobFormatted) invalidMessages.push("Login password must be your date of birth in DDMMYYYY format");
        if (confirmPassword !== loginPassword) invalidMessages.push("Password confirmation does not match");

        if (invalidMessages.length) {
          alert(invalidMessages.join("\n"));
          return;
        }

        const existingStudent = await mongoDBService.getStudentByRegNoAndDob(regNoValue, dobFormatted).catch((error) => {
          if (error.message.includes("Student not found")) return null;
          throw error;
        });

        if (existingStudent) {
          alert(`Registration number already exists. Please use a different registration number.\n\nFound student ID: ${existingStudent.id}`);
          return;
        }

        const studentData = {
          regNo: regNoValue,
          dob: dobFormatted,
          firstName: formData.get("firstName") || "",
          lastName: formData.get("lastName") || "",
          batch: formData.get("batch") || "",
          degree: formData.get("degree") || "",
          branch: formData.get("branch") || "",
          currentYear: currentYear || formData.get("currentYear") || "",
          currentSemester: currentSemester || formData.get("currentSemester") || "",
          section: formData.get("section") || "",
          gender: formData.get("gender") || "",
          address: formData.get("address") || "",
          city: formData.get("city") || "",
          primaryEmail: formData.get("primaryEmail") || "",
          domainEmail: formData.get("domainEmail") || "",
          mobileNo: formData.get("mobileNo") || "",
          fatherName: formData.get("fatherName") || "",
          fatherOccupation: formData.get("fatherOccupation") || "",
          fatherMobile: formData.get("fatherMobile") || "",
          motherName: formData.get("motherName") || "",
          motherOccupation: formData.get("motherOccupation") || "",
          motherMobile: formData.get("motherMobile") || "",
          guardianName: formData.get("guardianName") || "",
          guardianMobile: formData.get("guardianMobile") || "",
          community: formData.get("community") || "",
          bloodGroup: formData.get("bloodGroup") || "",
          aadhaarNo: formData.get("aadhaarNo") || "",
          mediumOfStudy: formData.get("mediumOfStudy") || "",
          studyCategory,
          tenthInstitution: formData.get("tenthInstitution") || "",
          tenthBoard: formData.get("tenthBoard") || "",
          tenthPercentage: formData.get("tenthPercentage") || "",
          tenthYear: formData.get("tenthYear") || "",
          twelfthInstitution: formData.get("twelfthInstitution") || "",
          twelfthBoard: formData.get("twelfthBoard") || "",
          twelfthPercentage: formData.get("twelfthPercentage") || "",
          twelfthYear: formData.get("twelfthYear") || "",
          twelfthCutoff: formData.get("twelfthCutoff") || "",
          diplomaInstitution: formData.get("diplomaInstitution") || "",
          diplomaBranch: formData.get("diplomaBranch") || "",
          diplomaPercentage: formData.get("diplomaPercentage") || "",
          diplomaYear: formData.get("diplomaYear") || "",
          semester1GPA: formData.get("semester1GPA") || "",
          semester2GPA: formData.get("semester2GPA") || "",
          semester3GPA: formData.get("semester3GPA") || "",
          semester4GPA: formData.get("semester4GPA") || "",
          semester5GPA: formData.get("semester5GPA") || "",
          semester6GPA: formData.get("semester6GPA") || "",
          semester7GPA: formData.get("semester7GPA") || "",
          semester8GPA: formData.get("semester8GPA") || "",
          overallCGPA: formData.get("overallCGPA") || "",
          clearedBacklogs: formData.get("clearedBacklogs") || "",
          currentBacklogs: formData.get("currentBacklogs") || "",
          yearOfGap: formData.get("yearOfGap") || "",
          gapReason: formData.get("gapReason") || "",
          residentialStatus: formData.get("residentialStatus") || "",
          quota: formData.get("quota") || "",
          languagesKnown: formData.get("languagesKnown") || "",
          firstGraduate: formData.get("firstGraduate") || "",
          passportNo: formData.get("passportNo") || "",
          skillSet: formData.get("skillSet") || "",
          valueAddedCourses: formData.get("valueAddedCourses") || "",
          aboutSibling: formData.get("aboutSibling") || "",
          rationCardNo: formData.get("rationCardNo") || "",
          familyAnnualIncome: formData.get("familyAnnualIncome") || "",
          panNo: formData.get("panNo") || "",
          willingToSignBond: formData.get("willingToSignBond") || "",
          preferredModeOfDrive: formData.get("preferredModeOfDrive") || "",
          githubLink: formData.get("githubLink") || "",
          linkedinLink: formData.get("linkedinLink") || "",
          companyTypes: formData.get("companyTypes") || "",
          preferredJobLocation: formData.get("preferredJobLocation") || "",
          profilePicURL: profileImage || "",
          profileUploadDate: uploadInfo.date || new Date().toLocaleDateString("en-GB"),
          loginRegNo: loginRegNoValue,
          loginPassword,
        };

        await mongoDBService.createStudent(studentData);

        setTimeout(() => {
          setPopupOpen(true);
          setIsRegistering(false);
        }, 1000);
      } catch (error) {
        console.error("Error saving student data:", error);
        alert(`Error saving data: ${error.message}. Check console for details.`);
      } finally {
        setIsRegistering(false);
      }
    },
    [currentYear, currentSemester, dob, profileImage, studyCategory, uploadInfo]
  );

  const handleDiscard = useCallback(() => {
    if (formRef.current) {
      formRef.current.reset();
      setStudyCategory("12th");
      setDob(null);
      setCurrentYear("");
      setCurrentSemester("");
      setSelectedDegree("");
      setSelectedBranch("");
      handleImageRemove();
      handleInputChange();
    }
  }, [handleImageRemove, handleInputChange]);

  const closePopup = useCallback(() => setPopupOpen(false), []);
  const closeExistingRegNoPopup = useCallback(() => setExistingRegNoPopupOpen(false), []);
  const closeMismatchedRegNoPopup = useCallback(() => setMismatchedRegNoPopupOpen(false), []);
  const closeFileSizeErrorPopup = useCallback(() => setIsFileSizeErrorOpen(false), []);

  return (
    <div className={cx("mr-page-wrapper")}>
      <div className={cx("mr-container")}>
        <Navbar onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <div className={cx("mr-main")}>
          <Sidebar
            isOpen={isSidebarOpen}
            currentView={activeSection}
            completedSections={completedSections}
            onViewChange={handleSidebarClick}
          />
          <div className={cx("mr-dashboard-area")} id="mr-dashboard-area">
            <form ref={formRef} onSubmit={handleSave} onChange={handleInputChange}>
              <div className={cx("mr-profile-section-container")} ref={sectionRefs.personal}>
                <h3 className={cx("mr-section-header")}>Personal Information</h3>
                <div className={cx("mr-form-grid")}>
                  <div className={cx("mr-personal-info-fields")}>
                    <input type="text" name="firstName" placeholder="First Name *" required />
                    <input type="text" name="lastName" placeholder="Last Name *" required />
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        name="regNo"
                        placeholder="Register Number (11 digits) *"
                        maxLength="11"
                        onBlur={handleRegNoBlur}
                        required
                      />
                      {isCheckingRegNo && <div className={cx("mr-regno-checking-spinner")} />}
                    </div>
                    <select name="batch" defaultValue="" required>
                      <option value="" disabled>
                        Batch *
                      </option>
                      {generateBatchOptions().map((batch) => (
                        <option key={batch.value} value={batch.value}>
                          {batch.label}
                        </option>
                      ))}
                    </select>
                    <div className="StuProfile-datepicker-wrapper">
                      <DatePicker
                        selected={dob}
                        onChange={(date) => setDob(date)}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="DOB*"
                        className="StuProfile-datepicker-input"
                        wrapperClassName="StuProfile-datepicker-wrapper-inner"
                        showPopperArrow={false}
                        required
                      />
                    </div>
                    <select
                      name="degree"
                      value={selectedDegree}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedDegree(value);
                        setSelectedBranch('');
                      }}
                      required
                    >
                      <option value="" disabled>
                        Degree *
                      </option>
                      {degrees.map((degree) => {
                        const value = degree.degreeAbbreviation || degree.degreeFullName;
                        const label = degree.degreeFullName
                          ? degree.degreeAbbreviation
                            ? `${degree.degreeFullName} (${degree.degreeAbbreviation})`
                            : degree.degreeFullName
                          : value;
                        return (
                          <option key={degree.id || degree._id || value} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      name="branch"
                      value={selectedBranch}
                      onChange={(event) => {
                        setSelectedBranch(event.target.value);
                      }}
                      required
                      disabled={!selectedDegree}
                    >
                      <option value="" disabled>
                        {selectedDegree ? 'Branch *' : 'Select Degree First'}
                      </option>
                      {filteredBranches.map((branch) => {
                        const value = getBranchOptionValue(branch);
                        const label = branch.branchFullName
                          ? branch.branchAbbreviation
                            ? `${branch.branchFullName} (${branch.branchAbbreviation})`
                            : branch.branchFullName
                          : value;
                        return (
                          <option key={branch.id || branch._id || value} value={value}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
                    <select
                      name="currentYear"
                      value={currentYear}
                      onChange={(event) => {
                        const newYear = event.target.value;
                        setCurrentYear(newYear);
                        const semesters = getAvailableSemesters(newYear);
                        setCurrentSemester(semesters[0] || "");
                        setTimeout(handleInputChange, 100);
                      }}
                      required
                    >
                      <option value="" disabled>
                        Current Year *
                      </option>
                      <option value="I">I</option>
                      <option value="II">II</option>
                      <option value="III">III</option>
                      <option value="IV">IV</option>
                    </select>
                    <select
                      name="currentSemester"
                      value={currentSemester}
                      onChange={(event) => {
                        setCurrentSemester(event.target.value);
                        setTimeout(handleInputChange, 100);
                      }}
                      required
                      disabled={!currentYear}
                    >
                      <option value="" disabled>
                        {currentYear ? "Current Semester *" : "Select Year First"}
                      </option>
                      {getAvailableSemesters(currentYear).map((semesterOption) => (
                        <option key={semesterOption} value={semesterOption}>
                          {semesterOption}
                        </option>
                      ))}
                    </select>
                    <select name="section" defaultValue="" required>
                      <option value="" disabled>
                        Section *
                      </option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <select name="gender" defaultValue="" required>
                      <option value="" disabled>
                        Gender *
                      </option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                    <input type="text" name="address" placeholder="Address" />
                    <input type="text" name="city" placeholder="City" />
                    <input type="email" name="primaryEmail" placeholder="Primary Email *" required />
                    <input type="email" name="domainEmail" placeholder="Domain Email *" required />
                    <input type="tel" name="mobileNo" placeholder="Mobile No. *" required />
                    <input type="text" name="fatherName" placeholder="Father Name *" required />
                    <input type="text" name="fatherOccupation" placeholder="Father Occupation" />
                    <input type="text" name="fatherMobile" placeholder="Father Mobile No." />
                    <input type="text" name="motherName" placeholder="Mother Name *" required />
                    <input type="text" name="motherOccupation" placeholder="Mother Occupation" />
                    <input type="text" name="motherMobile" placeholder="Mother Mobile No." />
                    <input type="text" name="guardianName" placeholder="Guardian Name" />
                    <input type="text" name="guardianMobile" placeholder="Guardian Number" />
                    <input type="text" name="aadhaarNo" placeholder="Aadhaar Number *" required />
                  </div>
                  <div className={cx("mr-profile-photo-wrapper")}>
                    <div className={cx("mr-profile-photo-box")} style={{ height: "675px" }}>
                      <h3 className={cx("mr-section-header")}>Profile Photo</h3>
                      <div className={cx("mr-profile-icon-container")}>
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile Preview"
                            className={cx("mr-profile-preview-img")}
                            onClick={() => setImagePreviewOpen(true)}
                          />
                        ) : (
                          <GraduationCapIcon />
                        )}
                      </div>
                      {profileImage && uploadInfo.name && (
                        <div className={cx("mr-upload-info-container")}>
                          <div className={cx("mr-upload-info-item")}>
                            <FileIcon />
                            <span>{uploadInfo.name}</span>
                          </div>
                          <div className={cx("mr-upload-info-item")}>
                            <CalendarIcon />
                            <span>Uploaded on: {uploadInfo.date}</span>
                          </div>
                        </div>
                      )}
                      <div className={cx("mr-upload-action-area")}>
                        <div className={cx("mr-upload-btn-wrapper")}>
                          <label htmlFor="photo-upload-input" className={cx("mr-profile-upload-btn")}>
                            <div className={cx("mr-upload-btn-content")}>
                              <MdUpload /> <span>Upload (Max 500 KB)</span>
                            </div>
                          </label>
                          {profileImage && (
                            <button onClick={handleImageRemove} className={cx("mr-remove-image-btn")} aria-label="Remove image">
                              <IoMdClose />
                            </button>
                          )}
                        </div>
                        <input
                          type="file"
                          id="photo-upload-input"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          accept="image/jpeg"
                          onChange={handleImageUpload}
                        />
                        {uploadSuccess && <p className={cx("mr-upload-success-message")}>Profile Photo uploaded Successfully!</p>}
                        <p className={cx("mr-upload-hint")}>*Only JPG allowed.</p>
                      </div>
                    </div>
                    <div style={{ marginTop: "24px" }}>
                      <select name="community" defaultValue="" required>
                        <option value="" disabled>
                          Community *
                        </option>
                        <option value="OC">OC</option>
                        <option value="BC">BC</option>
                        <option value="BCM">BCM</option>
                        <option value="MBC">MBC</option>
                        <option value="SC">SC</option>
                        <option value="SCA">SCA</option>
                        <option value="ST">ST</option>
                      </select>
                    </div>
                    <div style={{ marginTop: "24px" }}>
                      <select name="mediumOfStudy" defaultValue="" required>
                        <option value="" disabled>
                          Medium *
                        </option>
                        <option value="English">English</option>
                        <option value="Tamil">Tamil</option>
                        <option value="Other">Others</option>
                      </select>
                    </div>
                    <div style={{ marginTop: "24px" }}>
                      <input type="text" name="bloodGroup" placeholder="Blood Group" />
                    </div>
                  </div>
                </div>
              </div>

              <div className={cx("mr-profile-section-container")} ref={sectionRefs.academic}>
                <h3 className={cx("mr-section-header")}>Academic Background</h3>
                <div className={cx("mr-form-grid")}>
                  <div className={cx("mr-study-category")} style={{ gridColumn: "1 / -1" }}>
                    <input
                      type="radio"
                      id="12th"
                      name="study_category"
                      value="12th"
                      checked={studyCategory === "12th"}
                      onChange={(event) => setStudyCategory(event.target.value)}
                    />
                    <label htmlFor="12th">12th</label>
                    <input
                      type="radio"
                      id="diploma"
                      name="study_category"
                      value="diploma"
                      checked={studyCategory === "diploma"}
                      onChange={(event) => setStudyCategory(event.target.value)}
                    />
                    <label htmlFor="diploma">Diploma</label>
                    <input
                      type="radio"
                      id="both"
                      name="study_category"
                      value="both"
                      checked={studyCategory === "both"}
                      onChange={(event) => setStudyCategory(event.target.value)}
                    />
                    <label htmlFor="both">Both</label>
                  </div>
                  <input type="text" name="tenthInstitution" placeholder="10th Institution Name *" required />
                  <select name="tenthBoard" defaultValue="" required>
                    <option value="" disabled>
                      10th Board *
                    </option>
                    <option value="State Board">State Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                    <option value="Other State Board">Other State Board</option>
                  </select>
                  <input type="text" name="tenthPercentage" placeholder="10th Percentage *" required />
                  <input type="text" name="tenthYear" placeholder="10th Year of Passing *" required />
                  {(studyCategory === "12th" || studyCategory === "both") && (
                    <>
                      <input type="text" name="twelfthInstitution" placeholder="12th Institution Name *" required />
                      <select name="twelfthBoard" defaultValue="" required>
                        <option value="" disabled>
                          12th Board *
                        </option>
                        <option value="State Board">State Board</option>
                        <option value="CBSE">CBSE</option>
                        <option value="ICSE">ICSE</option>
                        <option value="Other State Board">Other State Board</option>
                      </select>
                      <input type="text" name="twelfthPercentage" placeholder="12th Percentage *" required />
                      <input type="text" name="twelfthYear" placeholder="12th Year *" required />
                      <input type="text" name="twelfthCutoff" placeholder="12th Cut-off *" required />
                    </>
                  )}
                  {(studyCategory === "diploma" || studyCategory === "both") && (
                    <>
                      <input type="text" name="diplomaInstitution" placeholder="Diploma Institution *" required />
                      <input type="text" name="diplomaBranch" placeholder="Diploma Branch *" required />
                      <input type="text" name="diplomaPercentage" placeholder="Diploma Percentage *" required />
                      <input type="text" name="diplomaYear" placeholder="Diploma Year *" required />
                    </>
                  )}
                </div>
              </div>

              <div className={cx("mr-profile-section-container")} ref={sectionRefs.semester}>
                <h3 className={cx("mr-section-header")}>Semester</h3>
                <div className={cx("mr-form-grid")}>
                  {getAllGPAFields().map((field) => {
                    const isRequired = getRequiredGPAFields().includes(field);
                    const semesterLabel = field.replace(/\D/g, "");
                    return (
                      <input
                        key={field}
                        type="text"
                        name={field}
                        placeholder={`Semester ${semesterLabel} GPA ${isRequired ? "*" : ""}`}
                        required={isRequired}
                      />
                    );
                  })}
                  <input type="text" name="overallCGPA" placeholder="Overall CGPA" />
                  <input type="text" name="clearedBacklogs" placeholder="No. of Backlogs (Cleared)" />
                  <input type="text" name="currentBacklogs" placeholder="No. of Current Backlogs" />
                  <input type="text" name="yearOfGap" placeholder="Year of Gap" />
                  <input type="text" name="gapReason" placeholder="Reason for Gap" />
                </div>
              </div>

              <div className={cx("mr-profile-section-container")} ref={sectionRefs.other}>
                <h3 className={cx("mr-section-header")}>Other Details</h3>
                <div className={cx("mr-form-grid")}>
                  <select name="residentialStatus" defaultValue="" required>
                    <option value="" disabled>
                      Residential status *
                    </option>
                    <option value="Hosteller">Hosteller</option>
                    <option value="Dayscholar">Dayscholar</option>
                  </select>
                  <select name="quota" defaultValue="" required>
                    <option value="" disabled>
                      Quota *
                    </option>
                    <option value="Management">Management</option>
                    <option value="Counselling">Counselling</option>
                  </select>
                  <input type="text" name="languagesKnown" placeholder="Languages Known" />
                  <select name="firstGraduate" defaultValue="" required>
                    <option value="" disabled>
                      First Graduate *
                    </option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <input type="text" name="passportNo" placeholder="Passport No." />
                  <input type="text" name="skillSet" placeholder="Skill set *" required />
                  <input type="text" name="valueAddedCourses" placeholder="Value Added Courses" />
                  <input type="text" name="aboutSibling" placeholder="About Sibling" />
                  <input type="text" name="rationCardNo" placeholder="Ration card No. *" required />
                  <input type="text" name="familyAnnualIncome" placeholder="Family Annual Income *" required />
                  <input type="text" name="panNo" placeholder="PAN No. *" required />
                  <select name="willingToSignBond" defaultValue="">
                    <option value="" disabled>
                      Willing to Sign Bond
                    </option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                  <select name="preferredModeOfDrive" defaultValue="">
                    <option value="" disabled>
                      Preferred Mode
                    </option>
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                  <input type="text" name="githubLink" placeholder="GitHub Link" />
                  <input type="text" name="linkedinLink" placeholder="LinkedIn Profile Link" />
                  <select name="companyTypes" defaultValue="">
                    <option value="" disabled>
                      Company Type
                    </option>
                    <option value="IT">IT</option>
                    <option value="Non-IT">Non-IT</option>
                    <option value="MNC">MNC</option>
                    <option value="Startup">Startup</option>
                  </select>
                  <select name="preferredJobLocation" defaultValue="">
                    <option value="" disabled>
                      Job Location
                    </option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="North India">North India</option>
                  </select>
                </div>
              </div>

              <div className={cx("mr-profile-section-container")} ref={sectionRefs.login}>
                <h3 className={cx("mr-section-header")}>Login Details</h3>
                <div className={cx("mr-form-grid")}>
                  <input
                    type="text"
                    name="loginRegNo"
                    placeholder="Register No (11 digits) *"
                    maxLength="11"
                    onBlur={handleLoginRegNoBlur}
                    required
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      type={showLoginPassword ? "text" : "password"}
                      name="loginPassword"
                      placeholder="Password (DDMMYYYY) *"
                      required
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      className={cx("password-toggle-btn")}
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                    >
                      {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="Confirm Password *"
                      required
                      style={{ paddingRight: "40px" }}
                    />
                    <button
                      type="button"
                      className={cx("password-toggle-btn")}
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={cx("mr-action-buttons")}>
                <button type="button" className={cx("mr-discard-btn")} onClick={handleDiscard}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={cx("mr-save-btn", !isRegisterEnabled ? "mr-save-btn-disabled" : "")}
                  disabled={!isRegisterEnabled || isRegistering}
                  onClick={(event) => {
                    if (!isRegisterEnabled) {
                      event.preventDefault();
                      alert(`Please complete required fields:\n${validationErrors.slice(0, 5).join("\n")}`);
                    }
                  }}
                >
                  {isRegistering ? (
                    <>
                      <div className={cx("mr-loading-spinner")} />
                      Registering...
                    </>
                  ) : (
                    "Register"
                  )}
                </button>
              </div>

              {validationErrors.length > 0 && (
                <div className={styles.validationErrorBox}>
                  <h4>⚠️ Required Fields Missing:</h4>
                  <ul>
                    {validationErrors.slice(0, 5).map((error, index) => (
                      <li key={error + index}>{error}</li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li style={{ fontStyle: "italic" }}>...and {validationErrors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {isSidebarOpen && <div className={cx("mr-overlay")} onClick={() => setIsSidebarOpen(false)} />}
      <SuccessPopup isOpen={isPopupOpen} onClose={closePopup} />
      <ExistingRegNoPopup
        isOpen={isExistingRegNoPopupOpen}
        onClose={closeExistingRegNoPopup}
        regNo={existingRegNo}
      />
      <MismatchedRegNoPopup
        isOpen={isMismatchedRegNoPopupOpen}
        onClose={closeMismatchedRegNoPopup}
        personalRegNo={personalRegNo}
        loginRegNo={loginRegNo}
      />
      <FileSizeErrorPopup
        isOpen={isFileSizeErrorOpen}
        onClose={closeFileSizeErrorPopup}
        fileSizeKB={fileSizeErrorKB}
      />
      <ImagePreviewModal src={profileImage} isOpen={isImagePreviewOpen} onClose={() => setImagePreviewOpen(false)} />
    </div>
  );
}

export default MainRegistration;