import React from 'react';

interface PickplaceLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'black';
  className?: string;
}

const PickplaceLogo: React.FC<PickplaceLogoProps> = ({ 
  size = 'md', 
  variant = 'default',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-16',
    md: 'w-24',
    lg: 'w-28'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Logo Image Only */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img
          src={variant === 'black' ? '/logo_black.png' : '/logo.png'}
          alt="Pickplace Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default PickplaceLogo;
