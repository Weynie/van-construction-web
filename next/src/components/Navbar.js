import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Navbar({ onStart }) {
  return (
    <header className="w-full bg-background border-b">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-foreground">
          MySite
        </Link>
        <Button
          onClick={onStart}
          size="lg"
          className="text-lg font-semibold"
        >
          Start now
        </Button>
      </nav>
    </header>
  );
}
