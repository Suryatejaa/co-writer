import React from 'react';

export default function Container({ className = '', children }) {
    const classes = ['container mx-auto w-full px-0 sm:px-1 md:px-1 lg:px-8', className].filter(Boolean).join(' ');
    return <div className={classes}>{children}</div>;
}


