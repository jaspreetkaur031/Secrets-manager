import React from 'react';
import { cn } from '../../lib/utils';
import './Input.css';

export const Input = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn('input', className)}
            {...props}
        />
    );
});
Input.displayName = 'Input';
