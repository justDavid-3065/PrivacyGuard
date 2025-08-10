
interface PrivacyNoticeTemplate {
  id: string;
  name: string;
  jurisdiction: 'GDPR' | 'CCPA' | 'UK_DPA' | 'PIPEDA';
  sections: PrivacySection[];
}

interface PrivacySection {
  title: string;
  content: string;
  required: boolean;
  variables: string[];
}

interface CompanyInfo {
  name: string;
  address: string;
  email: string;
  phone?: string;
  dpoEmail?: string;
  website: string;
}

class PrivacyNoticeGenerator {
  private templates: PrivacyNoticeTemplate[] = [
    {
      id: 'gdpr-standard',
      name: 'GDPR Standard Template',
      jurisdiction: 'GDPR',
      sections: [
        {
          title: 'Data Controller Information',
          content: `${'{company_name}'} ("we", "us", or "our") is the data controller responsible for your personal data. You can contact us at ${'{contact_email}'} or ${'{company_address}'}.`,
          required: true,
          variables: ['company_name', 'contact_email', 'company_address']
        },
        {
          title: 'Data Protection Officer',
          content: `Our Data Protection Officer can be reached at ${'{dpo_email}'}.`,
          required: false,
          variables: ['dpo_email']
        },
        {
          title: 'Legal Basis for Processing',
          content: 'We process your personal data based on the following legal grounds:\n\n• Consent (Article 6(1)(a) GDPR)\n• Contract performance (Article 6(1)(b) GDPR)\n• Legal obligation (Article 6(1)(c) GDPR)\n• Legitimate interests (Article 6(1)(f) GDPR)',
          required: true,
          variables: []
        },
        {
          title: 'Your Rights',
          content: 'Under GDPR, you have the following rights:\n\n• Right of access (Article 15)\n• Right to rectification (Article 16)\n• Right to erasure (Article 17)\n• Right to restrict processing (Article 18)\n• Right to data portability (Article 20)\n• Right to object (Article 21)\n• Right to withdraw consent\n\nTo exercise these rights, contact us at ${'{contact_email}'}.',
          required: true,
          variables: ['contact_email']
        }
      ]
    },
    {
      id: 'ccpa-standard',
      name: 'CCPA Standard Template', 
      jurisdiction: 'CCPA',
      sections: [
        {
          title: 'Categories of Personal Information',
          content: 'We collect the following categories of personal information:\n\n• Identifiers (name, email, IP address)\n• Commercial information (purchase history)\n• Internet activity (browsing behavior)\n• Professional information (job title, company)',
          required: true,
          variables: []
        },
        {
          title: 'Your California Privacy Rights',
          content: 'As a California resident, you have the right to:\n\n• Request disclosure of personal information collected\n• Request deletion of personal information\n• Opt-out of the sale of personal information\n• Non-discrimination for exercising privacy rights\n\nTo exercise these rights, contact us at ${'{contact_email}'} or visit ${'{website_url}/privacy-request'}.',
          required: true,
          variables: ['contact_email', 'website_url']
        },
        {
          title: 'Do Not Sell My Personal Information',
          content: 'We do not sell personal information to third parties. If our practices change, we will update this notice and provide an opt-out mechanism.',
          required: true,
          variables: []
        }
      ]
    }
  ];

  generateNotice(templateId: string, companyInfo: CompanyInfo, customSections?: PrivacySection[]): string {
    const template = this.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    let notice = `# Privacy Notice - ${companyInfo.name}\n\n`;
    notice += `**Effective Date:** ${new Date().toLocaleDateString()}\n\n`;

    // Process template sections
    const allSections = [...template.sections, ...(customSections || [])];
    
    allSections.forEach(section => {
      notice += `## ${section.title}\n\n`;
      
      let content = section.content;
      
      // Replace variables
      content = content.replace(/{company_name}/g, companyInfo.name);
      content = content.replace(/{contact_email}/g, companyInfo.email);
      content = content.replace(/{company_address}/g, companyInfo.address);
      content = content.replace(/{dpo_email}/g, companyInfo.dpoEmail || companyInfo.email);
      content = content.replace(/{website_url}/g, companyInfo.website);
      content = content.replace(/{phone}/g, companyInfo.phone || 'N/A');
      
      notice += `${content}\n\n`;
    });

    notice += `---\n\n*This privacy notice was generated on ${new Date().toLocaleDateString()} and should be reviewed by legal counsel before publication.*`;

    return notice;
  }

  getTemplates(): PrivacyNoticeTemplate[] {
    return this.templates;
  }

  validateNoticeCompliance(notice: string, jurisdiction: string): {
    isCompliant: boolean;
    missing: string[];
    suggestions: string[];
  } {
    const missing: string[] = [];
    const suggestions: string[] = [];

    if (jurisdiction === 'GDPR') {
      if (!notice.includes('legal basis')) {
        missing.push('Legal basis for processing');
      }
      if (!notice.includes('data protection officer') && !notice.includes('DPO')) {
        suggestions.push('Consider appointing a Data Protection Officer');
      }
      if (!notice.includes('right to erasure')) {
        missing.push('Right to erasure explanation');
      }
    }

    if (jurisdiction === 'CCPA') {
      if (!notice.includes('categories of personal information')) {
        missing.push('Categories of personal information collected');
      }
      if (!notice.includes('do not sell')) {
        missing.push('Do not sell my personal information section');
      }
    }

    return {
      isCompliant: missing.length === 0,
      missing,
      suggestions
    };
  }
}

export const privacyNoticeGenerator = new PrivacyNoticeGenerator();
