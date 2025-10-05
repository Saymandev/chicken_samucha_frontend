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
    sm: 'w-24',
    md: 'w-32',
    lg: 'w-36'
  };

  return (
    <div className={`flex items-center  ${className}`}>
      {/* Logo Image Only */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <img
          src={variant === 'black' ? '/logo_black.png?v=5' : '/logo.png?v=5'} 
          alt="Rongdhunu Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
};

export default PickplaceLogo;
