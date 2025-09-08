#!/usr/bin/env node

/**
 * Fallback script to use simple checkbox if Radix UI checkbox has issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying Checkbox Fallback Fix...\n');

const modalPath = path.join(__dirname, 'src/components/medical-sharing/share-creation-modal.tsx');

if (!fs.existsSync(modalPath)) {
  console.log('❌ Share creation modal not found');
  process.exit(1);
}

let content = fs.readFileSync(modalPath, 'utf8');

// Replace the Radix UI checkbox import with simple checkbox
const oldImport = 'import { Checkbox } from "@/components/ui/checkbox";';
const newImport = 'import { SimpleCheckbox as Checkbox } from "@/components/ui/simple-checkbox";';

if (content.includes(oldImport)) {
  content = content.replace(oldImport, newImport);
  fs.writeFileSync(modalPath, content);
  
  console.log('✅ Applied checkbox fallback fix');
  console.log('   • Switched to SimpleCheckbox component');
  console.log('   • This provides a more reliable checkbox implementation');
  console.log('   • Restart your server to see the changes');
  console.log('');
  console.log('🎯 The checkboxes should now:');
  console.log('   • Have visible borders');
  console.log('   • Show check marks when clicked');
  console.log('   • Maintain their state properly');
  console.log('   • Not disappear when interacted with');
} else {
  console.log('⚠️  Checkbox import not found or already modified');
  console.log('   The modal may already be using a different checkbox implementation');
}

console.log('\n🚀 Next Steps:');
console.log('1. Restart your development server on port 8080:');
console.log('   npm run dev:8080');
console.log('2. Test the share creation modal');
console.log('3. Verify checkboxes work properly');
console.log('');
console.log('If you want to revert back to Radix UI checkbox:');
console.log('   Replace SimpleCheckbox import back to Checkbox');