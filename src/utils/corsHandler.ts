/**
 * CORS Handler Utility
 * Giải quyết vấn đề CORS cache trong browser
 */

// Keys cho remember me
const REMEMBER_EMAIL_KEY = "app:remember_email";
const REMEMBER_ME_KEY = "app:remember_me";

/**
 * Clear tất cả cache liên quan đến auth (KHÔNG xóa remember me)
 */
export const clearAuthCache = () => {
  // Lưu remember me data trước khi clear
  const rememberEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY);
  
  // Clear auth tokens
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("app:role");
  
  // Restore remember me data
  if (rememberEmail) {
    localStorage.setItem(REMEMBER_EMAIL_KEY, rememberEmail);
  }
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe);
  }
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear Service Worker cache (nếu có)
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  console.log("✅ Cleared auth cache (kept remember me data)");
};

/**
 * Clear TOÀN BỘ including remember me (dùng khi logout)
 */
export const clearAllAuthData = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("app:role");
  localStorage.removeItem(REMEMBER_EMAIL_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.clear();
  
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
  
  console.log("✅ Cleared ALL auth data including remember me");
};

/**
 * Kiểm tra và xử lý stale token
 * Gọi hàm này khi app khởi động
 */
export const handleStaleToken = () => {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    return false;
  }
  
  try {
    // Decode JWT để check expiry
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    // Nếu token đã hết hạn, clear ngay
    if (payload.exp && payload.exp < now) {
      console.warn("⚠️ Token expired, clearing cache");
      clearAuthCache();
      return false;
    }
    
    return true;
  } catch {
    // Token không hợp lệ, clear luôn
    console.error("❌ Invalid token format, clearing cache");
    clearAuthCache();
    return false;
  }
};

/**
 * Force reload page với cache buster
 */
export const hardReload = () => {
  // Thêm timestamp vào URL để bypass cache
  const url = new URL(window.location.href);
  url.searchParams.set('_t', Date.now().toString());
  window.location.href = url.toString();
};

/**
 * Clear cache và reload
 */
export const clearCacheAndReload = () => {
  clearAuthCache();
  
  // Delay một chút để đảm bảo clear xong
  setTimeout(() => {
    window.location.reload();
  }, 100);
};
