import { useState, useRef, useEffect } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface CustomDropdownProps {
  id: string;
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CustomDropdown({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = "Chọn...",
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="flex flex-col gap-1 min-w-[180px]" ref={dropdownRef}>
      <label
        htmlFor={id}
        className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap"
      >
        {label}
      </label>
      <div className="relative">
        <button
          id={id}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="appearance-none rounded-xl border border-gray-300 bg-white pl-3 pr-10 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-emerald-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-emerald-500 cursor-pointer w-full text-left whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {selectedOption ? selectedOption.label : placeholder}
        </button>

        {/* Chevron icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <svg
            className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors overflow-hidden text-ellipsis whitespace-nowrap ${
                    value === option.value
                      ? "bg-emerald-50 text-emerald-700 font-medium dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
