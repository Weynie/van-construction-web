import { useState } from 'react';

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {isLogin ? 'Log in' : 'Register'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          )}
          {errorMessage && (
            <p className="text-red-500 text-center text-sm">{errorMessage}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {isLogin ? 'Log in' : 'Register'}
          </button>
        </form>
        <div className="mt-4 text-center space-y-2">
          <button
            onClick={onToggle}
            className="text-blue-600 hover:underline text-sm block"
          >
            {isLogin ? 'No account? Register here' : 'Have an account? Log in'}
          </button>
          <button
            onClick={onClose}
            className="text-gray-500 hover:underline text-sm block"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
