import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Hero({ isAuthenticated, username, onLogout, onStart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {!isAuthenticated ? (
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <h1 className="text-5xl font-extrabold text-foreground mb-4">
              Welcome to MySite
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Securely log in or register to get started
            </p>
            <Button
              onClick={onStart}
              size="lg"
              className="text-lg font-semibold"
            >
              Start now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <h1 className="text-5xl font-extrabold text-foreground mb-4">
              Welcome back, {username}
            </h1>
            <Button
              onClick={onLogout}
              variant="destructive"
              size="lg"
              className="text-lg font-semibold"
            >
              Log out
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
