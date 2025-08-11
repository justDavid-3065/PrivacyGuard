
export const validateSelectValue = (value: any): string => {
  if (value === null || value === undefined || value === '') {
    return 'unknown';
  }
  return String(value);
};

export const sanitizeSelectOptions = (options: any[]): any[] => {
  return options.map(option => ({
    ...option,
    value: validateSelectValue(option.value),
  }));
};

export const validateFormData = (data: Record<string, any>): Record<string, any> => {
  const sanitized: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      sanitized[key] = value === '' ? 'unknown' : value;
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};
