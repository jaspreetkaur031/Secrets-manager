import React from 'react';
import { cn } from '../../lib/utils';
import './Button.css';

export const Button = React.forwardRef(({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
        <button
            ref={ref}
            className={cn('btn', `btn-${variant}`, `btn-${size}`, className)}
            {...props}
        />
    );
});
Button.displayName = 'Button';
