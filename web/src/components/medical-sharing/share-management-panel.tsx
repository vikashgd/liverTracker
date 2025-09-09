"use client";

import React, { useState, useEffect } from "react";
import { 
  Share2, 
  Plus, 
  Copy, 
  Eye, 
  Clock, 
  Shield, 
  MoreVertical, 
  Trash2, 
  Edit, 
  RefreshCw,
  ExternalLink,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareCreationModal } from "./share-creation-modal";

interface ShareLink {
  id: string;
  token: string;
  title: string;
  description?: string;
  shareType: string;
  url: string;
  expiresAt: string;
  currentViews: number;
  maxViews?: number;
  isActive: boolean;
  createdAt: string;
  lastAccessedAt?: string;
  requiresPassword: boolean;
  allowedEmails: string[];
}

interface ShareManagementPanelProps {
  className?: string;
}

export function ShareManagementPanel({ className = "" }: ShareManagementPanelProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShare, setSelectedShare] = useState<ShareLink | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchShareLinks();
  }, []);

  const fetchShareLinks = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching share links from API...');
      const response = await fetch('/api/share-links');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 API Response:', data);
        console.log('🔗 Share links received:', data.shareLinks);
        
        if (data.shareLinks && data.shareLinks.length > 0) {
          console.log('🔍 First share link URL:', data.shareLinks[0].url);
        }
        
        setShareLinks(data.shareLinks || []);
      } else {
        console.error('❌ API response not OK:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Failed to fetch share links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    console.log('🔍 Copy button clicked with URL:', url);
    
    if (!url) {
      console.error('❌ URL is empty or undefined');
      alert('Error: No URL to copy');
      return;
    }

    try {
      console.log('📋 Attempting clipboard.writeText...');
      await navigator.clipboard.writeText(url);
      console.log('✅ Link copied to clipboard successfully:', url);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('❌ Clipboard API failed:', error);
      console.log('🔄 Trying fallback method...');
      
      try {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          console.log('✅ Fallback copy successful:', url);
          alert('Link copied to clipboard!');
        } else {
          console.error('❌ Fallback copy failed');
          alert('Failed to copy link. Please copy manually: ' + url);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError);
        alert('Failed to copy link. Please copy manually: ' + url);
      }
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    try {
      const response = await fetch(`/api/share-links/${shareId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setShareLinks(prev => prev.filter(link => link.id !== shareId));
      }
    } catch (error) {
      console.error('Failed to revoke share:', error);
    }
  };

  const handleExtendExpiry = async (shareId: string, additionalDays: number) => {
    try {
      const response = await fetch(`/api/share-links/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extendDays: additionalDays })
      });
      
      if (response.ok) {
        const updatedShare = await response.json();
        setShareLinks(prev => prev.map(link => 
          link.id === shareId ? updatedShare : link
        ));
      }
    } catch (error) {
      console.error('Failed to extend expiry:', error);
    }
  };

  const getShareTypeLabel = (shareType: string) => {
    switch (shareType) {
      case 'complete_profile':
        return 'Complete Profile';
      case 'specific_reports':
        return 'Specific Reports';
      case 'consultation_package':
        return 'Consultation Package';
      default:
        return shareType;
    }
  };

  const getStatusColor = (share: ShareLink) => {
    if (!share.isActive) return 'text-red-600 bg-red-50';
    if (new Date(share.expiresAt) < new Date()) return 'text-orange-600 bg-orange-50';
    if (share.maxViews && share.currentViews >= share.maxViews) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (share: ShareLink) => {
    if (!share.isActive) return 'Revoked';
    if (new Date(share.expiresAt) < new Date()) return 'Expired';
    if (share.maxViews && share.currentViews >= share.maxViews) return 'View Limit Reached';
    return 'Active';
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-medical-neutral-200 p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-medical-neutral-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-medical-neutral-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm border border-medical-neutral-200 ${className}`}>
        {/* Header */}
        <div className="p-6 border-b border-medical-neutral-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-medical-primary-100 rounded-lg flex items-center justify-center">
                <Share2 className="w-5 h-5 text-medical-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-medical-neutral-900">
                  Share Management
                </h2>
                <p className="text-medical-neutral-600">
                  Manage your active medical report shares
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchShareLinks}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-medical-primary-600 hover:bg-medical-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Share Link
              </Button>
            </div>
          </div>
        </div>

        {/* Share Links List */}
        <div className="p-6">
          {shareLinks.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-medical-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-medical-neutral-400" />
              </div>
              <h3 className="text-lg font-medium text-medical-neutral-900 mb-2">
                No Share Links Yet
              </h3>
              <p className="text-medical-neutral-600 mb-4">
                Create your first share link to securely share medical reports with healthcare providers.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-medical-primary-600 hover:bg-medical-primary-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Share Link
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {shareLinks.map((share) => (
                <div
                  key={share.id}
                  className="border border-medical-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-medical-neutral-900">
                          {share.title}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(share)}`}>
                          {getStatusText(share)}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                          {getShareTypeLabel(share.shareType)}
                        </span>
                      </div>
                      
                      {share.description && (
                        <p className="text-sm text-medical-neutral-600 mb-3">
                          {share.description}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-1 text-medical-neutral-600">
                          <Calendar className="w-4 h-4" />
                          <span>Expires: {new Date(share.expiresAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1 text-medical-neutral-600">
                          <Eye className="w-4 h-4" />
                          <span>
                            Views: {share.currentViews}
                            {share.maxViews && ` / ${share.maxViews}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-medical-neutral-600">
                          <Clock className="w-4 h-4" />
                          <span>Created: {new Date(share.createdAt).toLocaleDateString()}</span>
                        </div>
                        {share.lastAccessedAt && (
                          <div className="flex items-center gap-1 text-medical-neutral-600">
                            <Users className="w-4 h-4" />
                            <span>Last access: {new Date(share.lastAccessedAt).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Security Features */}
                      <div className="flex items-center gap-4 mt-3">
                        {share.requiresPassword && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Shield className="w-3 h-3" />
                            <span>Password Protected</span>
                          </div>
                        )}
                        {share.allowedEmails.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-purple-600">
                            <Users className="w-3 h-3" />
                            <span>Email Restricted ({share.allowedEmails.length})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyLink(share.url)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(share.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>

                      <div className="relative">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDropdown(showDropdown === share.id ? null : share.id)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                        
                        {showDropdown === share.id && (
                          <div className="absolute right-0 top-full mt-1 bg-white border border-medical-neutral-200 rounded-lg shadow-lg z-10 min-w-[160px]">
                            <button
                              onClick={() => {
                                handleExtendExpiry(share.id, 7);
                                setShowDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-medical-neutral-50 flex items-center gap-2"
                            >
                              <Clock className="w-4 h-4" />
                              Extend 7 days
                            </button>
                            <button
                              onClick={() => {
                                handleExtendExpiry(share.id, 30);
                                setShowDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-medical-neutral-50 flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Extend 30 days
                            </button>
                            <hr className="border-medical-neutral-200" />
                            <button
                              onClick={() => {
                                handleRevokeShare(share.id);
                                setShowDropdown(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Revoke Access
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {shareLinks.length > 0 && (
          <div className="border-t border-medical-neutral-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-medical-primary-600">
                  {shareLinks.length}
                </div>
                <div className="text-sm text-medical-neutral-600">Total Shares</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {shareLinks.filter(s => s.isActive && new Date(s.expiresAt) > new Date()).length}
                </div>
                <div className="text-sm text-medical-neutral-600">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {shareLinks.reduce((sum, s) => sum + s.currentViews, 0)}
                </div>
                <div className="text-sm text-medical-neutral-600">Total Views</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {shareLinks.filter(s => new Date(s.expiresAt) < new Date()).length}
                </div>
                <div className="text-sm text-medical-neutral-600">Expired</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Share Modal */}
      <ShareCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onShareCreated={(newShare) => {
          setShareLinks(prev => [newShare, ...prev]);
          setShowCreateModal(false);
        }}
      />
    </>
  );
}