#!/usr/bin/env node
/**
 * Fix script for share link API data mismatch
 */
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Share Link API Data Mismatch...\n');

// The issue: Frontend sends lowercase shareType, API expects uppercase
// Frontend: 'complete_profile', 'specific_reports'  
// API expects: 'COMPLETE_PROFILE', 'SPECIFIC_REPORTS'

const modalPath = path.join(__dirname, 'src/components/medical-sharing/share-creation-modal.tsx');

if (!fs.existsSync(modalPath)) {
  console.log('❌ Share creation modal not found');
  process.exit(1);
}

let content = fs.readFileSync(modalPath, 'utf8');

// Fix 1: Transform shareType to uppercase before sending to API
const handleCreateShareFix = `  const handleCreateShare = async () => {
    setIsCreating(true);
    try {
      // Transform config to match API expectations
      const apiConfig = {
        ...config,
        shareType: config.shareType.toUpperCase(), // Convert to uppercase
        expiresAt: undefined, // Remove if present, API calculates from expiryDays
        // Ensure all required fields are present
        title: config.title || 'Shared Medical Report',
        reportIds: config.reportIds || [],
        allowedEmails: config.allowedEmails || []
      };

      console.log('Sending API config:', apiConfig); // Debug log

      const response = await fetch('/api/share-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiConfig)
      });

      console.log('API Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData); // Debug log
        throw new Error(\`Failed to create share link: \${errorData.error || 'Unknown error'}\`);
      }

      const data = await response.json();
      console.log('API Response:', data); // Debug log
      const shareLink = data.shareLink;
      console.log('Extracted shareLink:', shareLink); // Debug log
      setCreatedShare(shareLink);
      setStep('success');
      console.log('Set step to success, createdShare:', shareLink); // Debug log
      onShareCreated?.(shareLink);
    } catch (error) {
      console.error('Share creation error:', error);
      setIsCreating(false);
      // Show error message to user
      alert(\`Failed to create share link: \${error.message}\`);
    } finally {
      setIsCreating(false);
    }
  };`;

// Replace the existing handleCreateShare function
const handleCreateShareRegex = /const handleCreateShare = async \(\) => \{[\s\S]*?\};/;
if (handleCreateShareRegex.test(content)) {
  content = content.replace(handleCreateShareRegex, handleCreateShareFix);
  console.log('✅ Fixed handleCreateShare function');
} else {
  console.log('⚠️  Could not find handleCreateShare function to replace');
}

// Fix 2: Ensure success step shows properly
const successStepFix = `          {/* Step 5: Success */}
          {step === 'success' && createdShare && createdShare.url && (
            <div className="space-y-6 text-center">
              <div className="text-green-600 text-lg font-semibold mb-4">
                ✅ Share Link Created Successfully!
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border">
                <div className="text-sm font-medium text-gray-700 mb-2">Share Link:</div>
                <div className="bg-white p-3 rounded border font-mono text-sm break-all mb-3">
                  {createdShare.url}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(createdShare.url)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  📋 Copy Link
                </button>
              </div>

              <div className="text-sm text-gray-600">
                <p>Expires: {new Date(createdShare.expiresAt).toLocaleDateString()}</p>
                <p>Share this link with healthcare providers to give them secure access to your medical data.</p>
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setStep('type');
                    setCreatedShare(null);
                    setConfig({
                      shareType: reportIds.length > 0 ? 'specific_reports' : 'complete_profile',
                      title: '',
                      description: '',
                      reportIds: reportIds,
                      includeProfile: true,
                      includeDashboard: true,
                      includeScoring: true,
                      includeAI: true,
                      includeFiles: true,
                      expiryDays: 7,
                      maxViews: undefined,
                      password: undefined,
                      allowedEmails: []
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Create Another
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}`;

// Replace the success step
const successStepRegex = /\{\/\* Step 5: Success \*\/\}[\s\S]*?\{step === 'success'[\s\S]*?\}\)/;
if (successStepRegex.test(content)) {
  content = content.replace(successStepRegex, successStepFix);
  console.log('✅ Fixed success step display');
} else {
  console.log('⚠️  Could not find success step to replace');
}

// Write the fixed content back
fs.writeFileSync(modalPath, content);

console.log('\n🎯 Fixes Applied:');
console.log('   • Fixed shareType case mismatch (lowercase → uppercase)');
console.log('   • Added comprehensive error handling and logging');
console.log('   • Enhanced success step with proper URL display');
console.log('   • Added copy button functionality');
console.log('   • Added better error messages for users');
console.log('   • Added debug logging for troubleshooting');

console.log('\n🚀 Next Steps:');
console.log('1. Restart your development server');
console.log('2. Open browser developer tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Try creating a share link');
console.log('5. Check console for debug messages');
console.log('6. The success screen should now show the URL clearly');

console.log('\n🔍 Debug Information:');
console.log('   • Check console for "Sending API config:" message');
console.log('   • Check console for "API Response:" message');
console.log('   • Look for any error messages in red');
console.log('   • Verify the shareType is uppercase in the API config');