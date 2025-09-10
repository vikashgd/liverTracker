export function ComingSoonSection() {
  const comingFeatures = [
    {
      icon: '📱',
      title: 'Native Liver Tracker App',
      description: 'Dedicated mobile app for iOS and Android with offline capabilities, push notifications for lab reminders, and seamless sync across devices.',
      gradient: 'from-blue-500 to-indigo-600',
      status: 'Q1 2026'
    },
    {
      icon: '🏃‍♂️',
      title: 'Daily Activity Monitoring',
      description: 'Track physical activity, sleep patterns, and lifestyle factors that impact liver health with wearable device integration.',
      gradient: 'from-green-500 to-emerald-600',
      status: 'Q2 2026'
    },
    {
      icon: '🥗',
      title: 'Liver Diets & Recipe Section',
      description: 'Personalized meal plans, liver-friendly recipes, and nutritional guidance tailored to your specific liver condition and MELD score.',
      gradient: 'from-orange-500 to-red-500',
      status: 'Q4 2025'
    }
  ];

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            <span>Coming Soon</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Future of{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Liver Health Management
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're building a comprehensive ecosystem to support your liver health journey. 
            Here's what's coming next to make your health management even more powerful.
          </p>
        </div>

        {/* Coming Soon Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {comingFeatures.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-lg border border-gray-100 hover:shadow-2xl hover:border-gray-200 transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  {feature.status}
                </div>
              </div>

              {/* Icon Header */}
              <div className={`h-32 bg-gradient-to-br ${feature.gradient} flex items-center justify-center relative overflow-hidden`}>
                <div className="text-6xl mb-2 transform group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {feature.description}
                </p>
                
                {/* Coming Soon Indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>In Development</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors duration-200">
                    Learn More →
                  </button>
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want Early Access?
            </h3>
            <p className="text-gray-600 mb-6">
              Join our beta program to get first access to new features and help shape the future of liver health management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold">
                Join Beta Program
              </button>
              <button className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 font-semibold">
                Get Notified
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}