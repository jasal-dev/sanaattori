export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Sanaattori
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Collection of Finnish Word Games
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Sanasto Game Card */}
          <a
            href="/sanasto"
            className="group block bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow p-8 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl font-bold text-white">S</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Sanasto
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                A Wordle-style word guessing game in Finnish
              </p>
            </div>
          </a>

          {/* Placeholder for future games */}
          <div className="block bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex flex-col items-center text-center opacity-50">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">?</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-2">
                Coming Soon
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                More word games coming soon!
              </p>
            </div>
          </div>

          <div className="block bg-gray-100 dark:bg-gray-700 rounded-lg shadow p-8 border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex flex-col items-center text-center opacity-50">
              <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-gray-500 dark:text-gray-400">?</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-500 dark:text-gray-400 mb-2">
                Coming Soon
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                More word games coming soon!
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-16 text-center text-gray-600 dark:text-gray-400">
          <p>Enjoy our collection of Finnish word games!</p>
        </footer>
      </div>
    </div>
  );
}
