import * as React from 'react';
import { Pressable, PressableProps } from 'react-native';
import { cn } from '~/lib/utils';

interface ButtonProps extends PressableProps {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-md',
          {
            'bg-primary': variant === 'default',
            'border border-input bg-background': variant === 'outline',
            'bg-transparent': variant === 'ghost',
            'bg-destructive': variant === 'destructive',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };
