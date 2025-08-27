import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AuthModal({
  isLogin,
  onToggle,
  onSubmit,
  onClose,
  errorMessage,
  setEmail, setPassword, setConfirmPassword, setUsername,
  username, email, password, confirmPassword
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isLogin ? 'Log in' : 'Register'}
          </DialogTitle>
        </DialogHeader>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {!isLogin && (
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full"
                />
              )}
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full"
              />
              {!isLogin && (
                <Input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full"
                />
              )}
              {errorMessage && (
                <p className="text-destructive text-center text-sm">{errorMessage}</p>
              )}
              <Button
                type="submit"
                className="w-full"
              >
                {isLogin ? 'Log in' : 'Register'}
              </Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              <Button
                onClick={onToggle}
                variant="link"
                className="text-sm"
              >
                {isLogin ? 'No account? Register here' : 'Have an account? Log in'}
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="text-sm text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
