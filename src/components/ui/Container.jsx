import React from 'react';

export default function Container({ className = '', children }) {
    const classes = ['container mx-auto w-full px-4 sm:px-5 md:px-6 lg:px-8', className].filter(Boolean).join(' ');
    return <div className={classes}>{children}</div>;
}


