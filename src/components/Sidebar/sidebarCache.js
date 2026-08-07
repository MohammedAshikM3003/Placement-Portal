export const sidebarCache = {
  cachedStudentData: null,
  cacheTimestamp: null,
  clear() {
    this.cachedStudentData = null;
    this.cacheTimestamp = null;
    localStorage.removeItem('cachedProfilePicUrl');
    console.log('🗑️ Sidebar cache cleared');
  },
  updateProfilePic(url) {
    if (this.cachedStudentData) {
      this.cachedStudentData.profilePicURL = url;
    }
    console.log('📸 Sidebar: Profile pic cache updated', url);
  }
};
