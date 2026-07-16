/**
 * Lightweight form validator.
 * rules: { fieldName: [{ rule, message, pattern?, min?, max? }] }
 * returns { errors: {}, isValid: boolean }
 */
export const validateForm = (values, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const value = values[field];
    for (const rule of rules[field]) {
      const { rule: type, message, pattern, min, max } = rule;

      if (type === "required" && (!value || String(value).trim() === "")) {
        errors[field] = message;
        break;
      }
      if (type === "email" && value) {
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(value)) {
          errors[field] = message;
          break;
        }
      }
      if (type === "minLength" && value && value.length < min) {
        errors[field] = message;
        break;
      }
      if (type === "maxLength" && value && value.length > max) {
        errors[field] = message;
        break;
      }
      if (type === "pattern" && value && !pattern.test(value)) {
        errors[field] = message;
        break;
      }
    }
  });

  return { errors, isValid: Object.keys(errors).length === 0 };
};
