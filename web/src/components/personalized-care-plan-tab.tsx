"use client";

import { DynamicCareplan } from '@/lib/unified-ai-intelligence';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Heart, 
  Target, 
  AlertTriangle, 
  Calendar,
  Stethoscope,
  TrendingUp,
  Star,
  CheckCircle2
} from 'lucide-react';

interface PersonalizedCarePlanTabProps {
  careplan: DynamicCareplan | null;
  isLoading?: boolean;
}

export function PersonalizedCarePlanTab({ careplan, isLoading = false }: PersonalizedCarePlanTabProps) {

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-100 animate-pulse rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!careplan) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardContent className="p-8 text-center">
          <Heart className="h-12 w-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-800 mb-4">Your Personalized Care Plan is Being Prepared</h3>
          <div className="max-w-md mx-auto space-y-3 text-gray-700">
            <p className="leading-relaxed">
              We're working on creating a care plan that's uniquely tailored to you. This process takes into account 
              your individual health journey, needs, and goals.
            </p>
            <p className="leading-relaxed">
              <strong>What you can do right now:</strong> Continue tracking your health data, and remember that 
              every piece of information you share helps us better understand how to support you.
            </p>
            <div className="mt-6 p-4 bg-white/70 rounded-lg border border-blue-100">
              <p className="text-sm text-blue-800 italic">
                💙 <strong>You're already taking an important step</strong> by being here and prioritizing your health. 
                That shows incredible strength and self-advocacy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }





  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <Heart className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-blue-900 capitalize">
              {careplan.currentStatus}
            </div>
            <div className="text-sm text-blue-700">Current Status</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-green-900">
              {careplan.meldScore || 'N/A'}
            </div>
            <div className="text-sm text-green-700">MELD Score</div>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-lg font-semibold text-orange-900 capitalize">
              {careplan.riskLevel}
            </div>
            <div className="text-sm text-orange-700">Risk Level</div>
          </CardContent>
        </Card>
      </div>



      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {careplan.recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                  rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{rec.title}</h4>
                    <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                  {rec.frequency && (
                    <div className="text-xs text-gray-600">
                      Frequency: {rec.frequency}
                    </div>
                  )}
                </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {careplan.nextActions.map((action, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-blue-800">{action}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Target Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Target Metrics & Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {careplan.targetMetrics.map((target, index) => (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      {target.metric}
                    </div>
                    <div className="text-lg font-bold text-blue-600 mb-1">
                      {target.targetValue}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      Target by: {target.targetTimeframe}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Target Goal
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Empowering Message */}
      <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border-purple-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="h-6 w-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">Your Journey Forward</h3>
          </div>
          <div className="mb-6">
            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>You are not alone in this journey.</strong> Every step you take toward better health is an act of courage and self-love. 
              This personalized care plan is designed with your unique needs in mind, recognizing that healing is not just about numbers and metrics—it's about hope, resilience, and the strength you carry within you.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Remember: <em>Progress, not perfection.</em> Some days will be harder than others, and that's completely normal. 
              What matters is that you keep moving forward, one small step at a time. Your healthcare team believes in you, and we're here to support you every step of the way.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white/70 p-4 rounded-lg border border-purple-100">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                Your Strengths & Progress
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You're actively monitoring your health - that shows incredible dedication</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>You have {careplan.recommendations.length} personalized strategies to support your wellness</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Your commitment to tracking progress shows remarkable self-advocacy</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Every data point you've shared helps create a clearer path forward</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white/70 p-4 rounded-lg border border-blue-100">
              <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600" />
                Gentle Reminders for Your Journey
              </h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span>Be patient and kind with yourself - healing takes time</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span>Celebrate small victories - they add up to big changes</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span>It's okay to have difficult days - they don't define your progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span>Your healthcare team is here to support you, not judge you</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Care Plan Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">Your Personalized Care Roadmap</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">What We're Focusing On Together</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• {careplan.recommendations.filter(r => r.priority === 'high').length} priority areas that deserve your attention first</li>
                <li>• {careplan.targetMetrics.length} specific health goals we're working toward</li>
                <li>• {careplan.nextActions.length} gentle next steps to take when you're ready</li>
                <li>• {careplan.milestones.length} meaningful milestones to celebrate along the way</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Signs You're Moving in the Right Direction</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• You're consistently caring for yourself with compassion</li>
                <li>• Small positive changes are becoming natural habits</li>
                <li>• You feel more confident in managing your health</li>
                <li>• You're building a stronger partnership with your care team</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}