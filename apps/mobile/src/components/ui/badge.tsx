import * as React from 'react';
import { Text, View, ViewProps } from 'react-native';
import { cn } from '~/lib/utils';

interface BadgeProps extends ViewProps {
  variant?: 'positive' | 'negative' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, variant = 'neutral', size = 'md', children, ...props }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-full min-h-[20px]',
          {
            'bg-green-500': variant === 'positive',
            'bg-red-500': variant === 'negative',
            'bg-gray-500': variant === 'neutral',
          },
          {
            'px-2 py-0.5': size === 'sm',
            'px-3 py-1': size === 'md',
            'px-4 py-1.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        <Text
          className={cn('text-white font-medium', {
            'text-xs': size === 'sm',
            'text-sm': size === 'md',
            'text-base': size === 'lg',
          })}
        >
          {children}
        </Text>
      </View>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps };
