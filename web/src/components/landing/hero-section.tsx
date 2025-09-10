import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-family.png"
          alt="Happy family representing health and wellness"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        {/* Very light overlay to maintain text readability while keeping image clear */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                AI-Powered{' '}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Liver Health
                </span>{' '}
                Intelligence
              </h1>
              <p className="text-xl text-gray-800 leading-relaxed font-medium bg-white/80 backdrop-blur-sm p-4 rounded-lg">
                Designed for patients who get regular liver function tests. Transform your lab reports 
                into intelligent health insights, track MELD scores over time, and easily share progress 
                with your medical team.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center font-semibold text-lg"
              >
                Upload Your First Report
              </Link>
              <Link
                href="/dashboard"
                className="border-2 border-gray-400 text-gray-800 bg-white/90 backdrop-blur-sm px-8 py-4 rounded-xl hover:border-gray-500 hover:bg-white transition-all duration-200 text-center font-semibold text-lg shadow-md"
              >
                View Demo
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-800 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium">HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-800 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="font-medium">AI-Powered Analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-800 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="font-medium">Secure & Private</span>
              </div>
            </div>
          </div>

          {/* Right Column - Empty space to let image show through */}
          <div className="relative lg:block hidden">
            {/* This space intentionally left empty to showcase the family image */}
          </div>
        </div>
      </div>
    </section>
  );
}