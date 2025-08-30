interface SuccessMessageProps {
  message: string;
  title?: string;
  showIcon?: boolean;
  className?: string;
}

export default function SuccessMessage({
  message,
  title,
  showIcon = true,
  className = ""
}: SuccessMessageProps) {
  return (
    <div className={`rounded-md bg-green-50 border border-green-200 p-4 ${className}`}>
      <div className="flex">
        {showIcon && (
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        <div className={showIcon ? "ml-3" : ""}>
          {title && (
            <h3 className="text-sm font-medium text-green-800 mb-1">
              {title}
            </h3>
          )}
          <div className="text-sm text-green-700">
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}