import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'gray' | 'green' | 'red';
  fullPage?: boolean;
  text?: string;
}

export default function Loading({ 
  size = 'medium', 
  color = 'blue', 
  fullPage = false,
  text = '加载中' 
}: LoadingProps) {
  const sizeMap = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-2',
    large: 'h-12 w-12 border-3'
  };
  
  const colorMap = {
    blue: 'border-blue-500',
    gray: 'border-gray-500',
    green: 'border-green-500',
    red: 'border-red-500'
  };
  
  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`animate-spin rounded-full ${sizeMap[size]} border-t-transparent ${colorMap[color]} mb-2`}
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
  
  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[300px] w-full">
        {spinner}
      </div>
    );
  }
  
  return spinner;
} 