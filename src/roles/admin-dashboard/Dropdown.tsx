import type React from "react";
import { Link } from "react-router-dom";

type DropdownProps = {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
  labelledById?: string;  // id của button trigger
  menuId?: string;        // id cho <ul role="menu">
  children: React.ReactNode;
};

export const Dropdown: React.FC<DropdownProps> & {
  Item: React.FC<DropdownItemProps>;
} = ({ isOpen, onClose, className = "", labelledById, menuId, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className={`absolute right-0 mt-2 z-40 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900 ${className}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && onClose) onClose();
      }}
    >
      <ul id={menuId} role="menu" aria-labelledby={labelledById} className="py-1">
        {children}
      </ul>
    </div>
  );
};

type DropdownItemProps = {
  to?: string;
  onClick?: () => void;
  onItemClick?: () => void;
  className?: string;
  children: React.ReactNode;
  baseClassName?: string;
};

const DropdownItemImpl: React.FC<DropdownItemProps> = ({
  to,
  onClick,
  onItemClick,
  className = "",
  baseClassName = "block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 rounded-lg",
  children,
}) => {
  const classes = `${baseClassName} ${className}`.trim();
  const handle = (e: React.MouseEvent) => {
    if (!to) e.preventDefault();
    onClick?.();
    onItemClick?.();
  };

  return to ? (
    <Link to={to} className={classes} onClick={handle} role="menuitem">
      {children}
    </Link>
  ) : (
    <button onClick={handle} className={classes} role="menuitem">
      {children}
    </button>
  );
};

Dropdown.Item = DropdownItemImpl;

export default Dropdown;
