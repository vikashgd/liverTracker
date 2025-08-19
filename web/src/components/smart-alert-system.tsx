"use client";

import { useState, useEffect } from 'react';
import { HealthAlert } from '@/lib/ai-health-intelligence';

interface SmartAlertSystemProps {
  alerts: HealthAlert[];
  onDismissAlert?: (alertId: string) => void;
  className?: string;
}

export function SmartAlertSystem({ alerts, onDismissAlert, className = '' }: SmartAlertSystemProps) {
  const [visibleAlerts, setVisibleAlerts] = useState<HealthAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Filter out dismissed alerts and sort by urgency
    const activeAlerts = alerts
      .filter(alert => !dismissedAlerts.has(alert.id))
      .sort((a, b) => b.urgency - a.urgency)
      .slice(0, 5); // Show only top 5 most urgent alerts

    setVisibleAlerts(activeAlerts);
  }, [alerts, dismissedAlerts]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismissAlert?.(alertId);
  };

  const getSeverityIcon = (severity: HealthAlert['severity']) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'concerning': return '⚠️';
      case 'warning': return '💡';
      default: return 'ℹ️';
    }
  };

  const getSeverityColor = (severity: HealthAlert['severity']) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 text-red-800';
      case 'concerning': return 'border-orange-500 bg-orange-50 text-orange-800';
      case 'warning': return 'border-yellow-500 bg-yellow-50 text-yellow-800';
      default: return 'border-blue-500 bg-blue-50 text-blue-800';
    }
  };

  const getTypeLabel = (type: HealthAlert['type']) => {
    switch (type) {
      case 'threshold': return 'Range Alert';
      case 'trend': return 'Trend Alert';
      case 'meld': return 'MELD Score';
      case 'correlation': return 'Pattern Alert';
      case 'pattern': return 'Pattern Alert';
      default: return 'Health Alert';
    }
  };

  if (visibleAlerts.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">✅</span>
          <div>
            <h4 className="font-medium text-green-800">All Clear!</h4>
            <p className="text-sm text-green-600">No active health alerts at this time.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">🚨 Smart Health Alerts</h3>
        <span className="text-sm text-gray-500">
          {visibleAlerts.length} active alert{visibleAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`border-l-4 rounded-r-lg p-4 shadow-sm ${getSeverityColor(alert.severity)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Alert Header */}
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-xl">{getSeverityIcon(alert.severity)}</span>
                <span className="text-xs px-2 py-1 bg-white rounded-full font-medium">
                  {getTypeLabel(alert.type)}
                </span>
                <span className="text-xs px-2 py-1 bg-white rounded-full">
                  {alert.metric !== 'multiple' ? alert.metric : 'Multiple Metrics'}
                </span>
                <span className="text-xs text-gray-600">
                  Urgency: {alert.urgency}/10
                </span>
              </div>

              {/* Alert Title */}
              <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>

              {/* Alert Description */}
              <p className="text-sm opacity-90 mb-3">{alert.description}</p>

              {/* Recommendation Box */}
              <div className="bg-white border-l-4 border-blue-500 p-3 rounded-r">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-500 font-semibold text-xs">💡 RECOMMENDATION</span>
                </div>
                <p className="text-sm text-blue-800 mt-1">{alert.recommendation}</p>
              </div>

              {/* Alert Footer */}
              <div className="flex items-center justify-between mt-3 text-xs opacity-75">
                <span>Created: {new Date(alert.created).toLocaleDateString()}</span>
                {alert.type === 'trend' && (
                  <span className="flex items-center space-x-1">
                    <span>📈</span>
                    <span>Trend Analysis</span>
                  </span>
                )}
                {alert.type === 'meld' && (
                  <span className="flex items-center space-x-1">
                    <span>🏥</span>
                    <span>Liver Function</span>
                  </span>
                )}
              </div>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => handleDismiss(alert.id)}
              className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
              title="Dismiss alert"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Show More Link */}
      {alerts.length > visibleAlerts.length && (
        <div className="text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 underline">
            Show {alerts.length - visibleAlerts.length} more alerts
          </button>
        </div>
      )}
    </div>
  );
}

// Compact version for the main dashboard
export function CompactAlertBanner({ alerts }: { alerts: HealthAlert[] }) {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const concerningAlerts = alerts.filter(a => a.severity === 'concerning');
  
  if (alerts.length === 0) return null;

  const mostUrgent = alerts.sort((a, b) => b.urgency - a.urgency)[0];

  return (
    <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getSeverityIcon(mostUrgent.severity)}</span>
          <div>
            <h4 className="font-semibold text-red-800">
              {criticalAlerts.length > 0 ? `${criticalAlerts.length} Critical Alert${criticalAlerts.length !== 1 ? 's' : ''}` :
               concerningAlerts.length > 0 ? `${concerningAlerts.length} Health Concern${concerningAlerts.length !== 1 ? 's' : ''}` :
               'Health Notifications'}
            </h4>
            <p className="text-sm text-red-600">{mostUrgent.title}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-red-800">
            {alerts.length} Total Alert{alerts.length !== 1 ? 's' : ''}
          </div>
          <button className="text-xs text-red-600 hover:text-red-800 underline">
            View All Alerts
          </button>
        </div>
      </div>
    </div>
  );
}

function getSeverityIcon(severity: HealthAlert['severity']) {
  switch (severity) {
    case 'critical': return '🚨';
    case 'concerning': return '⚠️';
    case 'warning': return '💡';
    default: return 'ℹ️';
  }
}
