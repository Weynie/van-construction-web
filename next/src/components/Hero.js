export default function Hero({ isAuthenticated, username, onLogout, onStart }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
      {!isAuthenticated ? (
        <>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Welcome to MySite
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Securely log in or register to get started
          </p>
          <button
            onClick={onStart}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Start now
          </button>
        </>
      ) : (
        <>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
            Welcome back, {username}
          </h1>
          <button
            onClick={onLogout}
            className="bg-red-500 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-red-600 transition"
          >
            Log out
          </button>
        </>
      )}
    </div>
  );
}
