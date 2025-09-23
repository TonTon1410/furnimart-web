import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../context/ThemeContext";
import Dropdown from "./Dropdown";
import axiosClient from "@/service/axiosClient";
import { authService } from "@/service/authService";

type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
};

const ThemeToggleButton = () => {
  const { toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:bg-gray-100 hover:text-gray-700 h-11 w-11 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      aria-label="Toggle theme"
    >
      {/* moon (dark) / sun (light) giữ nguyên svg như cũ */}
      <svg
        className="hidden dark:block"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.99998 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 9.99998 4.2915C9.58577 4.2915 9.24998 3.95572 9.24998 3.5415V2.2915C9.24998 1.87729 9.58577 1.5415 9.99998 1.5415ZM10.0009 6.79327C8.22978 6.79327 6.79402 8.22904 6.79402 10.0001C6.79402 11.7712 8.22978 13.207 10.0009 13.207C11.772 13.207 13.2078 11.7712 13.2078 10.0001C13.2078 8.22904 11.772 6.79327 10.0009 6.79327ZM5.29402 10.0001C5.29402 7.40061 7.40135 5.29327 10.0009 5.29327C12.6004 5.29327 14.7078 7.40061 14.7078 10.0001C14.7078 12.5997 12.6004 14.707 10.0009 14.707C7.40135 14.707 5.29402 12.5997 5.29402 10.0001ZM15.9813 5.08035C16.2742 4.78746 16.2742 4.31258 15.9813 4.01969C15.6884 3.7268 15.2135 3.7268 14.9207 4.01969L14.0368 4.90357C13.7439 5.19647 13.7439 5.67134 14.0368 5.96423C14.3297 6.25713 14.8045 6.25713 15.0974 5.96423L15.9813 5.08035ZM18.4577 10.0001C18.4577 10.4143 18.1219 10.7501 17.7077 10.7501H16.4577C16.0435 10.7501 15.7077 10.4143 15.7077 10.0001C15.7077 9.58592 16.0435 9.25013 16.4577 9.25013H17.7077C18.1219 9.25013 18.4577 9.58592 18.4577 10.0001ZM14.9207 15.9806C15.2135 16.2735 15.6884 16.2735 15.9813 15.9806C16.2742 15.6877 16.2742 15.2128 15.9813 14.9199L15.0974 14.036C14.8045 13.7431 14.3297 13.7431 14.0368 14.036C13.7439 14.3289 13.7439 14.8038 14.0368 15.0967L14.9207 15.9806ZM9.99998 15.7088C10.4142 15.7088 10.75 16.0445 10.75 16.4588V17.7088C10.75 18.123 10.4142 18.4588 9.99998 18.4588C9.58577 18.4588 9.24998 18.123 9.24998 17.7088V16.4588C9.24998 16.0445 9.58577 15.7088 9.99998 15.7088ZM5.96356 15.0972C6.25646 14.8043 6.25646 14.3295 5.96356 14.0366C5.67067 13.7437 5.1958 13.7437 4.9029 14.0366L4.01902 14.9204C3.72613 15.2133 3.72613 15.6882 4.01902 15.9811C4.31191 16.274 4.78679 16.274 5.07968 15.9811L5.96356 15.0972ZM4.29224 10.0001C4.29224 10.4143 3.95645 10.7501 3.54224 10.7501H2.29224C1.87802 10.7501 1.54224 10.4143 1.54224 10.0001C1.54224 9.58592 1.87802 9.25013 2.29224 9.25013H3.54224C3.95645 9.25013 4.29224 9.58592 4.29224 10.0001ZM4.9029 5.9637C5.1958 6.25659 5.67067 6.25659 5.96356 5.9637C6.25646 5.6708 6.25646 5.19593 5.96356 4.90303L5.07968 4.01915C4.78679 3.72626 4.31191 3.72626 4.01902 4.01915C3.72613 4.31204 3.72613 4.78692 4.01902 5.07981L4.9029 5.9637Z"
          fill="currentColor"
        />
      </svg>
      <svg
        className="dark:hidden"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M17.4547 11.97L18.1799 12.1611C18.265 11.8383 18.1265 11.4982 17.8401 11.3266C17.5538 11.1551 17.1885 11.1934 16.944 11.4207L17.4547 11.97ZM8.0306 2.5459L8.57989 3.05657C8.80718 2.81209 8.84554 2.44682 8.67398 2.16046C8.50243 1.8741 8.16227 1.73559 7.83948 1.82066L8.0306 2.5459ZM12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524H5.49707C5.49707 11.1823 8.81835 14.5035 12.9154 14.5035V13.0035ZM16.944 11.4207C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035V14.5035C14.8657 14.5035 16.6418 13.7499 17.9654 12.5193L16.944 11.4207ZM16.7295 11.7789C15.9437 14.7607 13.2277 16.9586 10.0003 16.9586V18.4586C13.9257 18.4586 17.2249 15.7853 18.1799 12.1611L16.7295 11.7789ZM10.0003 16.9586C6.15734 16.9586 3.04199 13.8433 3.04199 10.0003H1.54199C1.54199 14.6717 5.32892 18.4586 10.0003 18.4586V16.9586ZM3.04199 10.0003C3.04199 6.77289 5.23988 4.05695 8.22173 3.27114L7.83948 1.82066C4.21532 2.77574 1.54199 6.07486 1.54199 10.0003H3.04199ZM6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657L7.48132 2.03522C6.25073 3.35885 5.49707 5.13487 5.49707 7.08524H6.99707Z"
          fill="currentColor"
        />
      </svg>
    </button>
  );
};

const AppHeader: React.FC = () => {
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [openUser, setOpenUser] = useState(false);
  const userRef = useRef<HTMLDivElement | null>(null);

  const handleToggleSidebar = () => {
    if (window.innerWidth >= 1024) toggleSidebar();
    else toggleMobileSidebar();
  };

  useEffect(() => {
    const run = async () => {
      if (!authService.isAuthenticated()) return;
      try {
        const res = await axiosClient.get<{ data: UserProfile }>("/users/profile");
        setUser(res.data.data);
      } catch {
        authService.logout();
        setUser(null);
      }
    };
    run();
  }, []);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setOpenUser(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const avatarUrl =
    user?.avatar?.startsWith("http")
      ? user.avatar!
      : user?.avatar
      ? `http://localhost:8086${user.avatar}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || "User")}&background=0ea5e9&color=fff&size=128`;

  const logout = () => {
    authService.logout();
    setUser(null);
    setOpenUser(false);
  };

  const btnId = "user-menu-button";
  const menuId = "user-menu";

  return (
    <header className="sticky top-0 z-50 w-full bg-white lg:border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between px-3 py-3 lg:px-6 lg:py-4">
        {/* Left: sidebar toggle + logo (mobile) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSidebar}
            aria-label="Toggle Sidebar"
            aria-haspopup="true"
            aria-controls={isMobileOpen ? "app-sidebar" : undefined}
            className="flex items-center justify-center w-10 h-10 lg:w-11 lg:h-11 border border-gray-200 rounded-lg text-gray-500 dark:border-gray-800 dark:text-gray-400"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M6.22 7.28a.75.75 0 1 1 1.06-1.06L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 0 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L10.94 12 6.22 7.28Z" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                <path d="M.583 1c0-.414.336-.75.75-.75h13.334c.414 0 .75.336.75.75s-.336.75-.75.75H1.333A.75.75 0 0 1 .583 1Zm0 10c0-.414.336-.75.75-.75h13.334c.414 0 .75.336.75.75s-.336.75-.75.75H1.333a.75.75 0 0 1-.75-.75ZM1.333 5.25a.75.75 0 0 0 0 1.5H8a.75.75 0 0 0 0-1.5H1.333Z" fill="currentColor"/>
              </svg>
            )}
          </button>
          <Link to="/" className="lg:hidden">
            <img className="dark:hidden" src="./images/logo/logo.svg" alt="Logo" />
            <img className="hidden dark:block" src="./images/logo/logo-dark.svg" alt="Logo" />
          </Link>
        </div>

        {/* Right: theme + user */}
        <div className="flex items-center gap-4">
          <ThemeToggleButton />

          {user ? (
            <div className="relative" ref={userRef}>
              <button
                id={btnId}
                aria-haspopup="menu"
                aria-controls={menuId}
                aria-expanded={openUser ? "true" : "false"}
                onClick={() => setOpenUser((v) => !v)}
                className="flex items-center gap-2 rounded-full border border-gray-300 dark:border-gray-700 pl-1 pr-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-100"
              >
                <img src={avatarUrl} alt="User" className="h-8 w-8 rounded-full object-cover" />
                <span className="max-w-[160px] truncate">{user.fullName}</span>
                <ChevronDown className="h-4 w-4 opacity-70" />
              </button>

              <Dropdown
                isOpen={openUser}
                onClose={() => setOpenUser(false)}
                labelledById={btnId}
                menuId={menuId}
                className="w-60"
              >
                <li role="none" className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                    {user.fullName}
                  </span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </span>
                </li>

                <Dropdown.Item to="/dashboard/profile" onItemClick={() => setOpenUser(false)}>
                  Hồ sơ cá nhân
                </Dropdown.Item>

                <Dropdown.Item
                  onClick={logout}
                  baseClassName="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <span className="inline-flex items-center gap-2"><LogOut className="h-4 w-4" /> Đăng xuất</span>
                </Dropdown.Item>
              </Dropdown>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 bg-yellow-400 text-gray-900 rounded-lg text-sm font-semibold hover:bg-yellow-300"
            >
              Đăng nhập
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
