/**
 * Validation Service
 * Centralized input validation with reusable rules
 */

/**
 * Validation Rules Library
 */
const rules = {
  // Text validation
  required: (value) => {
    return value && value.toString().trim() ? null : 'This field is required';
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Invalid email format';
  },

  minLength: (min) => {
    return (value) => {
      return !value || value.length >= min ? null : `Minimum ${min} characters required`;
    };
  },

  maxLength: (max) => {
    return (value) => {
      return !value || value.length <= max ? null : `Maximum ${max} characters allowed`;
    };
  },

  pattern: (pattern, message) => {
    return (value) => {
      return !value || pattern.test(value) ? null : message || 'Invalid format';
    };
  },

  // Number validation
  number: (value) => {
    return !value || !isNaN(value) ? null : 'Must be a number';
  },

  min: (min) => {
    return (value) => {
      return !value || parseFloat(value) >= min ? null : `Minimum value is ${min}`;
    };
  },

  max: (max) => {
    return (value) => {
      return !value || parseFloat(value) <= max ? null : `Maximum value is ${max}`;
    };
  },

  // Specific validations
  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain number';
    return null;
  },

  match: (fieldValue) => {
    return (value) => {
      return value === fieldValue ? null : 'Fields do not match';
    };
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return 'Invalid URL format';
    }
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(value) ? null : 'Invalid phone format';
  }
};

/**
 * Pre-defined validation schemas
 */
const schemas = {
  login: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.minLength(6)]
  },

  register: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.password],
    confirmPassword: [rules.required],
    neighborhood: [rules.required]
  },

  campaign: {
    title: [rules.required, rules.minLength(3), rules.maxLength(100)],
    description: [rules.required, rules.minLength(10), rules.maxLength(1000)],
    neighborhood: [rules.required]
  },

  reward: {
    title: [rules.required, rules.minLength(3), rules.maxLength(100)],
    cost: [rules.required, rules.number, rules.min(1), rules.max(10000)],
    category: [rules.required]
  },

  profile: {
    username: [rules.required, rules.minLength(3), rules.maxLength(50)],
    email: [rules.required, rules.email]
  }
};

/**
 * Validate single field
 * @param {*} value - Value to validate
 * @param {Array} fieldRules - Array of validation rules
 * @returns {string|null} Error message or null if valid
 */
export function validateField(value, fieldRules = []) {
  for (const rule of fieldRules) {
    const error = typeof rule === 'function' ? rule(value) : null;
    if (error) return error;
  }
  return null;
}

/**
 * Validate entire form
 * @param {Object} data - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} { isValid: boolean, errors: { fieldName: errorMessage } }
 */
export function validateForm(data, schema) {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const error = validateField(value, rules);
    if (error) {
      errors[field] = error;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validate using pre-defined schema
 * @param {string} schemaName - Name of pre-defined schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validation result
 */
export function validateWithSchema(schemaName, data) {
  const schema = schemas[schemaName];
  if (!schema) {
    console.error(`❌ Schema not found: ${schemaName}`);
    return { isValid: false, errors: {} };
  }
  return validateForm(data, schema);
}

/**
 * Add custom rule
 * @param {string} name - Rule name
 * @param {Function} rule - Rule function
 */
export function addRule(name, rule) {
  rules[name] = rule;
}

/**
 * Add custom schema
 * @param {string} name - Schema name
 * @param {Object} schema - Schema definition
 */
export function addSchema(name, schema) {
  schemas[name] = schema;
}

/**
 * Get validation error message from API response
 * @param {Object} error - API error object
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
  if (error.message) return error.message;
  if (error.error?.message) return error.error.message;
  if (error.data?.message) return error.data.message;
  return 'An error occurred';
}

export { rules, schemas };
