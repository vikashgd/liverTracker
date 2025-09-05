/**
 * Milestone celebration component
 * Shows celebrations when users complete onboarding milestones
 */

'use client';

import { useEffect, useState } from 'react';
import { useOnboarding } from '@/hooks/use-onboarding';

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: string;
}

const MILESTONES: Milestone[] = [
  {
    id: 'profile-complete',
    title: 'Profile Complete! 🎉',
    description: 'Great job! Your profile is set up and ready for personalized insights.',
    icon: '👤',
    color: 'blue',
    unlocked: 'Personalized health recommendations'
  },
  {
    id: 'first-report',
    title: 'First Report Uploaded! 📊',
    description: 'Awesome! Your first report has been processed and analyzed.',
    icon: '📄',
    color: 'green',
    unlocked: 'Health metrics tracking'
  },
  {
    id: 'trends-unlocked',
    title: 'Trends Unlocked! 📈',
    description: 'Amazing! With 2+ reports, you can now see health trends over time.',
    icon: '📊',
    color: 'purple',
    unlocked: 'Trend analysis and insights'
  },
  {
    id: 'ai-insights',
    title: 'AI Insights Available! 🤖',
    description: 'Incredible! Our AI can now provide advanced health insights.',
    icon: '🧠',
    color: 'indigo',
    unlocked: 'AI-powered health analysis'
  }
];

interface MilestoneCelebrationProps {
  milestone: string;
  onClose: () => void;
}

function CelebrationModal({ milestone, onClose }: MilestoneCelebrationProps) {
  const milestoneData = MILESTONES.find(m => m.id === milestone);
  
  if (!milestoneData) return null;

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };
    return colors[color as keyof typeof colors] || 'from-blue-500 to-blue-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-bounce-in">
        {/* Celebration Header */}
        <div className={`bg-gradient-to-r ${getColorClasses(milestoneData.color)} p-6 text-center text-white relative overflow-hidden`}>
          {/* Confetti Animation */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                {['🎉', '✨', '🎊', '⭐'][Math.floor(Math.random() * 4)]}
              </div>
            ))}
          </div>
          
          <div className="relative z-10">
            <div className="text-6xl mb-4 animate-bounce">
              {milestoneData.icon}
            </div>
            <h2 className="text-2xl font-bold mb-2">
              {milestoneData.title}
            </h2>
            <p className="text-white/90">
              {milestoneData.description}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-gray-900">You've Unlocked:</span>
            </div>
            <p className="text-gray-700 font-medium">
              {milestoneData.unlocked}
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Continue
            </button>
            <button
              onClick={onClose}
              className={`flex-1 bg-gradient-to-r ${getColorClasses(milestoneData.color)} text-white px-4 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity`}
            >
              Explore Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MilestoneCelebration() {
  const { state } = useOnboarding();
  const [currentMilestone, setCurrentMilestone] = useState<string | null>(null);
  const [celebratedMilestones, setCelebratedMilestones] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!state || !state.progress) return;

    // Check for new milestones to celebrate
    const newMilestones: string[] = [];

    if (state.progress.hasProfile && !celebratedMilestones.has('profile-complete')) {
      newMilestones.push('profile-complete');
    }

    if (state.progress.reportCount >= 1 && !celebratedMilestones.has('first-report')) {
      newMilestones.push('first-report');
    }

    if (state.progress.reportCount >= 2 && !celebratedMilestones.has('trends-unlocked')) {
      newMilestones.push('trends-unlocked');
    }

    if (state.progress.reportCount >= 3 && !celebratedMilestones.has('ai-insights')) {
      newMilestones.push('ai-insights');
    }

    // Show the first new milestone
    if (newMilestones.length > 0 && !currentMilestone) {
      setCurrentMilestone(newMilestones[0]);
    }
  }, [state, celebratedMilestones, currentMilestone]);

  const handleClose = () => {
    if (currentMilestone) {
      setCelebratedMilestones(prev => new Set([...prev, currentMilestone]));
      setCurrentMilestone(null);
    }
  };

  if (!currentMilestone) return null;

  return <CelebrationModal milestone={currentMilestone} onClose={handleClose} />;
}

// Add custom CSS for animations
const celebrationStyles = `
  @keyframes bounce-in {
    0% {
      transform: scale(0.3) rotate(-10deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.05) rotate(5deg);
    }
    70% {
      transform: scale(0.9) rotate(-2deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }

  @keyframes confetti {
    0% {
      transform: translateY(-100vh) rotate(0deg);
      opacity: 1;
    }
    100% {
      transform: translateY(100vh) rotate(720deg);
      opacity: 0;
    }
  }

  .animate-bounce-in {
    animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }

  .animate-confetti {
    animation: confetti linear infinite;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = celebrationStyles;
  document.head.appendChild(styleElement);
}

export default MilestoneCelebration;