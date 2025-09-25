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
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
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
