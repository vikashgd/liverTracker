"use client";

interface MobileSubmitButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  onClick?: () => void;
}

export default function MobileSubmitButton({
  children,
  loading = false,
  disabled = false,
  type = "submit",
  variant = "primary",
  size = "lg",
  fullWidth = true,
  onClick
}: MobileSubmitButtonProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "secondary":
        return "bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200 focus:ring-gray-500";
      case "danger":
        return "bg-red-600 text-white border-red-600 hover:bg-red-700 focus:ring-red-500";
      default:
        return "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "px-4 py-2 text-sm min-h-[40px]";
      case "md":
        return "px-6 py-3 text-base min-h-[44px]";
      default:
        return "px-8 py-4 text-base min-h-[48px]";
    }
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${fullWidth ? "w-full" : ""}
        ${getSizeClasses()}
        ${getVariantClasses()}
        border rounded-lg font-medium
        focus:outline-none focus:ring-2 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        flex items-center justify-center
        touch-manipulation
        select-none
        ${isDisabled ? "pointer-events-none" : "active:scale-95"}
      `}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {loading ? (
        <>
          <svg 
            className="animate-spin -ml-1 mr-3 h-5 w-5" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Processing...
        </>
      ) : (
        children
      )}
    </button>
  );
}