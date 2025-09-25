import React from 'react';

interface PickplaceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PickplaceLogo: React.FC<PickplaceLogoProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image Only */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img
          src="/logo.png"
          alt="Pickplace Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default PickplaceLogo;
