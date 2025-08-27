'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

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
    <Card className="w-full">
      <CardContent className="space-y-4 pt-6">
        {/* API Key Input Field */}
        <div className="relative">
          <Input
            type={showKey ? "text" : "password"}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={`pr-10 ${
              hasError 
                ? 'border-destructive focus-visible:ring-destructive' 
                : 'border-input focus-visible:ring-ring'
            }`}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowKey(!showKey)}
            disabled={disabled}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Remember Key Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="remember-key"
            checked={rememberKey}
            onChange={(e) => onRememberChange(e.target.checked)}
            disabled={disabled}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="remember-key" className="text-sm text-muted-foreground">
            Remember my API key securely
          </label>
          <Button
            type="button"
            variant="link"
            onClick={onSecurityInfoClick}
            disabled={disabled}
            className="h-auto p-0 text-sm text-primary hover:text-primary/80 underline"
          >
            Learn more about security
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyInput; 