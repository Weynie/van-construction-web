'use client';

import { useState } from 'react';

const ApiKeyInput = ({ 
  value, 
  onChange, 
  onRememberChange, 
  rememberKey = false,
  onSecurityInfoClick,
  disabled = false,
  placeholder = "Enter your API key",
  hasError = false
}) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-2">
      {/* API Key Input Field */}
      <div className="relative">
        <input
          type={showKey ? "text" : "password"}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full bg-orange-50 rounded px-2 py-1 border focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 ${
            hasError 
              ? 'border-red-500 focus:border-red-500' 
              : 'border-orange-200 focus:border-orange-400'
          }`}
        />
        <button
          type="button"
          onClick={() => setShowKey(!showKey)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          disabled={disabled}
        >
          {showKey ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>

      {/* Remember Key Checkbox */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="remember-key"
          checked={rememberKey}
          onChange={(e) => onRememberChange(e.target.checked)}
          disabled={disabled}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        <label htmlFor="remember-key" className="text-sm text-gray-700">
          Remember my API key securely
        </label>
        <button
          type="button"
          onClick={onSecurityInfoClick}
          className="text-blue-600 text-sm hover:text-blue-800 underline"
          disabled={disabled}
        >
          Learn more about security
        </button>
      </div>
    </div>
  );
};

export default ApiKeyInput; 