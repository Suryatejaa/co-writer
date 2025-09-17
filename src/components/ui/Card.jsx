import React from 'react';

export function Card({ className = '', children, ...props }) {
    const classes = [
        'rounded-2xl bg-white/10 backdrop-blur-xl border border-white/15',
        'shadow-[0_10px_30px_rgba(0,0,0,0.18)]',
        'transition-transform duration-300 ease-out will-change-transform',
        'hover:-translate-y-0.5',
        'p-6 sm:p-10',
        className
    ].filter(Boolean).join(' ');
    return (
        <section className={classes} {...props}>{children}</section>
    );
}

export function CardHeader({ className = '', children }) {
    return <div className={[className].filter(Boolean).join(' ')}>{children}</div>;
}

export function CardTitle({ className = '', children }) {
    return <h2 className={["text-xl font-semibold", className].join(' ')}>{children}</h2>;
}

export function CardContent({ className = '', children }) {
    return <div className={className}>{children}</div>;
}


