import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export function HeroSection() {
  const headlines = [
    "2+ Billion Affected by NAFLD Worldwide – Don't Wait for Advanced Stages",
    "Proactive Monitoring Can Extend Life by 10+ Years", 
    "105 Million Battle Cirrhosis, Monitoring Boosts 5-Year Survival by 30%"
  ];

  const ctaTexts = [
    "Scan Your Report Now",
    "Start Free Trial",
    "Track Your Progress Today"
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % headlines.length);
        setIsVisible(true);
      }, 500); // Half second fade out, then change text, then fade in
    }, 6000); // 6 seconds total

    return () => clearInterval(interval);
  }, [headlines.length]);

  return (
    <>
      <style jsx>{`
        .fade-transition {
          transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
        }
        .fade-in {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-out {
          opacity: 0;
          transform: translateY(-10px);
        }
      `}</style>
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
              <h1 className={`font-bold text-gray-900 leading-tight min-h-[200px] lg:min-h-[240px] flex items-center ${
                currentIndex === 1 ? 'text-4xl lg:text-6xl' : 'text-3xl lg:text-5xl'
              }`}>
                <span 
                  className={`fade-transition bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ${
                    isVisible ? 'fade-in' : 'fade-out'
                  }`}
                >
                  {headlines[currentIndex]}
                </span>
              </h1>
              <p className="text-xl text-gray-800 leading-relaxed font-medium bg-white/80 backdrop-blur-sm p-4 rounded-lg">
                Advanced fibrosis affects 370+ million globally. Transform your lab reports into intelligent health insights, track MELD scores over time, and share progress with your medical team.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signup"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl text-center font-semibold text-lg"
              >
                <span 
                  className={`fade-transition ${isVisible ? 'fade-in' : 'fade-out'}`}
                >
                  {ctaTexts[currentIndex]}
                </span>
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
    </>
  );
}