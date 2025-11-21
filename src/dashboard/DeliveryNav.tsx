import { Link, useLocation } from "react-router-dom";
import { deliveryNav } from "@/dashboard/nav/delivery";
import { clsx } from "clsx";

export default function DeliveryNav() {
  const location = useLocation();
  const nav = deliveryNav();

  const isActive = (path?: string) => {
    return path ? location.pathname === path : false;
  };

  return (
    <nav className="sticky top-16 sm:top-[68px] z-40 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide py-2 sm:py-2.5 -mx-2 px-2 sm:mx-0 sm:px-0">
          {nav.main.map(
            (item) =>
              item.path && (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors shrink-0",
                    isActive(item.path)
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="hidden xs:inline sm:inline">
                    {item.name}
                  </span>
                </Link>
              )
          )}

          {nav.others && nav.others.length > 0 && (
            <>
              <div className="w-px bg-gray-200 dark:bg-gray-700 my-1.5 sm:my-2 shrink-0" />
              {nav.others.map(
                (item) =>
                  item.path && (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={clsx(
                        "flex items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors shrink-0",
                        isActive(item.path)
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700"
                      )}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <span className="hidden xs:inline sm:inline">
                        {item.name}
                      </span>
                    </Link>
                  )
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
