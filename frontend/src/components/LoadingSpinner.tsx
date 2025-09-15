import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative">
        <div
          className={`${sizeClasses[size]} border-4 border-gray-200 rounded-full animate-spin`}
        />
        <div
          className={`${sizeClasses[size]} border-4 border-transparent border-t-blue-600 border-r-indigo-600 rounded-full animate-spin absolute top-0 left-0`}
        />
      </div>
      {message && (
        <p className="mt-6 text-lg font-medium text-gray-700 text-center animate-pulse">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;