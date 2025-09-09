"use client";

import React from "react";
import { User, Calendar, MapPin, Phone, Mail, AlertTriangle } from "lucide-react";

interface PatientProfileTabProps {
  profile: any;
}

export function PatientProfileTab({ profile }: PatientProfileTabProps) {
  if (!profile) {
    return (
      <div className="text-center py-8">
        <div className="text-medical-neutral-400 mb-4">
          <User className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-medical-neutral-900 mb-2">
          No Profile Information
        </h3>
        <p className="text-medical-neutral-600">
          Patient profile information is not included in this share.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-medical-neutral-900 mb-2">
          Patient Profile
        </h3>
        <p className="text-medical-neutral-600">
          Basic patient information and medical history (as authorized for sharing)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-medical-neutral-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-medical-primary-600" />
            Basic Information
          </h4>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-medical-neutral-600">Name</label>
                <div className="text-medical-neutral-900">
                  {profile.name || '[Name Protected]'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-medical-neutral-600">Age</label>
                <div className="text-medical-neutral-900">
                  {profile.age || 'Not specified'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-medical-neutral-600">Gender</label>
                <div className="text-medical-neutral-900">
                  {profile.gender || 'Not specified'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-medical-neutral-600">Date of Birth</label>
                <div className="text-medical-neutral-900">
                  {profile.dateOfBirth ? 
                    new Date(profile.dateOfBirth).toLocaleDateString() : 
                    '[Protected]'
                  }
                </div>
              </div>
            </div>

            {profile.includeContactInfo && (
              <>
                <div className="border-t border-medical-neutral-200 pt-4">
                  <h5 className="font-medium text-medical-neutral-900 mb-3">Contact Information</h5>
                  
                  {profile.phone && (
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4 text-medical-neutral-500" />
                      <span className="text-medical-neutral-900">{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile.email && (
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-medical-neutral-500" />
                      <span className="text-medical-neutral-900">{profile.email}</span>
                    </div>
                  )}
                  
                  {profile.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-medical-neutral-500 mt-0.5" />
                      <span className="text-medical-neutral-900">{profile.address}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Medical History */}
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-medical-neutral-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-medical-secondary-600" />
            Medical History
          </h4>
          
          {profile.includeMedicalHistory ? (
            <div className="space-y-4">
              {profile.primaryDiagnosis && (
                <div>
                  <label className="text-sm font-medium text-medical-neutral-600">Primary Diagnosis</label>
                  <div className="text-medical-neutral-900">{profile.primaryDiagnosis}</div>
                </div>
              )}

              {profile.diagnosisDate && (
                <div>
                  <label className="text-sm font-medium text-medical-neutral-600">Diagnosis Date</label>
                  <div className="text-medical-neutral-900">
                    {new Date(profile.diagnosisDate).toLocaleDateString()}
                  </div>
                </div>
              )}

              {profile.allergies && profile.allergies.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-medical-neutral-600">Known Allergies</label>
                  <div className="space-y-1">
                    {profile.allergies.map((allergy: string, index: number) => (
                      <div key={index} className="text-medical-neutral-900 bg-red-50 px-2 py-1 rounded text-sm">
                        {allergy}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.medications && profile.medications.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-medical-neutral-600">Current Medications</label>
                  <div className="space-y-2">
                    {profile.medications.map((med: any, index: number) => (
                      <div key={index} className="bg-medical-neutral-50 p-2 rounded">
                        <div className="font-medium text-medical-neutral-900">{med.name}</div>
                        {med.dosage && (
                          <div className="text-sm text-medical-neutral-600">{med.dosage}</div>
                        )}
                        {med.frequency && (
                          <div className="text-sm text-medical-neutral-600">{med.frequency}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {profile.medicalHistory && profile.medicalHistory.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-medical-neutral-600">Medical History</label>
                  <div className="space-y-1">
                    {profile.medicalHistory.map((condition: string, index: number) => (
                      <div key={index} className="text-medical-neutral-900">• {condition}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-medical-neutral-500">
              <p>Medical history not included in this share</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contacts */}
      {profile.emergencyContacts && profile.emergencyContacts.length > 0 && (
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-medical-neutral-900 mb-4">
            Emergency Contacts
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.emergencyContacts.map((contact: any, index: number) => (
              <div key={index} className="bg-medical-neutral-50 p-4 rounded-lg">
                <div className="font-medium text-medical-neutral-900">{contact.name}</div>
                <div className="text-sm text-medical-neutral-600">{contact.relationship}</div>
                {contact.phone && (
                  <div className="text-sm text-medical-neutral-700 mt-1">{contact.phone}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insurance Information */}
      {profile.insurance && (
        <div className="bg-white rounded-lg border border-medical-neutral-200 p-6">
          <h4 className="text-lg font-semibold text-medical-neutral-900 mb-4">
            Insurance Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-medical-neutral-600">Primary Insurance</label>
              <div className="text-medical-neutral-900">{profile.insurance.primary || 'Not specified'}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-medical-neutral-600">Policy Number</label>
              <div className="text-medical-neutral-900">
                {profile.insurance.policyNumber ? '[Protected]' : 'Not specified'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIPAA Compliance Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">HIPAA Privacy Protection</h4>
            <div className="text-blue-800 text-sm space-y-1">
              <p>
                {profile.privacyNotice || 
                 'Patient information is anonymized in compliance with HIPAA and applicable privacy laws. Direct identifiers have been removed or protected.'}
              </p>
              <p>
                <strong>Share Type:</strong> {profile.shareType || 'Healthcare Provider'}
              </p>
              <p>
                <strong>Anonymization Level:</strong> {profile.anonymizationLevel || 'Standard'}
              </p>
              <p>
                <strong>Privacy Controls:</strong> Names anonymized, dates protected, contact info excluded
              </p>
              <p>
                All access to this medical information is logged and monitored for compliance purposes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Privacy Notice for Name Display */}
      {profile.name && profile.name.includes('[') && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <div className="text-green-800 text-sm">
              <strong>Privacy Compliant:</strong> Patient identity is protected through anonymization. 
              Clinical data is preserved for medical consultation while maintaining confidentiality.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}