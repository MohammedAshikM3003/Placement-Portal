import React, { useState, useEffect } from 'react';
import styles from './PageLayout.module.css';

const PageLayout = ({ children, navbar, sidebar }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleCloseSidebar = () => setIsSidebarOpen(false);
    window.addEventListener('closeSidebar', handleCloseSidebar);
    return () => window.removeEventListener('closeSidebar', handleCloseSidebar);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((v) => !v);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const navbarElement = navbar
    ? React.cloneElement(navbar, { onToggleSidebar: toggleSidebar })
    : null;

  const sidebarElement = sidebar
    ? React.cloneElement(sidebar, { isOpen: isSidebarOpen, onClose: closeSidebar })
    : null;

  return (
    <div className={styles.page}>
      {navbarElement}
      <div className={styles.layout}>
        {sidebarElement}
        {isSidebarOpen && (
          <div className={styles.overlay} onClick={closeSidebar} />
        )}
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageLayout;
