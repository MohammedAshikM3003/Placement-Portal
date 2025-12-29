import React from 'react';
import { Link } from 'react-router-dom';
// 1. Import CSS Module
import styles from './LandingPage.module.css';
import Navbar from "../src/components/Navbar/LandingNavbar.js";

// --- Assets ---
import ksrLogo from './assets/LandingksrLogo.png';
import naccLogo from './assets/LandingNaccA++.svg';
import nbaLogo from './assets/LandingNba.svg';
import StudentIcon from './assets/LandingStudentIcon.png';
import Infosis from './assets/LandingInfosys.svg';
import Zoho from './assets/LandingZoho.svg';
import WiproLogo from './assets/LandingWipro.svg';
import TCS from './assets/LandingTcs.svg';

// --- Assets Footer ---
import Ksrlogo from './assets/LandingksrLogo.png';
import Nbalogo from './assets/LandingNba.svg';
import Naccalogo from './assets/LandingNaccA++.svg';
import Instagram from './assets/LandingInstagram.png';
import LinkedIn from './assets/LandingLinkedIn.png';
import Twitter from './assets/LandingTwitter.svg';
import Youtube from './assets/LandingYoutube.png';

const HeroSection = () => {
 return (
  <>
   <div className={styles['hero-container']} id="home">
   <div className={styles['college-info-bar']}>
    <img src={ksrLogo} alt="K.S.R College of Engineering Logo" className={styles['ksr-logo']} />
    <img src={naccLogo} alt="NAAC A++ Accreditation" className={styles['accreditation-logo']} />
    <img src={nbaLogo} alt="NBA Accreditation" className={styles['accreditation-nba-logo']} />
   </div>
   <section className={styles['hero-content-section']}>
    <h1 className={styles['hero-headline']}>Connect with Top Talent, Effortlessly</h1>
    <p className={styles['hero-subheadline']}>
     Gateway to a seamless placement experience for the students
    </p>
    <div className={styles['welcome-card']}>
     <h2>Welcome</h2>
     <p className={styles['welcome-card-subtitle']}>Turn Skills Into Opportunities</p>
     <p className={styles['welcome-card-text']}>
      Every effort you put in today shapes the career you'll own tomorrow.
     </p>
     <Link to="/mainlogin" className={styles['get-started-btn']}>Get Started</Link>
    </div>
   </section>
   </div>
  </>
 );
};

const StudentCard = ({ name, dept, company, pkg, role }) => (
    <div className={styles['student-card']}>
     <div className={styles['student-photo-container']}>
      <img src={StudentIcon} alt="Student decorative icon" className={styles['student-icon-img']} />
      <p className={styles['student-photo-text']}>Student Photo</p>
     </div>
     <div className={styles['student-details']}>
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
     <div className={styles['placement-container-wrapper']} id="about">
      <div className={styles['placement-container']}>
       <h2 className={styles['section-title']}>PLACEMENT HIGHLIGHTS</h2>
       <div className={styles['highlights-wrapper']}>
        <div className={styles['highlight-card']}>
         <p className={styles['value']}>100%</p>
         <p className={styles['label']}>Placement rate</p>
        </div>
        <div className={`${styles['highlight-card']} ${styles['special']}`}>
         <p className={styles['value']}>24 LPA</p>
         <p className={styles['label']}>Highest Package</p>
        </div>
        <div className={styles['highlight-card']}>
         <p className={styles['value']}>6 LPA</p>
         <p className={styles['label']}>Average Package</p>
        </div>
       </div>
       <div className={styles['placed-students-section']}>
        <h2 className={styles['placed-students-title']}>PLACED STUDENTS</h2>
        <div className={styles['students-grid']}>
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
     <div className={styles['placement-section-container']}>
      <section className={styles['industries-section']}>
       <h2>Industries with 400+</h2>
       <div className={styles['company-logos']}>
        <img src={Zoho} alt="Zoho Logo" />
        <img src={Infosis} alt="Infosys Logo" />
        <img src={TCS} alt="TCS Logo" />
        <img src={WiproLogo} alt="Wipro Logo" />
       </div>
      </section>
      <section className={styles['upcoming-drives-section']} id="drive">
       <h2 className={styles['upcoming-drives-title']}>UPCOMING DRIVES</h2>
       <div className={styles['marquee-container']}>
        <div className={styles['drive-cards-container']}>
         {driveData.map((drive, index) => (
          <div className={styles['drive-card']} key={`drive1-${index}`}>
           <div className={`${styles['company-initial-circle']} ${styles[drive.gradient]}`}>{drive.initial}</div>
           <h3>{drive.name}</h3>
           <p>Date : {drive.date}</p>
           <p>Package : {drive.package}</p>
          </div>
         ))}
         {driveData.map((drive, index) => (
          <div className={styles['drive-card']} key={`drive2-${index}`}>
           <div className={`${styles['company-initial-circle']} ${styles[drive.gradient]}`}>{drive.initial}</div>
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

const KSRSection = () => {
    return (
        <div className={styles['page-wrapper']}>
            <footer className={styles['main-footer']} id="contact">
                <div className={styles['footer-content']}>
                    <div className={styles['footer-left-section']}>
                        <div className={styles['footer-info-box']}>
                            <img src={Ksrlogo} alt="K.S.R College Logo" className={styles['ksr-logo']} />
                        </div>
                        <div className={styles['address-text']}>
                            <p>K S R College Of Engineering, K.S.R Kalvi Nagar,</p>
                            <p>Tiruchengode - 637215, Namakkal (Dt), Tamilnadu, India</p>
                        </div>
                    </div>
                    <div className={styles['footer-accreditation']}>
                        <img src={Naccalogo} alt="NAAC A++ Logo" className={styles['accreditation-logo']} />
                        <img src={Nbalogo} alt="NBA Logo" className={styles['accreditation-logo']} />
                    </div>
                    <div className={styles['footer-contact']}>
                        <h3 className={styles['contact-title']}>Contact Us</h3>
                        <div className={styles['social-links']}>
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
            <div className={styles['copyright-section']}>
                <p>© K S R College Of Engineering. All rights Reserved.</p>
            </div>
        </div>
    );
};

const LandingPageContent = () => {
    return (
        // 2. USE SCOPED WRAPPER FROM MODULE
        <div className={styles['landing-page-container']}>
            <Navbar />
            <main className={styles['main-content']}>
                <HeroSection />
                <PlacementPage />
                <PlacementSection />
                <KSRSection />
            </main>
        </div>
    );
};

export default LandingPageContent;