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
    if (value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '')) {
      return "Полето е задължително";
    }
    return null;
  },

  email: (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : "Невалиден имейл формат";
  },

  minLength: (min) => {
    return (value) => {
      if (value === null || value === undefined || value === '') return null;
      return value.length >= min ? null : `Минимална дължина е ${min}`;
    };
  },

  maxLength: (max) => {
    return (value) => {
      return !value || value.length <= max ? null : `Максимална дължина е ${max}`;
    };
  },

  pattern: (pattern, message) => {
    return (value) => {
      return !value || pattern.test(value) ? null : message || "Невалиден формат";
    };
  },

  // Number validation
  number: (value) => {
    return !value || !isNaN(value) ? null : "Трябва да е число";
  },

  min: (min) => {
    return (value) => {
      return !value || parseFloat(value) >= min ? null : `Минимална стойност е ${min}`;
    };
  },

  max: (max) => {
    return (value) => {
      return !value || parseFloat(value) <= max ? null : `Максимална стойност е ${max}`;
    };
  },

  // Specific validations
  password: (value) => {
    if (!value) return "Изисква се парола";
    if (value.length < 8) return "Паролата трябва да е поне 8 символа";
    if (!/[A-Z]/.test(value)) return "Паролата трябва да съдържа главна буква";
    if (!/[a-z]/.test(value)) return "Паролата трябва да съдържа малка буква";
    if (!/[0-9]/.test(value)) return "Паролата трябва да съдържа число";
    return null;
  },

  match: (fieldValue) => {
    return (value) => {
      return value === fieldValue ? null : "Fields do not match";
    };
  },

  url: (value) => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return "Invalid URL format";
    }
  },

  phone: (value) => {
    if (!value) return null;
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(value) ? null : "Invalid phone format";
  },
};

/**
 * Pre-defined validation schemas
 */
const schemas = {
  login: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.minLength(6)],
  },

  register: {
    email: [rules.required, rules.email],
    password: [rules.required, rules.password],
    confirmPassword: [rules.required],
    neighborhood: [rules.required],
  },

  campaign: {
    title: [rules.required, rules.minLength(3), rules.maxLength(100)],
    description: [rules.required, rules.minLength(10), rules.maxLength(1000)],
    neighborhood: [rules.required],
  },

  reward: {
    title: [rules.required, rules.minLength(3), rules.maxLength(100)],
    cost: [rules.required, rules.number, rules.min(1), rules.max(10000)],
    category: [rules.required],
  },

  profile: {
    username: [rules.required, rules.minLength(3), rules.maxLength(50)],
    email: [rules.required, rules.email],
  },
};

/**
 * Validate single field
 * @param {*} value - Value to validate
 * @param {Array} fieldRules - Array of validation rules
 * @returns {string|null} Error message or null if valid
 */
export function validateField(value, fieldRules = []) {
  for (const rule of fieldRules) {
    let error = null;
    if (typeof rule === "function") {
      error = rule(value);
    } else if (typeof rule === "string" && typeof rules[rule] === "function") {
      error = rules[rule](value);
    }
    if (error) return error;
  }
  return true;
}

/**
 * Validate entire form
 * @param {Object} data - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} { isValid: boolean, errors: { fieldName: errorMessage } }
 */
export function validateForm(data, schema) {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(schema)) {
    const value = data[field];
    const isEmpty = value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
    if (isEmpty) {
      // Only check required rule
      let requiredRule = fieldRules.find(r => r === 'required' || r === rules.required);
      if (requiredRule) {
        let error = typeof requiredRule === 'function' ? requiredRule(value) : rules[requiredRule](value);
        if (typeof error === 'string' && error) {
          errors[field] = error;
        }
      }
      continue;
    }
    // For non-empty values, check all rules
    for (const rule of fieldRules) {
      let error = null;
      if (typeof rule === "function") {
        error = rule(value);
      } else if (typeof rule === "string" && typeof rules[rule] === "function") {
        error = rules[rule](value);
      } else if (typeof rule === "object" && rule !== null) {
        // Handle object rule: { minLength: 6 }
        const key = Object.keys(rule)[0];
        if (typeof rules[key] === "function") {
          error = rules[key](rule[key])(value);
        }
      }
      if (field === 'password') {
        console.log('DEBUG password:', value, rule, error);
      }
      if (typeof error === 'string' && error) {
        errors[field] = error;
        break;
      }
    }
  }
  return errors;
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
    return {};
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
  return "An error occurred";
}

export { rules, schemas };
