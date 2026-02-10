import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
// 1. Import CSS Module
import styles from './LandingPage.module.css';
import Navbar from "../src/components/Navbar/LandingNavbar.js";
import { fetchAllLandingData } from './services/landingPageCacheService';
import { PlacedStudentsSkeleton, DrivesSkeleton } from './components/SkeletonLoader/SkeletonLoader';

// --- Assets (Fallback images) ---
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

const HeroSection = ({ collegeImages }) => {
 // Use dynamic images from DB or fallback to static assets
 const bannerLogo = collegeImages?.collegeBanner || ksrLogo;
 const naacCert = collegeImages?.naacCertificate || naccLogo;
 const nbaCert = collegeImages?.nbaCertificate || nbaLogo;

 return (
  <>
   <div className={styles['hero-container']} id="home">
   <div className={styles['college-info-bar']}>
    <img src={bannerLogo} alt="K.S.R College of Engineering Logo" className={styles['ksr-logo']} />
    <img src={naacCert} alt="NAAC A++ Accreditation" className={styles['accreditation-logo']} />
    <img src={nbaCert} alt="NBA Accreditation" className={styles['accreditation-nba-logo']} />
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

const StudentCard = ({ name, branch, company, pkg, role, profilePhoto }) => (
    <div className={styles['student-card']}>
     <div className={styles['student-photo-container']}>
      {profilePhoto ? (
        <img src={profilePhoto} alt={`${name} profile`} className={styles['student-profile-img']} />
      ) : (
        <>
          <img src={StudentIcon} alt="Student decorative icon" className={styles['student-icon-img']} />
          <p className={styles['student-photo-text']}>Student Photo</p>
        </>
      )}
     </div>
     <div className={styles['student-details']}>
      <p><strong>Name :</strong> {name}</p>
      <p><strong>Branch :</strong> {branch}</p>
      <p><strong>Company :</strong> {company}</p>
      <p><strong>Package :</strong> {pkg}</p>
      <p><strong>Job Role :</strong> {role}</p>
     </div>
    </div>
);

const PlacementPage = ({ placedStudentsData }) => {
    // Derive state from pre-fetched data (no separate API call needed)
    const { students, stats, isLoading } = useMemo(() => {
        if (!placedStudentsData) {
            return { students: [], stats: { highestPackage: '0 LPA', averagePackage: '0 LPA' }, isLoading: true };
        }

        const response = placedStudentsData;
        if (response.success && response.data && response.data.length > 0) {
            const mappedStudents = response.data.map(student => ({
                name: student.name,
                branch: student.dept,
                company: student.company,
                pkg: student.pkg,
                role: student.role,
                profilePhoto: student.profilePicURL || student.profilePhoto || null
            }));

            const packages = mappedStudents.map(s => parseFloat(s.pkg) || 0);
            const highest = Math.max(...packages);
            const average = packages.reduce((sum, pkg) => sum + pkg, 0) / packages.length;

            return {
                students: mappedStudents,
                stats: {
                    highestPackage: highest.toFixed(1) + ' LPA',
                    averagePackage: average.toFixed(1) + ' LPA'
                },
                isLoading: false
            };
        }

        return { students: [], stats: { highestPackage: '0 LPA', averagePackage: '0 LPA' }, isLoading: false };
    }, [placedStudentsData]);

    // Only duplicate students for scrolling if there are more than 4
    // Otherwise show them as-is without animation
    const scrollingStudents = students.length > 4 ? [...students, ...students] : students;
    const shouldAnimate = students.length > 4;

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
         <p className={styles['value']}>{stats.highestPackage}</p>
         <p className={styles['label']}>Highest Package</p>
        </div>
        <div className={styles['highlight-card']}>
         <p className={styles['value']}>{stats.averagePackage}</p>
         <p className={styles['label']}>Average Package</p>
        </div>
       </div>
       <div className={styles['placed-students-section']}>
        <h2 className={styles['placed-students-title']}>PLACED STUDENTS</h2>
        {isLoading ? (
          <div style={{ marginTop: '80px' }}>
            <PlacedStudentsSkeleton count={5} />
          </div>
        ) : students.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666', marginTop: '80px' }}>
            <p>No placed students data available at this time.</p>
          </div>
        ) : (
          <div className={styles['students-scroll-wrapper']}>
            <div className={`${styles['students-grid']} ${shouldAnimate ? styles['animate-scroll'] : styles['static-grid']}`}>
              {scrollingStudents.map((student, index) => (
                <StudentCard
                  key={index}
                  name={student.name}
                  branch={student.branch}
                  company={student.company}
                  pkg={student.pkg}
                  role={student.role}
                  profilePhoto={student.profilePhoto}
                />
              ))}
            </div>
          </div>
        )}
       </div>
      </div>
     </div>
    );
};

const PlacementSection = ({ companyDrivesData }) => {
    // Derive formatted drives from pre-fetched data
    const { driveData, isLoading } = useMemo(() => {
        if (!companyDrivesData) {
            return { driveData: [], isLoading: true };
        }

        const drives = companyDrivesData.drives || [];
        
        // Sort drives by startingDate in ascending order (earliest first)
        const sortedDrives = [...drives].sort((a, b) => {
            const dateA = a.startingDate ? new Date(a.startingDate) : new Date('9999-12-31');
            const dateB = b.startingDate ? new Date(b.startingDate) : new Date('9999-12-31');
            return dateA - dateB;
        });

        const formatDate = (dateString) => {
            if (!dateString) return 'TBA';
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}-${month}-${year}`;
        };

        const formattedDrives = sortedDrives.map(drive => {
            const initial = drive.companyName ? drive.companyName.charAt(0).toUpperCase() : '?';
            const gradientClass = `company-gradient-${initial.toLowerCase()}`;
            let packageDisplay = 'Not Specified';
            if (drive.package) packageDisplay = drive.package;
            else if (drive.ctc) packageDisplay = drive.ctc;

            return {
                name: drive.companyName || 'Unknown Company',
                initial,
                date: formatDate(drive.startingDate),
                package: packageDisplay,
                gradient: gradientClass
            };
        });

        return { driveData: formattedDrives, isLoading: false };
    }, [companyDrivesData]);

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
       {isLoading ? (
        <div style={{ padding: '20px 0' }}>
         <DrivesSkeleton count={4} />
        </div>
       ) : driveData.length === 0 ? (
        <div className={styles['no-drives-message']}>
         <p>No upcoming drives scheduled at this time. Please check back later!</p>
        </div>
       ) : (
        <div className={styles['marquee-container']}>
         <div className={`${styles['drive-cards-container']} ${driveData.length > 5 ? styles['animate-marquee'] : ''}`}>
          {driveData.map((drive, index) => (
           <div className={styles['drive-card']} key={`drive-${index}`}>
            <div className={`${styles['company-initial-circle']} ${styles[drive.gradient]}`}>{drive.initial}</div>
            <h3>{drive.name}</h3>
            <p>Date : {drive.date}</p>
            <p>Package : {drive.package}</p>
           </div>
          ))}
          {/* Duplicate drives only if there are more than 5 for smooth marquee effect */}
          {driveData.length > 5 && driveData.map((drive, index) => (
           <div className={styles['drive-card']} key={`drive-duplicate-${index}`}>
            <div className={`${styles['company-initial-circle']} ${styles[drive.gradient]}`}>{drive.initial}</div>
            <h3>{drive.name}</h3>
            <p>Date : {drive.date}</p>
            <p>Package : {drive.package}</p>
           </div>
          ))}
         </div>
        </div>
       )}
      </section>
     </div>
    );
};

const KSRSection = ({ collegeImages }) => {
    // Use dynamic college banner from DB or fallback to static logo
    const footerBanner = collegeImages?.collegeBanner || Ksrlogo;
    const footerNaac = collegeImages?.naacCertificate || Naccalogo;
    const footerNba = collegeImages?.nbaCertificate || Nbalogo;

    return (
        <div className={styles['page-wrapper']}>
            <footer className={styles['main-footer']} id="contact">
                <div className={styles['footer-content']}>
                    <div className={styles['footer-left-section']}>
                        <div className={styles['footer-info-box']}>
                            <img src={footerBanner} alt="K.S.R College Logo" className={styles['ksr-logo']} />
                        </div>
                        <div className={styles['address-text']}>
                            <p>K S R College Of Engineering, K.S.R Kalvi Nagar,</p>
                            <p>Tiruchengode - 637215, Namakkal (Dt), Tamilnadu, India</p>
                        </div>
                    </div>
                    <div className={styles['footer-accreditation']}>
                        <img src={footerNaac} alt="NAAC A++ Logo" className={styles['accreditation-logo']} />
                        <img src={footerNba} alt="NBA Logo" className={styles['accreditation-logo']} />
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
    const [collegeImages, setCollegeImages] = useState(null);
    const [placedStudentsData, setPlacedStudentsData] = useState(null);
    const [companyDrivesData, setCompanyDrivesData] = useState(null);

    useEffect(() => {
        // Fetch ALL landing page data in PARALLEL with caching
        const loadAllData = async () => {
            try {
                const { placedStudents, companyDrives, collegeImages: images } = await fetchAllLandingData();
                
                // Set all state at once - React batches these updates
                setPlacedStudentsData(placedStudents);
                setCompanyDrivesData(companyDrives);
                if (images) setCollegeImages(images);
            } catch (error) {
                console.error('Landing page data fetch error:', error);
            }
        };
        loadAllData();
    }, []);

    return (
        // 2. USE SCOPED WRAPPER FROM MODULE
        <div className={styles['landing-page-container']}>
            <Navbar />
            <main className={styles['main-content']}>
                <HeroSection collegeImages={collegeImages} />
                <PlacementPage placedStudentsData={placedStudentsData} />
                <PlacementSection companyDrivesData={companyDrivesData} />
                <KSRSection collegeImages={collegeImages} />
            </main>
        </div>
    );
};

export default LandingPageContent;