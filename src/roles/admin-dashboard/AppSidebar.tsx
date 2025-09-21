import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { UserCircle, Table, PieChart, ChevronDown, MoreHorizontal } from "lucide-react";
import { useSidebar } from "../../context/SidebarContext";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  { icon: <UserCircle />, name: "User Profile", path: "/profile" },
  { name: "Tables", icon: <Table />, subItems: [{ name: "Basic Tables", path: "/basic-tables" }] },
];

const othersItems: NavItem[] = [
  { icon: <PieChart />, name: "Charts", subItems: [{ name: "Line Chart", path: "/line-chart" }, { name: "Bar Chart", path: "/bar-chart" }] },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered, toggleMobileSidebar } = useSidebar();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<{ type: "main" | "others"; index: number } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});
  const subRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  useEffect(() => {
    let matched = false;
    (["main", "others"] as const).forEach((type) => {
      const list = type === "main" ? navItems : othersItems;
      list.forEach((nav, i) => {
        nav.subItems?.forEach((s) => {
          if (isActive(s.path)) {
            setOpenSubmenu({ type, index: i });
            matched = true;
          }
        });
      });
    });
    if (!matched) setOpenSubmenu(null);
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      setSubMenuHeight((h) => ({ ...h, [key]: subRefs.current[key]?.scrollHeight || 0 }));
    }
  }, [openSubmenu]);

  const toggleSub = (i: number, type: "main" | "others") =>
    setOpenSubmenu((prev) => (prev && prev.type === type && prev.index === i ? null : { type, index: i }));

  const renderItems = (items: NavItem[], type: "main" | "others") => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => toggleSub(index, type)}
              className={`menu-item group ${openSubmenu?.type === type && openSubmenu?.index === index ? "menu-item-active" : "menu-item-inactive"} ${!isExpanded && !isHovered ? "lg:justify-center" : "lg:justify-start"}`}
            >
              <span className={`menu-item-icon-size ${openSubmenu?.type === type && openSubmenu?.index === index ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>{nav.icon}</span>
              {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDown className={`ml-auto w-5 h-5 transition-transform ${openSubmenu?.type === type && openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""}`} />
              )}
            </button>
          ) : (
            nav.path && (
              <Link to={nav.path} className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"}`}>
                <span className={`menu-item-icon-size ${isActive(nav.path) ? "menu-item-icon-active" : "menu-item-icon-inactive"}`}>{nav.icon}</span>
                {(isExpanded || isHovered || isMobileOpen) && <span className="menu-item-text">{nav.name}</span>}
              </Link>
            )
          )}

          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => (subRefs.current[`${type}-${index}`] = el)}
              className="overflow-hidden transition-all duration-300"
              style={{ height: openSubmenu?.type === type && openSubmenu?.index === index ? `${subMenuHeight[`${type}-${index}`]}px` : "0px" }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((s) => (
                  <li key={s.name}>
                    <Link to={s.path} className={`menu-dropdown-item ${isActive(s.path) ? "menu-dropdown-item-active" : "menu-dropdown-item-inactive"}`}>
                      {s.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {s.new && <span className={`${isActive(s.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>new</span>}
                        {s.pro && <span className={`${isActive(s.path) ? "menu-dropdown-badge-active" : "menu-dropdown-badge-inactive"} menu-dropdown-badge`}>pro</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Backdrop mobile (gộp từ Backdrop.tsx) */}
      {isMobileOpen && <div className="fixed inset-0 z-40 bg-gray-900/50 lg:hidden" onClick={toggleMobileSidebar} />}

      <aside
        id="app-sidebar"
        className={`fixed mt-16 lg:mt-0 top-0 left-0 h-screen px-5 z-40 bg-white text-gray-900 border-r border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out
          ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        onMouseEnter={() => !isExpanded && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
          <Link to="/" aria-label="Furni — Home" title="Furni">
            {isExpanded || isHovered || isMobileOpen ? (
              <span className="text-xl font-extrabold text-gray-900 dark:text-white">
                Furni<span className="text-yellow-400">.</span>
              </span>
            ) : (
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                F<span className="text-yellow-400">.</span>
              </span>
            )}
          </Link>
        </div>

        <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                  {isExpanded || isHovered || isMobileOpen ? "Menu" : <MoreHorizontal className="size-6" />}
                </h2>
                {renderItems(navItems, "main")}
              </div>
              <div>
                <h2 className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"}`}>
                  {isExpanded || isHovered || isMobileOpen ? "Others" : <MoreHorizontal />}
                </h2>
                {renderItems(othersItems, "others")}
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
