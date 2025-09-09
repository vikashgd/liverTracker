export function FeaturesSection() {
  const features = [
    {
      icon: '🤖',
      title: 'AI-Powered Analysis',
      description: 'Advanced machine learning extracts and analyzes medical data from your lab reports with 99% accuracy.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📊',
      title: 'Trend Tracking',
      description: 'Visual charts and historical trends for all key liver health metrics including MELD scores and biomarkers.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'HIPAA-compliant data protection with encrypted storage and secure sharing with your healthcare providers.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: '📱',
      title: 'Mobile Ready',
      description: 'Access your health insights anywhere with our responsive design and mobile-optimized interface.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: '🎯',
      title: 'Smart Insights',
      description: 'Personalized recommendations and alerts based on your health data patterns and medical history.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: '🤝',
      title: 'Doctor Collaboration',
      description: 'Easily share reports and insights with your healthcare team through secure, time-limited links.',
      gradient: 'from-teal-500 to-blue-500'
    }
  ];

  return (
    <section id="features" className="py-20 lg:py-32 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4">
            Everything you need for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              liver health tracking
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive platform combines cutting-edge AI technology with medical expertise 
            to give you complete control over your liver health journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:border-gray-200 transition-all duration-300"
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} mb-6 text-2xl`}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-20 pt-20 border-t border-gray-100">
          <div className="text-center mb-12">
            <h3 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
              How it works
            </h3>
            <p className="text-lg text-gray-600">
              Get started with your health intelligence in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Upload Reports',
                description: 'Simply upload your lab reports, medical documents, or take photos of your results.',
                icon: '📄'
              },
              {
                step: '02',
                title: 'AI Analysis',
                description: 'Our advanced AI extracts and validates all medical data with clinical accuracy.',
                icon: '🔬'
              },
              {
                step: '03',
                title: 'Track & Share',
                description: 'View trends, get insights, and securely share with your healthcare providers.',
                icon: '📈'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                    {step.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                    {step.step}
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h4>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}