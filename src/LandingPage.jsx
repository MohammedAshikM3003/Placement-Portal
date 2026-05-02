import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HashLink } from 'react-router-hash-link';
// 1. Import CSS Module
import styles from './LandingPage.module.css';
import navbarStyles from './components/Navbar/LandingNavbar.module.css';
import { fetchAllLandingData, clearCollegeImagesCache, fetchCollegeImagesPublic, getCachedLandingData } from './services/landingPageCacheService';
import { PlacedStudentsSkeleton, DrivesSkeleton, BannerSkeleton, FooterBannerSkeleton } from './components/SkeletonLoader/SkeletonLoader';
import { changeFavicon, FAVICON_TYPES } from './utils/faviconUtils';
import { API_BASE_URL } from './utils/apiConfig';

// --- Assets (Fallback images) ---
import StudentIcon from './assets/LandingStudentIcon.png';
import Infosis from './assets/LandingInfosys.svg';
import Zoho from './assets/LandingZoho.svg';
import WiproLogo from './assets/LandingWipro.svg';
import TCS from './assets/LandingTcs.svg';

// --- Navbar Assets ---
import Adminicon from "./assets/Adminicon.png";
import Home from "./assets/landingHomeicon.svg";
import About from "./assets/landingabouticon.svg";
import Drives from "./assets/landingDrivesicon.svg";
import Contact from "./assets/landingContacticon.svg";

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

const BANNER_CLICK_THRESHOLD = 11;

// Navbar Component (integrated from LandingNavbar.js)
const Navbar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const openSidebar = () => {
    setSidebarOpen(true);
    updateActiveSection(); // Update active section when opening sidebar
  };

  const updateActiveSection = () => {
    const hash = window.location.hash.replace('#', '').split('?')[0];
    if (hash === 'about') {
      setActiveSection('about');
    } else if (hash === 'drive') {
      setActiveSection('drive');
    } else if (hash === 'contact') {
      setActiveSection('contact');
    } else {
      setActiveSection('home'); // Default to home
    }
  };

  useEffect(() => {
    // Track current hash location
    const handleHashChange = () => {
      updateActiveSection();
    };

    window.addEventListener('hashchange', handleHashChange);
    updateActiveSection(); // Call on mount
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <header className={navbarStyles['main-header']}>
      <div className={navbarStyles['header-logo']}>
        <img src={Adminicon} alt="Placement Portal Icon" className={navbarStyles['header-logo-img']} />
        <span>Placement Portal</span>
      </div>
      
      <nav className={navbarStyles['header-nav']}>
        {/* HashLinks for smooth scrolling */}
        <HashLink smooth to="/#home">Home</HashLink>
        <HashLink smooth to="/#about">About</HashLink>
        <HashLink smooth to="/#drive">Drives</HashLink>
        <HashLink smooth to="/#contact">Contact</HashLink>
      </nav>
      
      {/* Mobile Hamburger Menu */}
      <button 
        className={navbarStyles['hamburger-menu']}
        onClick={() => {
          if (!sidebarOpen) {
            openSidebar();
          } else {
            closeSidebar();
          }
        }}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Mobile Sidebar */}
      <div className={`${navbarStyles['mobile-sidebar']} ${sidebarOpen ? navbarStyles['sidebar-open'] : ''}`}>
        <nav className={navbarStyles['sidebar-nav']}>
          <HashLink 
            smooth 
            to="/#home" 
            onClick={closeSidebar} 
            className={`${navbarStyles['sidebar-link']} ${activeSection === 'home' ? navbarStyles['sidebar-link-active'] : ''}`}
          >
            <img src={Home} alt="Home" className={navbarStyles['sidebar-icon']} />
            <span>Home</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#about" 
            onClick={closeSidebar} 
            className={`${navbarStyles['sidebar-link']} ${activeSection === 'about' ? navbarStyles['sidebar-link-active'] : ''}`}
          >
            <img src={About} alt="About" className={navbarStyles['sidebar-icon']} />
            <span>About</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#drive" 
            onClick={closeSidebar} 
            className={`${navbarStyles['sidebar-link']} ${activeSection === 'drive' ? navbarStyles['sidebar-link-active'] : ''}`}
          >
            <img src={Drives} alt="Drives" className={navbarStyles['sidebar-icon']} />
            <span>Drives</span>
          </HashLink>
          <HashLink 
            smooth 
            to="/#contact" 
            onClick={closeSidebar} 
            className={`${navbarStyles['sidebar-link']} ${activeSection === 'contact' ? navbarStyles['sidebar-link-active'] : ''}`}
          >
            <img src={Contact} alt="Contact" className={navbarStyles['sidebar-icon']} />
            <span>Contact</span>
          </HashLink>
        </nav>
        <Link to="/mainlogin" onClick={closeSidebar} className={navbarStyles['sidebar-login-btn']}>Login</Link>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className={navbarStyles['sidebar-overlay']}
          onClick={closeSidebar}
        ></div>
      )}
    </header>
  );
};

const HeroSection = ({ collegeImages, imagesLoading, onTopBannerClick }) => {
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
                  onClick={onTopBannerClick}
                  role="button"
                  tabIndex={0}
                  style={{
                    cursor: 'pointer',
                    ...(!hasCertificates ? { maxWidth: '100%' } : {})
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onTopBannerClick();
                    }
                  }}
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

const resolveStudentPhotoUrl = (value) => {
  if (!value || typeof value !== 'string') return null;
  const source = value.trim();
  if (!source) return null;

  if (source.startsWith('data:')) return source;
  if (source.startsWith('http')) {
    const filePathMatch = source.match(/\/api\/file\/([a-f0-9]{24})/i);
    if (filePathMatch) return `${API_BASE_URL}/file/${filePathMatch[1].toLowerCase()}`;
    return source;
  }

  if (source.startsWith('/api/file/')) return `${API_BASE_URL}${source.replace('/api', '')}`;
  if (source.startsWith('/file/')) return `${API_BASE_URL}${source}`;

  const embeddedPathMatch = source.match(/\/api\/file\/([a-f0-9]{24})/i);
  if (embeddedPathMatch) return `${API_BASE_URL}/file/${embeddedPathMatch[1].toLowerCase()}`;

  if (/^[a-f0-9]{24}$/i.test(source)) return `${API_BASE_URL}/file/${source.toLowerCase()}`;
  return source;
};

const PlacementPage = ({ placedStudentsData, isMobile }) => {
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
        profilePhoto: resolveStudentPhotoUrl(student.profilePicURL || student.profilePhoto)
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

  // On mobile, animate when there is more than one card (one-card view layout).
  // On desktop, keep existing threshold to avoid unnecessary movement for short lists.
  const shouldAnimate = isMobile ? students.length > 1 : students.length > 4;
  const scrollingStudents = shouldAnimate ? [...students, ...students] : students;

  return (
    <div className={styles['placement-container-wrapper']} id="about">
      <div className={styles['placement-container']}>
        {!isLoading && students.length > 0 && (
          <>
            <h2 className={styles['section-title']}>PLACEMENT HIGHLIGHTS</h2>
            <div className={styles['highlights-wrapper']}>
              <div className={styles['placement-highlight-card']} style={{backgroundColor:'#ffffff',backgroundImage:'linear-gradient(180deg, #DDEBFF 0%, #FFFFFF 100%)',borderRadius:'24px',border:'1px solid #BABABA',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
                <p className={styles['highlight-value']} style={{fontSize:'3.5rem',fontWeight:700,color:'#022893',margin:'0 0 10px 0',lineHeight:1}}>100%</p>
                <p className={styles['highlight-label']} style={{fontSize:'1.2rem',color:'#022893',fontWeight:500,margin:0}}>Placement rate</p>
              </div>
              <div className={`${styles['placement-highlight-card']} ${styles['highlight-special']}`} style={{backgroundColor:'#ffffff',backgroundImage:'linear-gradient(180deg, #FFEDD5 0%, #FFFFFF 100%)',borderRadius:'24px',border:'1px solid #BABABA',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
                <p className={styles['highlight-value']} style={{fontSize:'3.5rem',fontWeight:700,color:'rgb(212, 116, 86)',margin:'0 0 10px 0',lineHeight:1}}>{stats.highestPackage}</p>
                <p className={styles['highlight-label']} style={{fontSize:'1.2rem',color:'#D97706',fontWeight:500,margin:0}}>Highest Package</p>
              </div>
              <div className={styles['placement-highlight-card']} style={{backgroundColor:'#ffffff',backgroundImage:'linear-gradient(180deg, #DDEBFF 0%, #FFFFFF 100%)',borderRadius:'24px',border:'1px solid #BABABA',boxShadow:'0 10px 25px rgba(0,0,0,0.1)'}}>
                <p className={styles['highlight-value']} style={{fontSize:'3.5rem',fontWeight:700,color:'#022893',margin:'0 0 10px 0',lineHeight:1}}>{stats.averagePackage}</p>
                <p className={styles['highlight-label']} style={{fontSize:'1.2rem',color:'#022893',fontWeight:500,margin:0}}>Average Package</p>
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

const PlacementSection = ({ companyDrivesData, isMobile }) => {
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

  const shouldAnimateDrives = isMobile ? driveData.length > 1 : driveData.length > 5;

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
            <div className={`${styles['drive-cards-container']} ${shouldAnimateDrives ? styles['animate-marquee'] : ''}`}>
              {driveData.map((drive, index) => (
                <div className={styles['drive-card']} key={`drive-${index}`}>
                  <div className={`${styles['company-initial-circle']} ${styles[drive.gradient]}`}>{drive.initial}</div>
                  <h3>{drive.name}</h3>
                  <p>Date : {drive.date}</p>
                  <p>Package : {drive.package}</p>
                </div>
              ))}
              {/* Duplicate cards only when marquee animation is enabled for smooth looping. */}
              {shouldAnimateDrives && driveData.map((drive, index) => (
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
      <section className={styles['department-section']}>
        <h2>Developed by the Department of</h2>
        <p className={styles['department-text']}>Computer Science and Engineering</p>
      </section>
    </div>
  );
};

const teamMembers = [
  {
    name: 'Maneesh Adhithya S',
    role: 'UI/UX & Graphics Designer',
    color: '#4F46E5',
    linkedin: 'https://www.linkedin.com/in/s-maneesh-adhithya-manju-8a72b6292/',
    email: 'smaneeshmanju07@gmail.com'
  },
  {
    name: 'Ravinder Singh',
    role: 'Student Frontend Developer',
    color: '#2085f6',
    linkedin: 'https://www.linkedin.com/in/ravinder-singh-9b1147292',
    email: 'singhravinder9680@gmail.com'
  },
  {
    name: 'Gourinath S',
    role: 'Coordinator Frontend Developer',
    color: '#D23B42'
  },
  {
    name: 'Kiruthika P',
    role: 'Admin Frontend Developer',
    color: '#3a9b4a',
    linkedin: 'https://www.linkedin.com/in/kiruthika-palaniyappan',
    email: 'pkiruthika59@gmail.com'
  },
  {
    name: 'Teena S',
    role: 'Testing & Code optimizer',
    color: '#2568c5',
    linkedin: 'https://www.linkedin.com/in/teenadevi/',
    email: 'teenadevi5052@gmail.com'
  },
  {
    name: 'Mohammed Ashik M',
    role: 'Team Lead & Backend Developer',
    color: '#FA7B20',
    linkedin: 'https://www.linkedin.com/in/mohammedashikm3003/',
    email: 'mmohammedashik2006@gmail.com'
  }
];

const GraduationCapIcon = () => (
  <svg viewBox="0 0 640 512" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M320 32c-8.1 0-16.1 1.4-23.7 4.1L15.8 137.4C6.3 140.9 0 149.9 0 160s6.3 19.1 15.8 22.6l57.9 20.9C57.3 229.3 48 259.8 48 291.9V320c0 28.4-10.8 57.7-22.3 80.8c-6.5 13-13.9 25.8-22.5 37.6c-3.2 4.3-4.1 9.9-2.3 15s6 8.9 11.2 10.2l64 16c4.2 1.1 8.7.3 12.4-2s6.3-6.1 7.1-10.4c8.6-42.8 4.3-81.2-2.1-108.7c-3.2-14.2-7.5-28.7-13.5-42v-24.6c0-30.2 10.2-58.7 27.9-81.5c12.9-15.5 29.6-28 49.2-35.7l157-61.7c8.2-3.2 17.5.8 20.7 9s-.8 17.5-9 20.7l-157 61.7c-12.4 4.9-23.3 12.4-32.2 21.6l159.6 57.6c7.6 2.7 15.6 4.1 23.7 4.1s16.1-1.4 23.7-4.1l280.6-101c9.5-3.4 15.8-12.5 15.8-22.6s-6.3-19.1-15.8-22.6L343.7 36.1c-7.6-2.7-15.6-4.1-23.7-4.1M128 408c0 35.3 86 72 192 72s192-36.7 192-72l-15.3-145.4L354.5 314c-11.1 4-22.8 6-34.5 6s-23.5-2-34.5-6l-142.2-51.4z"
    />
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path fill="currentColor" fillRule="evenodd" d="M3 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm1.102 4.297a1.195 1.195 0 1 0 0-2.39a1.195 1.195 0 0 0 0 2.39m1 7.516V6.234h-2v6.579zM6.43 6.234h2v.881c.295-.462.943-1.084 2.148-1.084c1.438 0 2.219.953 2.219 2.766c0 .087.008.484.008.484v3.531h-2v-3.53c0-.485-.102-1.438-1.18-1.438c-1.079 0-1.17 1.198-1.195 1.982v2.986h-2z" clipRule="evenodd" />
  </svg>
);

const GmailIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="currentColor" fillRule="evenodd" d="M5 20a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3zM7.625 8.22a1 1 0 1 0-1.25 1.56l3.75 3.001a3 3 0 0 0 3.75 0l3.75-3a1 1 0 1 0-1.25-1.562l-3.75 3a1 1 0 0 1-1.25 0z" clipRule="evenodd" />
  </svg>
);

const TeamSection = () => {
  return (
    <section className={styles['team-section']} aria-labelledby="team-section-title">
      <h2 className={styles['team-section-title']} id="team-section-title">MEET OUR TEAM</h2>

      <div className={styles['team-grid']}>
        {teamMembers.map((member) => (
          <article className={styles['team-card']} key={member.name} style={{ '--member-color': member.color }}>
            <div className={styles['team-icon-circle']} style={{ backgroundColor: member.color }}>
              <GraduationCapIcon />
            </div>
            <h3 className={styles['team-member-name']}>{member.name}</h3>
            <p className={styles['team-member-role']}>{member.role}</p>
            <div className={styles['team-contact-row']} aria-label={`${member.name} contact icons`}>
              {member.linkedin ? (
                <a
                  className={styles['team-contact-icon']}
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} LinkedIn profile`}
                >
                  <LinkedInIcon />
                </a>
              ) : (
                <span className={styles['team-contact-icon']} aria-hidden="true">
                  <LinkedInIcon />
                </span>
              )}
              {member.email ? (
                <a
                  className={styles['team-contact-icon']}
                  href={`mailto:${member.email}`}
                  aria-label={`Email ${member.name}`}
                >
                  <GmailIcon />
                </a>
              ) : (
                <span className={styles['team-contact-icon']} aria-hidden="true">
                  <GmailIcon />
                </span>
              )}
            </div>
          </article>
        ))}
      </div>

    </section>
  );
};

const KSRSection = ({ collegeImages, imagesLoading, onFooterBannerClick }) => {
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
                  onClick={onFooterBannerClick}
                  role="button"
                  tabIndex={0}
                  style={{ cursor: 'pointer' }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onFooterBannerClick();
                    }
                  }}
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
  const navigate = useNavigate();
  // Hydrate from cache synchronously — avoids skeleton flash on re-mount
  const cached = useMemo(() => getCachedLandingData(), []);
  const hasCachedImages = !!cached.collegeImages;

  const [collegeImages, setCollegeImages] = useState(cached.collegeImages);
  const [placedStudentsData, setPlacedStudentsData] = useState(cached.placedStudents);
  const [companyDrivesData, setCompanyDrivesData] = useState(cached.companyDrives);
  const [imagesLoading, setImagesLoading] = useState(!hasCachedImages);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });
  const [footerBannerClicks, setFooterBannerClicks] = useState(0);
  const [topBannerClicks, setTopBannerClicks] = useState(0);

  useEffect(() => {
    // Ensure old persisted counters from previous builds never carry over.
    localStorage.removeItem('collegeBannerTopClickCount');
    localStorage.removeItem('collegeBannerFooterClickCount');
    localStorage.removeItem('sastuUnlockTopCountV2');
    localStorage.removeItem('sastuUnlockFooterCountV2');
  }, []);

  const handleFooterBannerClick = () => {
    const nextFooterCount = Math.min(BANNER_CLICK_THRESHOLD, footerBannerClicks + 1);
    setFooterBannerClicks(nextFooterCount);
  };

  const handleTopBannerClick = () => {
    // Sequence lock: top banner only starts counting after footer reaches 11.
    if (footerBannerClicks < BANNER_CLICK_THRESHOLD) {
      return;
    }

    const nextTopCount = Math.min(BANNER_CLICK_THRESHOLD, topBannerClicks + 1);
    setTopBannerClicks(nextTopCount);

    if (nextTopCount >= BANNER_CLICK_THRESHOLD) {
      setFooterBannerClicks(0);
      setTopBannerClicks(0);
      navigate('/sastu-page');
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Change favicon to default (purple) for landing page
    changeFavicon(FAVICON_TYPES.DEFAULT);

    // Fetch ALL landing page data in PARALLEL with caching
    const loadAllData = async () => {
      try {
        // Only show skeleton if we have no cached data at all
        if (!hasCachedImages) setImagesLoading(true);
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
        <HeroSection
          collegeImages={collegeImages}
          imagesLoading={imagesLoading}
          onTopBannerClick={handleTopBannerClick}
        />
        <PlacementPage placedStudentsData={placedStudentsData} isMobile={isMobile} />
        <PlacementSection companyDrivesData={companyDrivesData} isMobile={isMobile} />
        <TeamSection />
        <KSRSection
          collegeImages={collegeImages}
          imagesLoading={imagesLoading}
          onFooterBannerClick={handleFooterBannerClick}
        />
      </main>
    </div>
  );
};

export default LandingPageContent;