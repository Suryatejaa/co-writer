// Update src/components/ui/Input.jsx
import React from 'react';

const Input = ({
    id,
    name,
    value,
    onChange,
    placeholder,
    type = 'text',
    required = false,
    disabled = false,
    className = '',
    ...props
}) => {
    return (
        <input
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            type={type}
            required={required}
            disabled={disabled}
            className={`form-control ${className}`}
            {...props}
        />
    );
};

export default Input;