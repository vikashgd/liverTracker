#!/usr/bin/env node

/**
 * Debug script for checkbox issues in the share creation modal
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Debugging Checkbox Issues...\n');

// Test 1: Check checkbox component
console.log('✅ Test 1: Checking checkbox component...');
const checkboxPath = path.join(__dirname, 'src/components/ui/checkbox.tsx');
if (fs.existsSync(checkboxPath)) {
  const content = fs.readFileSync(checkboxPath, 'utf8');
  const hasRadixImport = content.includes('@radix-ui/react-checkbox');
  const hasCheckIcon = content.includes('Check');
  const hasProperStyling = content.includes('data-[state=checked]');
  
  console.log(`   Radix UI import: ${hasRadixImport ? '✅' : '❌'}`);
  console.log(`   Check icon: ${hasCheckIcon ? '✅' : '❌'}`);
  console.log(`   Proper styling: ${hasProperStyling ? '✅' : '❌'}`);
} else {
  console.log('   ❌ Checkbox component not found');
}

// Test 2: Check share creation modal usage
console.log('\n✅ Test 2: Checking share creation modal...');
const modalPath = path.join(__dirname, 'src/components/medical-sharing/share-creation-modal.tsx');
if (fs.existsSync(modalPath)) {
  const content = fs.readFileSync(modalPath, 'utf8');
  const hasCheckboxImport = content.includes('import { Checkbox }');
  const hasCheckedProp = content.includes('checked={config.');
  const hasOnCheckedChange = content.includes('onCheckedChange={(checked)');
  const hasLabels = content.includes('<Label htmlFor=');
  
  console.log(`   Checkbox import: ${hasCheckboxImport ? '✅' : '❌'}`);
  console.log(`   Checked prop: ${hasCheckedProp ? '✅' : '❌'}`);
  console.log(`   OnCheckedChange: ${hasOnCheckedChange ? '✅' : '❌'}`);
  console.log(`   Labels: ${hasLabels ? '✅' : '❌'}`);
} else {
  console.log('   ❌ Share creation modal not found');
}

// Test 3: Check for CSS conflicts
console.log('\n✅ Test 3: Checking for potential CSS issues...');
const designSystemPath = path.join(__dirname, 'src/styles/design-system.css');
if (fs.existsSync(designSystemPath)) {
  const content = fs.readFileSync(designSystemPath, 'utf8');
  const hasCheckboxStyles = content.includes('checkbox') || content.includes('Checkbox');
  console.log(`   Custom checkbox styles: ${hasCheckboxStyles ? '⚠️  Found (may conflict)' : '✅ None found'}`);
} else {
  console.log('   ✅ No design system CSS found');
}

console.log('\n🔧 Common Checkbox Issues and Solutions:');
console.log('');
console.log('Issue 1: Blank checkboxes');
console.log('  - Cause: Missing background color or border');
console.log('  - Solution: Updated checkbox with explicit bg-white and border-2');
console.log('');
console.log('Issue 2: Checkboxes disappear when clicked');
console.log('  - Cause: CSS conflicts or missing checked state styles');
console.log('  - Solution: Added data-[state=checked] styles with proper colors');
console.log('');
console.log('Issue 3: Check icon not visible');
console.log('  - Cause: Icon size or color issues');
console.log('  - Solution: Reduced icon size to h-3 w-3 and ensured proper text color');
console.log('');

console.log('🎯 Testing Steps:');
console.log('1. Restart your development server');
console.log('2. Open the share creation modal');
console.log('3. Check if checkboxes now have visible borders');
console.log('4. Click checkboxes to verify they show check marks');
console.log('5. Verify the state persists when clicking');
console.log('');

console.log('✨ If issues persist:');
console.log('- Check browser developer tools for CSS conflicts');
console.log('- Verify Radix UI is properly installed');
console.log('- Check for any custom CSS overriding checkbox styles');
console.log('- Try hard refresh (Cmd+Shift+R) to clear cached styles');