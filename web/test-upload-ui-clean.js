/**
 * Test Upload UI Clean Styling
 * Verifies that the upload page has clean, modern styling
 */

const puppeteer = require('puppeteer');

async function testUploadUIClean() {
  console.log('🧪 Testing Upload UI Clean Styling...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to upload page
    console.log('📱 Navigating to upload page...');
    await page.goto('http://localhost:3000/upload-enhanced', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForSelector('.upload-flow-tabs', { timeout: 10000 });
    
    // Check for clean styling elements
    console.log('🎨 Checking clean styling...');
    
    // Check main container styling
    const containerStyle = await page.evaluate(() => {
      const container = document.querySelector('.upload-flow-tabs');
      if (!container) return null;
      
      const styles = window.getComputedStyle(container);
      return {
        background: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        border: styles.border
      };
    });
    
    console.log('📦 Container styling:', containerStyle);
    
    // Check progress indicator styling
    const progressStyle = await page.evaluate(() => {
      const progress = document.querySelector('.progress-indicator');
      if (!progress) return null;
      
      const styles = window.getComputedStyle(progress);
      return {
        background: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        border: styles.border
      };
    });
    
    console.log('📊 Progress indicator styling:', progressStyle);
    
    // Check button styling
    const buttonStyle = await page.evaluate(() => {
      const nextButton = document.querySelector('.next-button');
      if (!nextButton) return null;
      
      const styles = window.getComputedStyle(nextButton);
      return {
        background: styles.backgroundColor,
        borderRadius: styles.borderRadius,
        color: styles.color,
        border: styles.border
      };
    });
    
    console.log('🔘 Button styling:', buttonStyle);
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'upload-ui-clean-test.png',
      fullPage: true 
    });
    
    console.log('📸 Screenshot saved as upload-ui-clean-test.png');
    
    // Verify clean styling characteristics
    const isClean = (
      containerStyle?.background === 'rgb(255, 255, 255)' && // White background
      containerStyle?.borderRadius === '12px' && // Clean rounded corners
      progressStyle?.background === 'rgb(255, 255, 255)' && // White progress background
      progressStyle?.borderRadius === '8px' // Clean progress corners
    );
    
    if (isClean) {
      console.log('✅ Upload UI has clean, modern styling!');
    } else {
      console.log('⚠️  Upload UI styling may need adjustment');
    }
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection...');
    console.log('Press Ctrl+C to close when done');
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testUploadUIClean().catch(console.error);