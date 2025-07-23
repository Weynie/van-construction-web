import { Link } from 'react-router-dom';

export default function Navbar({ onStart }) {
  return (
    <header className="w-full bg-white shadow-md">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          MySite
        </Link>
        <button
          onClick={onStart}
          className="text-lg font-semibold bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-700 transition"
        >
          Start now
        </button>
      </nav>
    </header>
  );
}
