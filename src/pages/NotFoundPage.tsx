import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="relative">
        <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 blur opacity-20" />
        <div className="relative mx-auto w-32 h-32 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 text-white flex items-center justify-center shadow-xl">
          <span className="text-5xl font-extrabold">404</span>
        </div>
      </div>
      <h1 className="mt-8 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Page not found</h1>
      <p className="mt-3 max-w-md text-gray-600 dark:text-gray-400">
        Sorry, we couldn’t find the page you’re looking for. It might have been moved or deleted.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="px-5 py-2.5 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors shadow"
        >
          Go to Home
        </Link>
        <Link
          to="/products"
          className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
          <h3 className="font-semibold text-gray-900 dark:text-white">Check the URL</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Make sure the address is typed correctly.</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
          <h3 className="font-semibold text-gray-900 dark:text-white">Return home</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">You can always start from the homepage.</p>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
          <h3 className="font-semibold text-gray-900 dark:text-white">Explore products</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Find something delicious in our catalog.</p>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;


