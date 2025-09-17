// Create src/components/ui/Select.jsx
import React from 'react';

const Select = ({ id, name, value, onChange, options, disabled = false }) => {
    return (
        <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className="form-control"
        >
            {options.map((option) => (
                <option key={option.value} value={option.value}>
                    {option.label}
                </option>
            ))}
        </select>
    );
};

export default Select;