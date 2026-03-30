"use client";
import { useState, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";

// Validation rules
const VALIDATION_RULES = {
  name: {
    required: true,
    minLength: 2,
    pattern: /^[a-zA-Z\s\.\-']+$/,
    message: {
      required: "Name is required",
      minLength: "Name must be at least 2 characters",
      pattern: "Name can only contain letters, spaces, dots, hyphens, and apostrophes"
    }
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: {
      required: "Email is required",
      pattern: "Please enter a valid email address"
    }
  },
  password: {
    required: true,
    minLength: 6,
    message: {
      required: "Password is required",
      minLength: "Password must be at least 6 characters"
    }
  },
  role: {
    required: true,
    message: {
      required: "Role is required"
    }
  },
  confirmPassword: {
    required: true,
    minLength: 8,
    custom: (value, originalPassword) => {
      if (value !== originalPassword) {
        return "Passwords do not match";
      }
      return null;
    },
    message: {
      required: "Password confirmation is required",
      minLength: "Password must be at least 8 characters"
    }
  },
  newPassword: {
    required: true,
    minLength: 8,
    custom: (value) => {
      const hasMinLength = value.length >= 8;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /[0-9]/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      const criteriaCount = [hasMinLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
      
      if (criteriaCount < 5) {
        return "Password must meet all security requirements";
      }
      return null;
    },
    message: {
      required: "New password is required",
      minLength: "Password must be at least 8 characters"
    }
  }
};

export function useValidation() {
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [showPasswords, setShowPasswords] = useState({});

  const validateField = useCallback((fieldName, value, options = {}) => {
    const { rule = VALIDATION_RULES[fieldName], originalPassword, required = true } = options;
    const errors = { ...validationErrors };

    if (!rule) return true;

    // Check if field is required
    if (required && rule.required && (!value || value.trim() === "")) {
      errors[fieldName] = rule.message.required;
    } else {
      // Check minimum length
      if (rule.minLength && value.length < rule.minLength) {
        errors[fieldName] = rule.message.minLength;
      }
      // Check pattern
      else if (rule.pattern && !rule.pattern.test(value.trim())) {
        errors[fieldName] = rule.message.pattern;
      }
      // Check custom validation
      else if (rule.custom) {
        const customError = rule.custom(value, originalPassword);
        if (customError) {
          errors[fieldName] = customError;
        } else {
          delete errors[fieldName];
        }
      }
      // No errors
      else {
        delete errors[fieldName];
      }
    }

    setValidationErrors(errors);
    return !errors[fieldName];
  }, [validationErrors]);

  const handleFieldChange = useCallback((fieldName, value, options = {}) => {
    validateField(fieldName, value, options);
  }, [validateField]);

  const handleFieldBlur = useCallback((fieldName, value, options = {}) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, value, options);
  }, [validateField]);

  const handleFieldFocus = useCallback((fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: false }));
  }, []);

  const togglePasswordVisibility = useCallback((fieldName) => {
    setShowPasswords(prev => ({ ...prev, [fieldName]: !prev[fieldName] }));
  }, []);

  const validateForm = useCallback((formData, requiredFields = []) => {
    let hasErrors = false;
    const newErrors = {};

    requiredFields.forEach(fieldName => {
      const value = formData[fieldName];
      const options = fieldName === 'confirmPassword' 
        ? { originalPassword: formData.password }
        : {};
      
      const isValid = validateField(fieldName, value, options);
      if (!isValid) {
        hasErrors = true;
      }
    });

    // Mark all required fields as touched
    const touched = {};
    requiredFields.forEach(field => {
      touched[field] = true;
    });
    setTouchedFields(touched);

    return !hasErrors;
  }, [validateField]);

  const resetValidation = useCallback(() => {
    setValidationErrors({});
    setTouchedFields({});
    setShowPasswords({});
  }, []);

  const getFieldError = useCallback((fieldName) => {
    return touchedFields[fieldName] ? validationErrors[fieldName] : null;
  }, [touchedFields, validationErrors]);

  const hasFieldError = useCallback((fieldName) => {
    return touchedFields[fieldName] && !!validationErrors[fieldName];
  }, [touchedFields, validationErrors]);

  const hasFormErrors = useCallback(() => {
    return Object.keys(validationErrors).some(key => validationErrors[key]);
  }, [validationErrors]);

  return {
    validationErrors,
    touchedFields,
    showPasswords,
    handleFieldChange,
    handleFieldBlur,
    handleFieldFocus,
    togglePasswordVisibility,
    validateField,
    validateForm,
    resetValidation,
    getFieldError,
    hasFieldError,
    hasFormErrors
  };
}

export function ValidatedInput({ 
  type = "text", 
  name, 
  label, 
  value, 
  onChange, 
  onBlur, 
  onFocus,
  placeholder,
  required = false,
  disabled = false,
  className = "",
  validationHook,
  validationOptions = {}
}) {
  const {
    handleFieldChange,
    handleFieldBlur,
    handleFieldFocus,
    togglePasswordVisibility,
    showPasswords,
    hasFieldError,
    getFieldError
  } = validationHook;

  const isPassword = type === "password";
  const inputType = isPassword && showPasswords[name] ? "text" : type;

  const handleChange = (e) => {
    const newValue = e.target.value;
    handleFieldChange(name, newValue, validationOptions);
    if (onChange) onChange(e);
  };

  const handleBlur = (e) => {
    const newValue = e.target.value;
    handleFieldBlur(name, newValue, validationOptions);
    if (onBlur) onBlur(e);
  };

  const handleFocus = (e) => {
    handleFieldFocus(name);
    if (onFocus) onFocus(e);
  };

  const baseInputClasses = "w-full px-4 py-2 text-sm rounded-lg border transition-colors duration-150";
  const errorClasses = hasFieldError(name) ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500";
  const disabledClasses = disabled ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "";
  const passwordPadding = isPassword ? "pr-10" : "";

  const inputClasses = `${baseInputClasses} ${errorClasses} ${disabledClasses} ${passwordPadding} ${className}`;

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-gray-500 text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          name={name}
          id={name}
          value={value || ""}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={inputClasses}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => togglePasswordVisibility(name)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            {showPasswords[name] ? (
              <EyeOff strokeWidth={1.5} className="w-4 h-4" />
            ) : (
              <Eye strokeWidth={1.5} className="w-4 h-4" />
            )}
          </button>
        )}
        {hasFieldError(name) && (
          <span className="absolute -bottom-5 left-0 text-xs text-red-500 mb-2">
            {getFieldError(name)}
          </span>
        )}
      </div>
    </div>
  );
}

export function showToasterError(setErrorMessage, setStatus, message) {
  setErrorMessage(message);
  setStatus("error");
  setTimeout(() => setStatus("idle"), 5000);
}
