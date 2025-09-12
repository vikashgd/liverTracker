/**
 * Profile Session Info Component
 * 
 * Displays current session information and profile status
 * for debugging and user awareness
 */

"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, CheckCircle, AlertTriangle, Clock, Activity } from 'lucide-react';
import { AuthUser } from '@/types/auth';
import { ProfileWithUser } from '@/lib/profile-service';

interface ProfileSessionInfoProps {
  user: AuthUser | null;
  profileData: ProfileWithUser | null;
}

export function ProfileSessionInfo({ user, profileData }: ProfileSessionInfoProps) {
  if (!user) {
    return (
      <Card className="mb-6 border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No authenticated session found</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const profileExists = !!profileData?.profile;
  const isComplete = profileData?.isComplete || false;

  return (
    <div className="mb-6 space-y-4">
      {/* Session Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <User className="h-5 w-5" />
            Current Session
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">User ID</p>
              <p className="text-sm text-blue-600 font-mono">{user.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Email</p>
              <p className="text-sm text-blue-600">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-700">Name</p>
              <p className="text-sm text-blue-600">{user.name || 'Not set'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Status */}
      <Card className={`${profileExists ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${profileExists ? 'text-green-800' : 'text-yellow-800'}`}>
            <Activity className="h-5 w-5" />
            Profile Status
            <Badge variant={profileExists ? 'default' : 'secondary'} className="ml-2">
              {profileExists ? 'Found' : 'Not Found'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileExists && profileData?.profile ? (
            <div className="space-y-4">
              {/* Completion Status */}
              <div className="flex items-center gap-2">
                {isComplete ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className={`font-medium ${isComplete ? 'text-green-700' : 'text-yellow-700'}`}>
                  {isComplete ? 'Profile Complete' : 'Profile Incomplete'}
                </span>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Date of Birth</p>
                  <p className="text-sm text-gray-600">
                    {profileData.profile.dateOfBirth 
                      ? new Date(profileData.profile.dateOfBirth).toLocaleDateString()
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Gender</p>
                  <p className="text-sm text-gray-600 capitalize">
                    {profileData.profile.gender || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Height/Weight</p>
                  <p className="text-sm text-gray-600">
                    {profileData.profile.height && profileData.profile.weight
                      ? `${profileData.profile.height}cm / ${profileData.profile.weight}kg`
                      : 'Not set'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Dialysis Status</p>
                  <Badge variant={profileData.profile.onDialysis ? 'destructive' : 'secondary'}>
                    {profileData.profile.onDialysis ? 'On Dialysis' : 'Not on Dialysis'}
                  </Badge>
                </div>
              </div>

              {/* Medical Conditions */}
              {(profileData.profile.ascites !== 'none' || profileData.profile.encephalopathy !== 'none') && (
                <div className="pt-2 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-2">Medical Conditions</p>
                  <div className="flex gap-2">
                    {profileData.profile.ascites !== 'none' && (
                      <Badge variant="outline">
                        Ascites: {profileData.profile.ascites}
                      </Badge>
                    )}
                    {profileData.profile.encephalopathy !== 'none' && (
                      <Badge variant="outline">
                        Encephalopathy: {profileData.profile.encephalopathy}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Integration Status */}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm font-medium text-green-700 mb-1">Ready for Medical Scoring</p>
                <p className="text-xs text-green-600">
                  This profile can be used for MELD and Child-Pugh score calculations
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <p className="text-yellow-700 font-medium">No profile data found</p>
              <p className="text-sm text-yellow-600">
                Complete the form below to create your medical profile
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integration Notice */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Activity className="h-5 w-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-800">Profile Integration</p>
              <p className="text-xs text-purple-600 mt-1">
                Your profile data is automatically used across the platform for MELD scores, 
                Child-Pugh calculations, and personalized medical insights.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}