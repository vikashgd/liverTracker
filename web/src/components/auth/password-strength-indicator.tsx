interface PasswordStrengthIndicatorProps {
  password: string;
  strength: 'weak' | 'medium' | 'strong' | null;
  errors?: string[];
  showRequirements?: boolean;
}

export default function PasswordStrengthIndicator({
  password,
  strength,
  errors = [],
  showRequirements = false
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const getStrengthColor = () => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'weak': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthWidth = () => {
    switch (strength) {
      case 'strong': return 'w-full';
      case 'medium': return 'w-2/3';
      case 'weak': return 'w-1/3';
      default: return 'w-0';
    }
  };

  const getStrengthTextColor = () => {
    switch (strength) {
      case 'strong': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'weak': return 'text-red-600';
      default: return 'text-gray-400';
    }
  };

  const requirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(password) },
    { text: 'Contains number', met: /\d/.test(password) },
    { text: 'Contains special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()} ${getStrengthWidth()}`}
          />
        </div>
        <span className={`text-xs font-medium ${getStrengthTextColor()}`}>
          {strength ? strength.charAt(0).toUpperCase() + strength.slice(1) : ''}
        </span>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-red-600">{error}</p>
          ))}
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-700">Password requirements:</p>
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full flex items-center justify-center ${
                req.met ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {req.met ? (
                  <svg className="w-2 h-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                )}
              </div>
              <span className={`text-xs ${req.met ? 'text-green-600' : 'text-gray-500'}`}>
                {req.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}