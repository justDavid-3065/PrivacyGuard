
import axios from 'axios';
import { storage } from '../storage';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'notice';
  rule: string;
  element: string;
  message: string;
  suggestion: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
}

interface AccessibilityScanResult {
  url: string;
  score: number;
  issues: AccessibilityIssue[];
  timestamp: Date;
  suggestions: string[];
}

class AccessibilityScanner {
  private async analyzeWithAI(issues: AccessibilityIssue[]): Promise<string[]> {
    // AI-powered suggestions based on common accessibility patterns
    const suggestions: string[] = [];
    
    const errorCount = issues.filter(i => i.type === 'error').length;
    const criticalCount = issues.filter(i => i.impact === 'critical').length;
    
    if (errorCount > 0) {
      suggestions.push(`Fix ${errorCount} accessibility errors to improve compliance`);
    }
    
    if (criticalCount > 0) {
      suggestions.push(`${criticalCount} critical issues need immediate attention`);
    }
    
    // Add specific suggestions based on common issues
    const hasColorContrast = issues.some(i => i.rule.includes('color-contrast'));
    if (hasColorContrast) {
      suggestions.push('Consider using high contrast colors for better readability');
    }
    
    const hasAltText = issues.some(i => i.rule.includes('image-alt'));
    if (hasAltText) {
      suggestions.push('Add descriptive alt text to all images for screen readers');
    }
    
    const hasKeyboard = issues.some(i => i.rule.includes('keyboard'));
    if (hasKeyboard) {
      suggestions.push('Ensure all interactive elements are keyboard accessible');
    }
    
    return suggestions;
  }

  async scanUrl(url: string, userId: string): Promise<AccessibilityScanResult> {
    try {
      // Simulate accessibility scanning (in production, integrate with axe-core or similar)
      const mockIssues: AccessibilityIssue[] = [
        {
          type: 'error',
          rule: 'color-contrast',
          element: 'button.primary',
          message: 'Insufficient color contrast ratio',
          suggestion: 'Increase contrast ratio to at least 4.5:1',
          impact: 'serious'
        },
        {
          type: 'warning',
          rule: 'image-alt',
          element: 'img.hero',
          message: 'Missing alt attribute',
          suggestion: 'Add descriptive alt text',
          impact: 'moderate'
        }
      ];

      const score = Math.max(0, 100 - (mockIssues.length * 10));
      const suggestions = await this.analyzeWithAI(mockIssues);

      const result: AccessibilityScanResult = {
        url,
        score,
        issues: mockIssues,
        timestamp: new Date(),
        suggestions
      };

      // Store scan result
      await storage.createAccessibilityScan({
        userId,
        url,
        score,
        issues: JSON.stringify(mockIssues),
        suggestions: JSON.stringify(suggestions),
        scannedAt: new Date()
      });

      return result;
    } catch (error) {
      console.error('Accessibility scan failed:', error);
      throw new Error('Failed to perform accessibility scan');
    }
  }

  async getScanHistory(userId: string): Promise<any[]> {
    return storage.getAccessibilityScans(userId);
  }
}

export const accessibilityScanner = new AccessibilityScanner();
