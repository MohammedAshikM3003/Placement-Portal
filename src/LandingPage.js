import React from 'react';
// Import routing components from react-router-dom
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';

// --- Import Components ---
import Mainlogin from "./mainlogin.js"; // This is the correct import for your login page
import Navbar from "../src/components/Navbar/LandingNavbar.js"; // Import the Navbar component

// --- Assets from Sections 1, 2, 3 ---
import ksrLogo from './assets/LandingksrLogo.png';
import naccLogo from './assets/LandingNaccA++.svg';
import nbaLogo from './assets/LandingNba.svg';
import StudentIcon from './assets/LandingStudentIcon.png';
import Infosis from './assets/LandingInfosys.svg';
import Zoho from './assets/LandingZoho.svg';
import WiproLogo from './assets/LandingWipro.svg';
import TCS from './assets/LandingTcs.svg';

// --- Assets from Section 4 ---
import AcademicIcon from './assets/Adminicon.png';
import InnovativeIcon from './assets/LandingInnovativeicon.png';
import ProfessionalIcon from './assets/LandingProfessinalIcon.png';

// --- Assets from Section 5 ---
import Ksrlogo from './assets/LandingksrLogo.png';
import Nbalogo from './assets/LandingNba.svg';
import Naccalogo from './assets/LandingNaccA++.svg';
import Instagram from './assets/LandingInstagram.png';
import LinkedIn from './assets/LandingLinkedIn.png';
import Twitter from './assets/LandingTwitter.svg';
import Youtube from './assets/LandingYoutube.png';
import ChatbotIcon from './assets/LandingChatbot.svg';
import Magnifier from './assets/LandingMagnifier.svg';


// --- 1st Section Component ---
const HeroSection = () => {
 return (
  <>
   <div className="hero-container" id="home">
   <div className="college-info-bar">
    <img src={ksrLogo} alt="K.S.R College of Engineering Logo" className="ksr-logo" />
    <img src={naccLogo} alt="NAAC A++ Accreditation" className="accreditation-logo" />
    <img src={nbaLogo} alt="NBA Accreditation" className="accreditation-nba-logo" />
   </div>
   <section className="hero-content-section">
    <h1 className="hero-headline">Connect with Top Talent, Effortlessly</h1>
    <p className="hero-subheadline">
     Gateway to a seamless placement experience for the students
    </p>
    <div className="welcome-card">
     <h2>Welcome</h2>
     <p className="welcome-card-subtitle">Turn Skills Into Opportunities</p>
     <p className="welcome-card-text">
      Every effort you put in today shapes the career you'll own tomorrow.
     </p>
     <Link to="/mainlogin" className="get-started-btn">Get Started</Link>
    </div>
   </section>
   </div>
  </>
 );
};

// --- Other components (StudentCard, PlacementPage, etc.) remain the same ---
const StudentCard = ({ name, dept, company, pkg, role }) => (
    <div className="student-card">
     <div className="student-photo-container">
      <img src={StudentIcon} alt="Student decorative icon" className="student-icon-img" />
      <p className="student-photo-text">Student Photo</p>
     </div>
     <div className="student-details">
      <p><strong>Name :</strong> {name}</p>
      <p><strong>Dept :</strong> {dept}</p>
      <p><strong>Company :</strong> {company}</p>
      <p><strong>Package :</strong> {pkg}</p>
      <p><strong>Job Role :</strong> {role}</p>
     </div>
    </div>
);

const PlacementPage = () => {
    const students = [
     { name: 'Student S', dept: 'CSE', company: 'Wipro', pkg: '12 LPA', role: 'Developer' },
     { name: 'Student A', dept: 'CSE', company: 'TCS', pkg: '8 LPA', role: 'Data Analyst' },
     { name: 'Student M', dept: 'IT', company: 'TCS', pkg: '8 LPA', role: 'Data Analyst' },
     { name: 'Student C', dept: 'MECHANICAL', company: 'Wipro', pkg: '7 LPA', role: 'Developer' },
     { name: 'Student S', dept: 'ECE', company: 'Infosys', pkg: '26 LPA', role: 'UI/UX Designer' },
     { name: 'Student R', dept: 'CSE', company: 'Google', pkg: '30 LPA', role: 'SDE' },
     { name: 'Student T', dept: 'IT', company: 'Microsoft', pkg: '28 LPA', role: 'Software Engineer' },
     { name: 'Student K', dept: 'ECE', company: 'Amazon', pkg: '25 LPA', role: 'Hardware Engineer' },
     { name: 'Student V', dept: 'MECH', company: 'Tata Motors', pkg: '10 LPA', role: 'Design Engineer' },
     { name: 'Student P', dept: 'CSE', company: 'Zomato', pkg: '18 LPA', role: 'Frontend Dev' },
    ];
    const scrollingStudents = [...students, ...students];

    return (
     <div className="placement-container-wrapper" id="about">
      <div className="placement-container">
       <h2 className="section-title">PLACEMENT HIGHLIGHTS</h2>
       <div className="highlights-wrapper">
        <div className="highlight-card">
         <p className="value">100%</p>
         <p className="label">Placement rate</p>
        </div>
        <div className="highlight-card special">
         <p className="value">24 LPA</p>
         <p className="label">Highest Package</p>
        </div>
        <div className="highlight-card">
         <p className="value">6 LPA</p>
         <p className="label">Average Package</p>
        </div>
       </div>
       <div className="placed-students-section">
        <h2 className="placed-students-title">PLACED STUDENTS</h2>
        <div className="students-grid">
         {scrollingStudents.map((student, index) => (
          <StudentCard
           key={index}
           name={student.name}
           dept={student.dept}
           company={student.company}
           pkg={student.pkg}
           role={student.role}
          />
         ))}
        </div>
       </div>
      </div>
     </div>
    );
};

const PlacementSection = () => {
    const driveData = [
        { name: 'Wipro', initial: 'W', date: '28/09/2026', package: '16 LPA', gradient: 'wipro-gradient' },
        { name: 'TCS', initial: 'T', date: '13/10/2026', package: '10 LPA', gradient: 'tcs-gradient' },
        { name: 'Infosys', initial: 'I', date: '29/10/2026', package: '25 LPA', gradient: 'infosys-gradient' },
        { name: 'Cognizant', initial: 'C', date: '19/11/2026', package: '7 LPA', gradient: 'cognizant-gradient' },
        { name: 'Capgemini', initial: 'C', date: '15/12/2026', package: '9 LPA', gradient: 'capgemini-gradient' },
        { name: 'HCL Tech', initial: 'H', date: '05/01/2027', package: '11 LPA', gradient: 'hcl-gradient' },
        { name: 'Tech Mahindra', initial: 'T', date: '18/01/2027', package: '8 LPA', gradient: 'techm-gradient' },
        { name: 'LTI Mindtree', initial: 'L', date: '01/02/2027', package: '14 LPA', gradient: 'lti-gradient' },
        { name: 'Oracle', initial: 'O', date: '28/02/2027', package: '22 LPA', gradient: 'oracle-gradient' },
        { name: 'IBM', initial: 'I', date: '10/03/2027', package: '18 LPA', gradient: 'ibm-gradient' },
        { name: 'Microsoft', initial: 'M', date: '25/03/2027', package: '40 LPA', gradient: 'microsoft-gradient' },
        { name: 'Google', initial: 'G', date: '05/04/2027', package: '50 LPA', gradient: 'google-gradient' },
        { name: 'Amazon', initial: 'A', date: '15/04/2027', package: '45 LPA', gradient: 'amazon-gradient' },
    ];

    return (
     <div className="placement-section-container">
      <section className="industries-section">
       <h2>Industries with 400+</h2>
       <div className="company-logos">
        <img src={Zoho} alt="Zoho Logo" />
        <img src={Infosis} alt="Infosys Logo" />
        <img src={TCS} alt="TCS Logo" />
        <img src={WiproLogo} alt="Wipro Logo" />
       </div>
      </section>
      <section className="upcoming-drives-section">
       <h2 className="upcoming-drives-title">UPCOMING DRIVES</h2>
       <div className="marquee-container">
        <div className="drive-cards-container">
         {driveData.map((drive, index) => (
          <div className="drive-card" key={`drive1-${index}`}>
           <div className={`company-initial-circle ${drive.gradient}`}>{drive.initial}</div>
           <h3>{drive.name}</h3>
           <p>Date : {drive.date}</p>
           <p>Package : {drive.package}</p>
          </div>
         ))}
         {driveData.map((drive, index) => (
          <div className="drive-card" key={`drive2-${index}`}>
           <div className={`company-initial-circle ${drive.gradient}`}>{drive.initial}</div>
           <h3>{drive.name}</h3>
           <p>Date : {drive.date}</p>
           <p>Package : {drive.package}</p>
          </div>
         ))}
        </div>
       </div>
      </section>
     </div>
    );
};

const FeaturesSection = () => {
    const featuresData = [
        {
            title: "Academic Excellence",
            description: "Our comprehensive curriculum and expert faculty provide a foundation for lifelong learning and success in any field.",
            Icon: AcademicIcon,
            bgColor: "#3b82f6",
        },
        {
            title: "Innovative Solutions",
            description: "We foster an environment of creativity and critical thinking, encouraging students to develop groundbreaking ideas that solve real-world problems.",
            Icon: InnovativeIcon,
            bgColor: "#dc2626",
        },
        {
            title: "Professional Pathways",
            description: "From internships to full-time roles, our career services team is dedicated to helping you build a successful and fulfilling career path.",
            Icon: ProfessionalIcon,
            bgColor: "#16a34a",
        },
    ];

    const getAlignmentClass = (index) => {
     if (index === 1) return 'align-center';
     if (index === 2) return 'align-end';
     return 'align-start';
    };

    return (
        <div className="page-container" id="features">
            <div className="content-container">
                <svg className="pipeline-svg" viewBox="0 0 1000 900" preserveAspectRatio="xMidYMid meet">
                    <path d="M 350 140 H 990 V 470 H" stroke="#CDCDCD" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 715 470 H 990 H 10" stroke="#CDCDCD" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 10 470 V 790 H 645" stroke="#CDCDCD" strokeWidth="16" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 350 140 H 990 V 470 H" stroke="#3b82f6" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 715 470 H 990 H 10" stroke="#dc2626" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M 10 470 V 790 H 645" stroke="#16a34a" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {featuresData.map((feature, index) => (
                    <div key={index} className={`feature-card ${getAlignmentClass(index)}`} style={{ backgroundColor: feature.bgColor }} >
                        <div className="card-icon-container">
                            <img src={feature.Icon} alt={`${feature.title} icon`} className="card-icon" />
                        </div>
                        <div>
                            <h2 className="card-title">{feature.title}</h2>
                            <p className="card-description">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const KSRSection = () => {
    return (
        <div className="page-wrapper">
            <div className="hero-section">
                <div className="hero-image-container">
                    <img src={Magnifier} alt="Magnifying Glass" className="magnifier-img" />
                    <img src={ChatbotIcon} alt="Chatbot Icon" className="chatbot-icon" />
                </div>
                <div className="hero-text">
                    <p>
                     ENGINEERING ISN'T JUST ABOUT SOLVING EQUATIONS; IT'S ABOUT SOLVING REAL-WORLD PROBLEMS.
                     EVERY CHALLENGE YOU FACE HERE IS PREPARING YOU TO DESIGN, CREATE, AND INNOVATE FOR A BETTER TOMORROW.
                    </p>
                </div>
            </div>
            <footer className="main-footer" id="contact">
                <div className="footer-content">
                    <div className="footer-left-section">
                        <div id="col-info">
                            <img src={Ksrlogo} alt="K.S.R College Logo" className="ksr-logo" />
                        </div>
                        <div className="address-text">
                            <p>K S R College Of Engineering, K.S.R Kalvi Nagar,</p>
                            <p>Tiruchengode - 637215, Namakkal (Dt), Tamilnadu, India</p>
                           
                        </div>
                    </div>
                    <div className="footer-col" id="col-accreditation">
                        <img src={Naccalogo} alt="NAAC A++ Logo" className="accreditation-logo" />
                        <img src={Nbalogo} alt="NBA Logo" className="accreditation-logo" />
                    </div>
                    <div className="footer-col" id="col-contact">
                        <h3>Contact Us</h3>
                        <div className="social-links">
                            <a href="https://www.instagram.com/ksrce_official?igsh=NGFsbXJvdVdzaEMTQW" target="_blank" rel="noopener noreferrer">
                                <img src={Instagram} alt="Instagram" />
                                <span>https://www.instagram.com/ ksrce_official?igsh=NGFsbXJvdVdzaEMTQW</span>
                            </a>
                            <a href="https://www.linkedin.com/school/ksrce-official/" target="_blank" rel="noopener noreferrer">
                                <img src={LinkedIn} alt="LinkedIn" />
                                <span>https://www.linkedin.com/ school/ksrce-official/</span>
                            </a>
                            <a href="https://x.com/ksrceofficial?t=xeX8YvmxJSOZBMQILjGSuQ&s=09" target="_blank" rel="noopener noreferrer">
                                <img src={Twitter} alt="X" />
                                <span>https://x.com/ksrceofficial? t=xeX8YvmxJSOZBMQILjGSuQ&s=09</span>
                            </a>
                            <a href="https://youtube.com/@ksrceites?si=EPXlMxxRznw7Ms0d" target="_blank" rel="noopener noreferrer">
                                <img src={Youtube} alt="YouTube" />
                                <span>https://youtube.com/ @ksrceites?si=EPXlMxxRznw7Ms0d</span>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
            <div className="copyright-section">
                <p>© K S R College Of Engineering. All rights Reserved.</p>
            </div>
        </div>
    );
};

// --- Component to render the entire landing page ---
const LandingPageContent = () => {
    return (
        <div className="landing-page-container">
            <Navbar />
            <main className="main-content">
                <HeroSection />
                <PlacementPage />
                <PlacementSection />
                <FeaturesSection />
                <KSRSection />
            </main>

            <style>{`
                /* --- General Styles --- */
                html, body {
                    margin: 0;
                    font-family: 'Poppins', sans-serif;
                    background-color: #f0f2f5;
                    overflow: hidden;
                    height: 100%;
                }

                .landing-page-container {
                    display: flex;
                    flex-direction: column;
                    height: 100vh;
                }

                .main-content {
                    flex: 1;
                    overflow-y: auto;
                    overflow-x: hidden;
                    scroll-behavior: smooth;
                }

                /* NEW: Custom Scrollbar Styles */
                .main-content::-webkit-scrollbar {
                    width: 10px;
                }

                .main-content::-webkit-scrollbar-track {
                    background: #f0f2f5; 
                }
                
                .main-content::-webkit-scrollbar-thumb {
                    background-color: #4F46E5; /* This is the color you requested */
                    border-radius: 20px;
                    border: 3px solid #f0f2f5;
                }

                .main-content::-webkit-scrollbar-thumb:hover {
                    background-color: #4338CA; /* A slightly darker shade for hover effect */
                }


                /* --- Hero Section --- */
                .hero-container { width: 100%; display: flex; flex-direction: column; }
                .college-info-bar { background-color: #ffffff; padding: 20px 5%; display: flex; justify-content: center; align-items: center; gap: 60px; border-bottom: 1px solid #e5e7eb; flex-wrap: wrap; }
                .college-info-bar img.ksr-logo { height: auto; max-width: 900px; width: 100%; position: relative; margin-left: -80px; margin-top: -40px; }
                .college-info-bar img.accreditation-logo { height: 135px; width: 135px; position: relative; left: 35px; margin-top: 0; }
                .college-info-bar img.accreditation-nba-logo { height: 135px; width: 135px; position: relative; left: 60px; margin-top: 0; }
                .hero-content-section { background-image: linear-gradient(to right, #4F46E5 0%, #312E81 100%); color: white; text-align: center; padding: 80px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
                .hero-headline { font-size: 3.8rem; font-weight: 700; margin: 0 0 25px; margin-top: -40px; max-width: 1000px; }
                .hero-subheadline { font-size: 1.25rem; font-weight: 420; opacity: 0.9; margin-bottom: 20px; margin-top: -10px; max-width: 890px; height:auto; }
                .welcome-card { background-color: white; color: #1f2937; padding: 35px 40px; border-radius: 24px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2); width: 100%; max-width: 420px; }
                .welcome-card h2 { margin: 0; font-size: 1.8rem; font-weight: 700; }
                .welcome-card-subtitle { font-size: 1.1rem; font-weight: 600; margin: 10px 0 15px 0; }
                .welcome-card-text { color: #4b5563; font-size: 0.95rem; line-height: 1.6; margin-bottom: 30px; }
                .get-started-btn { background-color: #4F46E5; color: white; border: none; width: 100%; padding: 15px 20px; font-size: 1.1rem; font-weight: 600; border-radius: 12px; cursor: pointer; transition: background-color 0.3s, transform 0.2s; display: inline-block; text-align: center; text-decoration: none; }
                .get-started-btn:hover { background-color: #4D2AEC; transform: translateY(-2px); }

                /* --- Placement Highlights Section --- */
                .placement-container-wrapper { background-color: #FFFFFF; padding: 40px 20px; display: flex; justify-content: center; align-items: center; box-sizing: border-box; width: 100%; }
                .placement-container { width: 100%; max-width: 1250px; }
                .section-title { text-align: center; font-size: 3rem; font-weight: 800; color: #022893; margin-bottom: 40px; margin-top: 10px; }
                .highlights-wrapper { display: flex; justify-content: center; gap: 40px; flex-wrap: wrap; margin-bottom: 80px; }
                .highlight-card { background-image: linear-gradient(to bottom, #DDEBFF, #FFFFFF); border-radius: 24px; padding: 30px; text-align: center; width: 350px; height: 300px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #BABABA; }
                .highlight-card.special { background-image: linear-gradient(to bottom, #FFEDD5, #FFFFFF); border-color: #BABABA; }
                .highlight-card .value { font-size: 4rem; font-weight: 800; color: #022893; margin-top: 50px; margin-bottom: 20px; line-height: 1.1; }
                .highlight-card.special .value { color: #D97706; }
                .highlight-card .label { font-size: 1.2rem; color: #022893; font-weight: 500; margin-top: 8px; }
                .highlight-card.special .label { color: #D97706; }

                /* --- Placed Students Scrolling Section --- */
                @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-2550px); } }
                .placed-students-section { background-image: linear-gradient(to right, #FFFFFF, #E7F0FE); border-radius: 30px; padding: 80px 0 40px 0; display: flex; flex-direction: column; align-items: center; position: relative; height: 500px; width: 1440px; max-width: 1550px; margin-left: -90px; overflow: hidden; }
                .placed-students-title { background-color: #022893; color: white; font-size: 2.5rem; text-align: center; font-weight: 700; padding: 15px 70px; border-radius: 9999px; box-shadow: 0 4px 15px rgba(2, 40, 147, 0.3); position: absolute; top: -15px; max-width: 90%; }
                .students-grid { display: flex; justify-content: flex-start; gap: 35px; flex-wrap: nowrap; width: 5100px; padding: 0 40px 20px 40px; box-sizing: border-box; margin-top: 80px; animation: scroll 40s linear infinite; }
                .placed-students-section:hover .students-grid { animation-play-state: paused; }
                .student-card { background-color: #FFFFFF; border-radius: 20px; padding: 15px; text-align: center; flex-shrink: 0; width: 220px; box-shadow: 0 8px 16px rgba(0, 0, 0, 0.07); transition: transform 0.3s ease, box-shadow 0.3s ease; border: 1px solid #B7B7B7; display: flex; flex-direction: column; align-items: center; }
                .student-card:hover { transform: translateY(-8px); box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1); }
                .student-photo-container { background-color: #FFFFFF; border: 1px solid #B7B7B7; border-radius: 16px; padding: 15px 10px 5px 10px; margin-bottom: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 110px; width: 100%; box-sizing: border-box; }
                .student-icon-img { width: 64px; height: 64px; object-fit: contain; }
                .student-photo-text { margin-top: 5px; color: #64748B; font-size: 0.85rem; font-weight: 500; }
                .student-details { text-align: left; font-size: 0.85rem; color: #334155; width: 100%; }
                .student-details p { margin: 6px 0; line-height: 1.4; }
                .student-details strong { color: #000000; font-weight: 600; }

                /* --- Upcoming Drives Section --- */
                .placement-section-container { padding: 40px 20px; background-color: #f0f2f5; box-sizing: border-box; }
                .industries-section { background-color: #cfcfcf; border-radius: 15px; padding: 40px 30px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); margin-bottom: 40px; text-align: center; max-width: 1450px; margin-left: auto; margin-right: auto; }
                .industries-section h2 { font-size: 2rem; font-weight: 700; color: #333; margin-bottom: 30px; margin-top: -10px; }
                .company-logos { display: flex; justify-content: space-around; align-items: center; flex-wrap: wrap; gap: 30px; }
                .company-logos img { max-height: 70px; width: auto; transition: filter 0.3s ease; }
                .upcoming-drives-section { background: linear-gradient(to right, #ffffff, #C3750F); border-radius: 15px; padding: 40px 0; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05); text-align: center; height: auto; min-height: 500px; max-width:1450px; margin-left: auto; margin-right: auto; }
                .upcoming-drives-title { display: inline-block; background: linear-gradient(to right, #DA9F37 0%, #D48C2B 100%); color: white; font-size: 2.2rem; font-weight: 700; padding: 15px 40px; border-radius: 30px; margin-bottom: 80px; box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1); max-width: 90%; box-sizing: border-box; margin-top: 0; }
                .marquee-container { overflow: hidden; position: relative; width: 100%; }
                .drive-cards-container { display: flex; gap: 30px; padding: 0 15px; width: fit-content; animation: scroll-drives 60s linear infinite; }
                .marquee-container:hover .drive-cards-container { animation-play-state: paused; }
                @keyframes scroll-drives { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .drive-card { background-color: #ffffff; border-radius: 15px; padding: 25px; border: 1px solid #eee; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05); width: 220px; text-align: center; transition: transform 0.3s ease, box-shadow 0.3s ease; flex-shrink: 0; }
                .drive-card:hover { transform: translateY(-8px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1); }
                .company-initial-circle { width: 80px; height: 80px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin: 0 auto 20px auto; font-size: 2.5rem; font-weight: 700; color: white; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1); }
                .wipro-gradient { background: linear-gradient(to bottom right, #FFD700, #FFA500); }
                .tcs-gradient { background: linear-gradient(to bottom right, #8BC34A, #4CAF50); }
                .infosys-gradient { background: linear-gradient(to bottom right, #4DD0E1, #00BCD4); }
                .cognizant-gradient { background: linear-gradient(to bottom right, #90CAF9, #2196F3); }
                .capgemini-gradient { background: linear-gradient(to bottom right, #0070AD, #0099DD); }
                .hcl-gradient { background: linear-gradient(to bottom right, #D32F2F, #FF5252); }
                .techm-gradient { background: linear-gradient(to bottom right, #2C3E50, #4E5E71); }
                .lti-gradient { background: linear-gradient(to bottom right, #00A99D, #00C6B7); }
                .oracle-gradient { background: linear-gradient(to bottom right, #F80000, #DC281E); }
                .ibm-gradient { background: linear-gradient(to bottom right, #006699, #05476C); }
                .microsoft-gradient { background: linear-gradient(to bottom right, #F25022, #FFB900); }
                .google-gradient { background: linear-gradient(to bottom right, #4285F4, #34A853); }
                .amazon-gradient { background: linear-gradient(to bottom right, #FF9900, #000000); }
                .drive-card h3 { font-size: 1.4rem; font-weight: 600; color: #333; margin-bottom: 10px; }
                .drive-card p { font-size: 0.9rem; color: #666; margin: 5px 0; line-height: 1.4; }

                /* --- Features Section --- */
                .page-container { position: relative; background-color: #ffffff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; padding: 2rem; box-sizing: border-box; }
                .content-container { position: relative; display: flex; flex-direction: column; gap: 2.5rem; max-width: 55rem; width: 100%; }
                .pipeline-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none; }
                .feature-card { position: relative; z-index: 10; display: flex; align-items: center; gap: 2rem; padding: 2rem; border-radius: 1rem; color: white; background-color: white; border: 5px solid #d3d3d3; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); box-sizing: border-box; }
                .align-start { align-self: flex-start; margin-left: -230px; width: 62%; height: 200px; margin-top: 40px; }
                .align-center { align-self: center; width: 62%; height: 200px; margin-left: 0px; margin-top: 40px; }
                .align-end { align-self: flex-end; width: 62%; height: 200px; margin-right: -230px; margin-top: 40px; }
                .card-icon-container { flex-shrink: 0; }
                .card-icon { width: 4rem; height: 4rem; }
                .card-title { font-size: 1.5rem; line-height: 2rem; font-weight: 700; margin-bottom: 0.25rem; margin-top: 0; }
                .card-description { color: rgba(255, 255, 255, 0.9); line-height: 1.625; margin: 0; }

                /* --- KSR/Footer Section --- */
                @import url('https://fonts.googleapis.com/css2?family=Jaini&display=swap');
                .page-wrapper { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; width: 100%; overflow-x: hidden; background-color: white; }
                .hero-section { background-color: #8F9BBA; padding: 50px 80px; display: flex; align-items: center; justify-content: center; gap: 60px; margin: 40px auto 100px; position: relative; height: auto; width: 95%; max-width: 1510px; border-radius: 40px; border: 4px solid #d3d3d3; box-sizing: border-box; }
                .hero-image-container { position: relative; width: 300px; height: 300px; flex-shrink: 0; }
                .magnifier-img { width: 65%; height: auto; position: absolute; top: 50%; left: 52%; transform: translate(-50%, -50%); z-index: 1; }
                .chatbot-icon { width: 130%; height: auto; position: absolute; top: 50%; left: 36.7%; transform: translate(-50%, -50%); z-index: 2; }
                .hero-text { color: white; font-family: 'Times New Roman', cursive; font-size: 35px; font-weight: 500; line-height: 1.3; max-width: 900px; text-align: left; }
                .main-footer { background-color: #192a56; color: white; padding: 55px 20px; }
                .footer-content { display: flex; justify-content: space-between; align-items: flex-start; max-width: 1600px; margin: 0 auto; gap: 40px; flex-wrap: wrap; }
                .footer-left-section { display: flex; flex-direction: column; flex: 2.5; min-width: 280px; }
                #col-info { background-color: white; padding: 20px; border-radius: 25px; display: flex; justify-content: center; align-items: center; margin-bottom: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
                .address-text p { margin: 5px 0; font-size: 1.5rem; line-height: 1.6; color: #ccc; font-weight: 500;width: 100%; }
                #col-accreditation { flex: 1; display: flex; flex-direction: row; justify-content: center; align-items: flex-start; gap: 20px; padding-top: 10px; }
                #col-contact { flex: 3; min-width: 280px; }
                .footer-col { display: flex; flex-direction: column; }
                .ksr-logo { width: 100%; max-width: 490px; height: auto; }
                .accreditation-logo { width: 100px; height: 100px; }
                #col-contact h3 { color: #f39c12; font-size: 2.5rem; font-weight: 700; margin-top: 20px; margin-bottom: 40px; }
                .social-links { display: grid; grid-template-columns: 1fr 1fr; gap: 50px 70px; }
                .social-links a { display: flex; align-items: center; text-decoration: none; color: white; font-size: 0.85rem; }
                .social-links a:hover { opacity: 0.8; }
                .social-links img { width: 40px; height: 40px; margin-right: 15px; }
                .social-links span { word-break: break-all; font-weight: 600; line-height: 1.4; }
                .copyright-section { background-color: #192a56; text-align: center; padding: 20px 0; border-top: 1px solid #3b4b57; font-size: 0.9rem; color: #ccc; margin-top: -30px; }
                .copyright-section p { margin: 0; font-weight: 600; font-size: 1.3rem; }

                /* --- Responsive Media Queries --- */

                /* LAPTOPS & LARGE TABLETS (max-width: 1200px) */
                @media (max-width: 1200px) {
                    .college-info-bar img.ksr-logo { max-width: 600px; margin-left: 0; }
                    .college-info-bar img.accreditation-logo, .college-info-bar img.accreditation-nba-logo { position: static; height: 100px; width: 100px; }
                    /* REMOVED the rule that made student cards smaller */
                    .align-start { margin-left: -50px; width: 70%; }
                    .align-end { margin-right: -50px; width: 70%; }
                    .align-center { width: 70%; }
                    .footer-content { flex-direction: column; align-items: center; text-align: center; }
                    .footer-left-section, #col-accreditation, #col-contact { align-items: center; }
                    #col-contact h3 { text-align: center; }
                }

                /* TABLETS (max-width: 992px) */
                @media (max-width: 992px) {
                    .hero-headline { font-size: 3rem; }
                    .section-title { font-size: 2.5rem; }
                    .highlights-wrapper { gap: 20px; }
                    .highlight-card { width: 220px; padding: 25px; height: auto; }
                    .highlight-card .value { font-size: 3rem; margin-top: 20px; }
                    .highlight-card .label { font-size: 1.2rem; }
                    .placed-students-section {
                        padding: 60px 0 20px 0;
                        width: 100%;      /* UPDATED: Make section responsive */
                        margin-left: 0;    /* UPDATED: Remove negative margin */
                    }
                    .industries-section, .upcoming-drives-section { padding-left: 20px; padding-right: 20px; }
                    .hero-section { flex-direction: column; text-align: center; padding: 40px; gap: 20px; }
                    .hero-text { margin-top: 20px; font-size: 28px; }
                    .hero-image-container { width: 250px; height: 250px; }
                    .pipeline-svg { display: none; }
                    .feature-card { flex-direction: column; text-align: center; }
                    .align-start, .align-center, .align-end { align-self: center; margin: 0; width: 100%; max-width: 450px; height: auto; }
                    .social-links { grid-template-columns: 1fr; }
                }

                /* SMALL TABLETS & LARGE PHONES (max-width: 768px) */
                @media (max-width: 768px) {
                    .college-info-bar { flex-direction: column; gap: 20px; padding: 20px; }
                    .college-info-bar img.ksr-logo { max-width: 300px; margin: 0; }
                    .hero-headline { font-size: 2.2rem; }
                    .hero-content-section { padding: 60px 20px; }
                    .section-title { font-size: 2rem; }
                    .highlights-wrapper { flex-direction: column; align-items: center; }
                    .highlight-card { width: 100%; max-width: 350px; }
                    .placed-students-title { padding: 12px 30px; font-size: 1.5rem; top: -28px; }
                    .students-grid { padding: 0 20px 20px 20px; }
                    .upcoming-drives-title { font-size: 1.8rem; }
                    .company-logos img { max-height: 50px; }
                    .hero-section { padding: 30px 20px; }
                    .hero-text { font-size: 24px; }
                    .main-footer { padding: 40px 20px; }
                    .address-text p { font-size: 1rem; }
                    #col-contact h3 { font-size: 2rem; }
                }

                /* MOBILE PHONES (max-width: 576px) */
                @media (max-width: 576px) {
                    .hero-headline { font-size: 1.8rem; margin-top: 0; }
                    .hero-subheadline { font-size: 1rem; }
                    .welcome-card { padding: 25px; }
                    .section-title { font-size: 1.8rem; }
                    .highlight-card .value { font-size: 2.5rem; }
                    .highlight-card .label { font-size: 1rem; }
                    .placed-students-title { font-size: 1.2rem; padding: 10px 25px; top: -25px; }
                    .upcoming-drives-title { font-size: 1.5rem; padding: 12px 25px; margin-bottom: 40px; }
                    .industries-section h2 { font-size: 1.5rem; }
                    .ksr-logo { max-width: 100% !important; }
                    .hero-text { font-size: 18px; }
                    .hero-image-container { width: 200px; height: 200px; }
                    #col-contact h3 { font-size: 1.5rem; }
                    .social-links { gap: 20px; }
                    .social-links span { font-size: 0.75rem; }
                }

            `}</style>
        </div>
    );
}

export default LandingPageContent;