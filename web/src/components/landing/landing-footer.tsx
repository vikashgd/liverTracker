import Link from 'next/link';

export function LandingFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-8 md:space-y-0">
          {/* Brand */}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/logo150x150.png" 
                alt="LiverTracker Logo" 
                className="w-10 h-10"
              />
              <span className="text-xl font-bold">LiverTracker</span>
            </div>
            <p className="text-gray-400 max-w-md">
              AI-powered liver health intelligence for patients who get regular lab tests.
            </p>
          </div>

          {/* Essential Links */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-8">
            <Link href="/auth/signup" className="text-gray-300 hover:text-white transition-colors font-medium">
              Get Started
            </Link>
            <a href="#features" className="text-gray-300 hover:text-white transition-colors font-medium">
              Features
            </a>
            <a href="#contact" className="text-gray-300 hover:text-white transition-colors font-medium">
              Contact
            </a>
            <a href="#" className="text-gray-300 hover:text-white transition-colors font-medium">
              Privacy
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 LiverTracker. HIPAA Compliant & Secure.
          </p>
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Medical Grade Security</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}