import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
// 1. Import CSS Module
import styles from './LandingPage.module.css';
import Navbar from "../src/components/Navbar/LandingNavbar.js";
import { fetchAllLandingData, clearCollegeImagesCache, fetchCollegeImagesPublic } from './services/landingPageCacheService';
import { PlacedStudentsSkeleton, DrivesSkeleton, BannerSkeleton, FooterBannerSkeleton } from './components/SkeletonLoader/SkeletonLoader';
import { changeFavicon, FAVICON_TYPES } from './utils/faviconUtils';

// --- Assets (Fallback images) ---
import StudentIcon from './assets/LandingStudentIcon.png';
import Infosis from './assets/LandingInfosys.svg';
import Zoho from './assets/LandingZoho.svg';
import WiproLogo from './assets/LandingWipro.svg';
import TCS from './assets/LandingTcs.svg';

// --- Assets Footer ---
import PhoneIcon from './assets/Phoneicon.svg';
import LandlineIcon from './assets/Landlineicon.svg';
import MailIcon from './assets/Mailicon.svg';
import Instagram from './assets/Instagramicon.svg';
import InstagramHover from './assets/Instagramicon-hover.svg';
import LinkedIn from './assets/Linkedinicon.svg';
import LinkedInHover from './assets/Linkedinicon-hover.svg';
import Twitter from './assets/Twittericon.svg';
import TwitterHover from './assets/Twittericon-hover.svg';

// --- College images are now loaded from the database (GridFS) ---

const HeroSection = ({ collegeImages, imagesLoading }) => {
  // College images loaded from database (GridFS) - no static fallbacks
  const bannerLogo = collegeImages?.collegeBanner || null;
  const naacCert = collegeImages?.naacCertificate || null;
  const nbaCert = collegeImages?.nbaCertificate || null;
  
  // Check if certificates are missing to make banner full-width
  const hasCertificates = naacCert || nbaCert;

  return (
    <>
      <div className={styles['hero-container']} id="home">
        {imagesLoading ? (
          <div className={styles['college-info-bar']}>
            <BannerSkeleton />
          </div>
        ) : (
          (bannerLogo || naacCert || nbaCert) && (
            <div className={styles['college-info-bar']}>
              {bannerLogo && (
                <img 
                  src={bannerLogo} 
                  alt="College Logo" 
                  className={styles['ksr-logo']}
                  style={!hasCertificates ? { maxWidth: '100%' } : {}}
                />
              )}
              {naacCert && <img src={naacCert} alt="NAAC Accreditation" className={styles['accreditation-logo']} />}
              {nbaCert && <img src={nbaCert} alt="NBA Accreditation" className={styles['accreditation-nba-logo']} />}
            </div>
          )
        )}
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
        {!isLoading && students.length > 0 && (
          <>
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
          </>
        )}
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

const KSRSection = ({ collegeImages, imagesLoading }) => {
  const footerBanner = collegeImages?.collegeBanner || null;

  return (
    <div className={styles['page-wrapper']}>
      <footer className={styles['main-footer']} id="contact">
        <div className={styles['footer-content']}>
          {/* Left section: logo + address */}
          <div className={styles['footer-left-section']}>
            {imagesLoading ? (
              <div className={styles['footer-info-box']}>
                <FooterBannerSkeleton />
              </div>
            ) : (
              footerBanner && (
              <div className={styles['footer-info-box']}>
                <img
                  src={footerBanner}
                  alt="College Logo"
                  className={styles['footer-logo-img']}
                />
              </div>
              )
            )}
            <div className={styles['address-text']}>
              <p>K.S.R College of Engineering, K.S.R. Kalvi Nagar</p>
              <p>Tiruchengode - 637215 Namakkal (D.t)</p>
            </div>
          </div>

          {/* Right section: Link Groups as per screenshot */}
          <div className={styles['footer-links-group']}>
            <div className={styles['footer-link-col']}>
              <h3 className={styles['footer-heading']}>Career & Growth :</h3>
              <ul className={styles['footer-list']}>
                <li className={styles['footer-list-item']}>Skill Development</li>
                <li className={styles['footer-list-item']}>Industrial Training</li>
                <li className={styles['footer-list-item']}>Value Added Courses</li>
                <li className={styles['footer-list-item']}>Internship Program</li>
              </ul>
            </div>

            <div className={styles['footer-link-col']}>
              <h3 className={styles['footer-heading']}>Trust & Recognition :</h3>
              <ul className={styles['footer-list']}>
                <li className={styles['footer-list-item']}>Approvals & Affiliations</li>
                <li className={styles['footer-list-item']}>NAAC & NBA Status</li>
                <li className={styles['footer-list-item']}>NIRF Ranking</li>
                <li className={styles['footer-list-item']}>Mandatory Disclosures</li>
              </ul>
            </div>

            <div className={styles['footer-link-col']}>
              <h3 className={styles['footer-heading']}>Terms :</h3>
              <ul className={styles['footer-list']}>
                <li className={styles['footer-list-item']}>Terms of Service</li>
                <li className={styles['footer-list-item']}>Privacy Policy</li>
                <li className={styles['footer-list-item']}>Cookie Policy</li>
              </ul>
            </div>

            <div className={styles['footer-link-col']}>
              <h3 className={styles['footer-heading']}>Contact Us :</h3>
              <ul className={styles['footer-list']}>
                <li className={styles['footer-list-item']}>
                  <img src={PhoneIcon} alt="Mobile" className={styles['footer-icon']} />
                  <span>+914288 - 274213</span>
                </li>
                <li className={styles['footer-list-item']}>
                  <img src={LandlineIcon} alt="Landline" className={styles['footer-icon']} />
                  <span>04288 - 274757</span>
                </li>
                <li className={styles['footer-list-item']}>
                  <img src={MailIcon} alt="Email" className={styles['footer-icon']} />
                  <span>principal@ksrce.ac.in</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row: copyright + social icons */}
        <div className={styles['footer-bottom']}>
          <p className={styles['footer-copy-text']}>
            © K S R College Of Engineering . All rights Reserved.
          </p>
          <div className={styles['footer-social-icons']}>
            <a
              href="https://www.instagram.com/ksrce_official?igsh=NGFsbXJvdVdzaEMTQW"
              target="_blank"
              rel="noopener noreferrer"
              className={styles['social-link']}
            >
              <img src={Instagram} alt="Instagram" className={`${styles['social-icon-img']} ${styles['instagram-icon']} ${styles['icon-default']}`} />
              <img src={InstagramHover} alt="Instagram" className={`${styles['social-icon-img']} ${styles['instagram-icon']} ${styles['icon-hover']}`} />
            </a>
            <a
              href="https://www.linkedin.com/school/ksrce-official/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles['social-link']}
            >
              <img src={LinkedIn} alt="LinkedIn" className={`${styles['social-icon-img']} ${styles['linkedin-icon']} ${styles['icon-default']}`} />
              <img src={LinkedInHover} alt="LinkedIn" className={`${styles['social-icon-img']} ${styles['linkedin-icon']} ${styles['icon-hover']}`} />
            </a>
            <a
              href="https://x.com/ksrceofficial?t=xeX8YvmxJSOZBMQILjGSuQ&s=09"
              target="_blank"
              rel="noopener noreferrer"
              className={styles['social-link']}
            >
              <img src={Twitter} alt="Twitter" className={`${styles['social-icon-img']} ${styles['twitter-icon']} ${styles['icon-default']}`} />
              <img src={TwitterHover} alt="Twitter" className={`${styles['social-icon-img']} ${styles['twitter-icon']} ${styles['icon-hover']}`} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const LandingPageContent = () => {
  const [collegeImages, setCollegeImages] = useState(null);
  const [placedStudentsData, setPlacedStudentsData] = useState(null);
  const [companyDrivesData, setCompanyDrivesData] = useState(null);
  const [imagesLoading, setImagesLoading] = useState(true);

  useEffect(() => {
    // Change favicon to default (purple) for landing page
    changeFavicon(FAVICON_TYPES.DEFAULT);

    // Fetch ALL landing page data in PARALLEL with caching
    const loadAllData = async () => {
      try {
        setImagesLoading(true);
        const { placedStudents, companyDrives, collegeImages: images } = await fetchAllLandingData();
        
        // Set all state at once - React batches these updates
        setPlacedStudentsData(placedStudents);
        setCompanyDrivesData(companyDrives);
        if (images) setCollegeImages(images);
      } catch (error) {
        console.error('Landing page data fetch error:', error);
      } finally {
        setImagesLoading(false);
      }
    };
    loadAllData();
    
    // Listen for college images updates from admin profile (same tab)
    const handleCollegeImagesUpdate = async () => {
      console.log('🔔 College images updated event received - refreshing...');
      try {
        // CRITICAL: Clear cache BEFORE fetching to ensure fresh data from MongoDB
        clearCollegeImagesCache();
        console.log('🗑️ Landing page cache forcefully cleared before refetch');
        
        // Show skeleton while reloading (only images, not the whole page)
        setImagesLoading(true);
        
        // Fetch ONLY college images (not students/drives) for speed
        const images = await fetchCollegeImagesPublic();
        if (images) {
          setCollegeImages(images);
          console.log('✅ College images refreshed on landing page with fresh data');
        } else {
          // If images are null/empty, clear the display
          setCollegeImages(null);
          console.log('✅ College images cleared (admin removed certificates)');
        }
      } catch (error) {
        console.error('Failed to refresh college images:', error);
      } finally {
        setImagesLoading(false);
      }
    };
    
    // Cross-tab sync: listen for localStorage changes from admin profile (different tab)
    const handleStorageChange = (e) => {
      // Admin profile writes this signal key after saving college details
      if (e.key === 'collegeImagesUpdatedSignal') {
        console.log('🔔 Cross-tab college images update detected');
        handleCollegeImagesUpdate();
      }
    };
    
    window.addEventListener('collegeImagesUpdated', handleCollegeImagesUpdate);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('collegeImagesUpdated', handleCollegeImagesUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    // 2. USE SCOPED WRAPPER FROM MODULE
    <div className={styles['landing-page-container']}>
      <Navbar />
      <main className={styles['main-content']}>
        <HeroSection collegeImages={collegeImages} imagesLoading={imagesLoading} />
        <PlacementPage placedStudentsData={placedStudentsData} />
        <PlacementSection companyDrivesData={companyDrivesData} />
        <KSRSection collegeImages={collegeImages} imagesLoading={imagesLoading} />
      </main>
    </div>
  );
};

export default LandingPageContent;