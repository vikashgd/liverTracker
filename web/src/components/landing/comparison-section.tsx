'use client';

import { Check, X, AlertTriangle } from 'lucide-react';

interface ComparisonFeature {
  feature: string;
  liverTracker: {
    status: 'full' | 'partial' | 'none';
    description: string;
  };
  appleHealth: {
    status: 'full' | 'partial' | 'none';
    description: string;
  };
  myChart: {
    status: 'full' | 'partial' | 'none';
    description: string;
  };
  patientsLikeMe: {
    status: 'full' | 'partial' | 'none';
    description: string;
  };
  generalHealth: {
    status: 'full' | 'partial' | 'none';
    description: string;
  };
}

const comparisonData: ComparisonFeature[] = [
  {
    feature: "Liver-Specific Biomarkers",
    liverTracker: { status: 'full', description: "Deep focus (MELD, INR, Platelets, etc.)" },
    appleHealth: { status: 'none', description: "Generic (glucose, weight, steps)" },
    myChart: { status: 'partial', description: "Only if your hospital tracks them" },
    patientsLikeMe: { status: 'none', description: "Forum-based, no tracking" },
    generalHealth: { status: 'none', description: "No liver focus" }
  },
  {
    feature: "Longitudinal Trending (5–10 yrs)",
    liverTracker: { status: 'full', description: "Built for long-term tracking" },
    appleHealth: { status: 'none', description: "Limited to device-synced data" },
    myChart: { status: 'partial', description: "Limited to data from that hospital system" },
    patientsLikeMe: { status: 'none', description: "No structured tracking" },
    generalHealth: { status: 'none', description: "Short-term focus" }
  },
  {
    feature: "Auto MELD/Child-Pugh Calc",
    liverTracker: { status: 'full', description: "Automatic, real-time" },
    appleHealth: { status: 'none', description: "Not available" },
    myChart: { status: 'partial', description: "Sometimes, but not patient-facing" },
    patientsLikeMe: { status: 'none', description: "No" },
    generalHealth: { status: 'none', description: "No" }
  },
  {
    feature: "Upload Any Lab Report (Global)",
    liverTracker: { status: 'full', description: "AI extracts from any format" },
    appleHealth: { status: 'none', description: "Manual entry only" },
    myChart: { status: 'none', description: "Only data from that EHR" },
    patientsLikeMe: { status: 'none', description: "Manual entry" },
    generalHealth: { status: 'none', description: "Manual or device only" }
  },
  {
    feature: "Doctor Sharing (PDF Summary)",
    liverTracker: { status: 'full', description: "One-click, clean report" },
    appleHealth: { status: 'none', description: "No" },
    myChart: { status: 'full', description: "But only within that hospital" },
    patientsLikeMe: { status: 'none', description: "No" },
    generalHealth: { status: 'none', description: "No" }
  },
  {
    feature: "Multi-Language Support",
    liverTracker: { status: 'full', description: "Launching with 6+ languages" },
    appleHealth: { status: 'partial', description: "Limited" },
    myChart: { status: 'none', description: "Usually English only" },
    patientsLikeMe: { status: 'partial', description: "Some" },
    generalHealth: { status: 'none', description: "Rarely" }
  },
  {
    feature: "Offline Mode",
    liverTracker: { status: 'full', description: "Planned for 2026" },
    appleHealth: { status: 'none', description: "Requires internet" },
    myChart: { status: 'none', description: "Web-based" },
    patientsLikeMe: { status: 'none', description: "App requires internet" },
    generalHealth: { status: 'none', description: "Most require internet" }
  },
  {
    feature: "Designed for Non-Tech Patients",
    liverTracker: { status: 'full', description: "Simple, guided, visual" },
    appleHealth: { status: 'partial', description: "Complex for older users" },
    myChart: { status: 'partial', description: "Cluttered UI" },
    patientsLikeMe: { status: 'partial', description: "Forum-heavy" },
    generalHealth: { status: 'partial', description: "Fitness-focused" }
  }
];

const StatusIcon = ({ status }: { status: 'full' | 'partial' | 'none' }) => {
  switch (status) {
    case 'full':
      return <Check className="w-5 h-5 text-green-600" />;
    case 'partial':
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case 'none':
      return <X className="w-5 h-5 text-red-500" />;
  }
};

const StatusCell = ({ item, isHighlighted = false }: { 
  item: { status: 'full' | 'partial' | 'none'; description: string };
  isHighlighted?: boolean;
}) => (
  <div className={`p-4 text-center ${isHighlighted ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
    <div className="flex justify-center mb-2">
      <StatusIcon status={item.status} />
    </div>
    <p className={`text-sm ${isHighlighted ? 'text-blue-900 font-medium' : 'text-gray-600'}`}>
      {item.description}
    </p>
  </div>
);

export function ComparisonSection() {
  return (
    <section id="why-us" className="py-20 bg-gradient-to-br from-blue-50 via-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">
            Why Choose LiverTracker?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how LiverTracker compares to other health tracking solutions. 
            We're built specifically for liver health management.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-6 bg-gray-100 border-b border-gray-200">
            <div className="p-6 font-semibold text-gray-900">Feature</div>
            <div className="p-6 text-center bg-blue-600 text-white font-semibold">
              <div className="flex flex-col items-center">
                <span className="text-lg">LiverTracker</span>
                <span className="text-sm opacity-90">(Our Solution)</span>
              </div>
            </div>
            <div className="p-6 text-center font-semibold text-gray-700">
              Apple Health /<br />Google Fit
            </div>
            <div className="p-6 text-center font-semibold text-gray-700">
              MyChart<br />(Epic)
            </div>
            <div className="p-6 text-center font-semibold text-gray-700">
              PatientsLikeMe
            </div>
            <div className="p-6 text-center font-semibold text-gray-700">
              General Health<br />Apps
            </div>
          </div>

          {/* Comparison Rows */}
          {comparisonData.map((row, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-6 border-b border-gray-100 ${
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              }`}
            >
              <div className="p-6 font-medium text-gray-900 border-r border-gray-100">
                {row.feature}
              </div>
              <StatusCell item={row.liverTracker} isHighlighted={true} />
              <StatusCell item={row.appleHealth} />
              <StatusCell item={row.myChart} />
              <StatusCell item={row.patientsLikeMe} />
              <StatusCell item={row.generalHealth} />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <div className="bg-blue-600 text-white p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Take Control of Your Liver Health?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of patients who trust LiverTracker for comprehensive liver health monitoring.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              Get Started Today
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex justify-center space-x-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-600" />
            <span>Full Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span>Partial Support</span>
          </div>
          <div className="flex items-center space-x-2">
            <X className="w-4 h-4 text-red-500" />
            <span>Not Available</span>
          </div>
        </div>
      </div>
    </section>
  );
}