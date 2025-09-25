import React from 'react';

interface PickplaceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const PickplaceLogo: React.FC<PickplaceLogoProps> = ({ 
  size = 'md', 
  showText = true, 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Symbol */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 40"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Orange background shape */}
          <path
            d="M8 4C8 2.89543 8.89543 2 10 2H30C31.1046 2 32 2.89543 32 4V36C32 37.1046 31.1046 38 30 38H10C8.89543 38 8 37.1046 8 36V4Z"
            fill="#F97316"
            stroke="#F97316"
            strokeWidth="0.5"
          />
          {/* P shape cutout */}
          <path
            d="M12 8C12 6.89543 12.8954 6 14 6H24C25.1046 6 26 6.89543 26 8V18C26 19.1046 25.1046 20 24 20H20V28C20 29.1046 19.1046 30 18 30H14C12.8954 30 12 29.1046 12 28V8Z"
            fill="white"
          />
          {/* P vertical line */}
          <rect x="14" y="6" width="2" height="24" fill="#F97316" />
          {/* P horizontal line */}
          <rect x="14" y="6" width="8" height="2" fill="#F97316" />
          {/* P middle line */}
          <rect x="14" y="12" width="8" height="2" fill="#F97316" />
        </svg>
      </div>
      
      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`font-bold text-gray-900 dark:text-white ${textSizeClasses[size]}`}>
            Pickplace
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
            PROUDLY BANGLADESHI
          </div>
        </div>
      )}
    </div>
  );
};

export default PickplaceLogo;
