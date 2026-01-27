import * as React from 'react';
import { View, TextInput, TextInputProps, AccessibilityState } from 'react-native';
import { Text } from './text';
import { cn } from '~/lib/utils';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  type?: 'text' | 'number';
  containerClassName?: string;
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, label, error, type = 'text', containerClassName, placeholder, accessibilityLabel, ...props }, ref) => {
    return (
      <View className={cn('gap-1.5', containerClassName)}>
        {label && (
          <Text className="text-sm font-medium text-foreground">{label}</Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            'h-12 min-h-[44px] rounded-md border border-gray-200 bg-background px-3 text-base text-foreground',
            'placeholder:text-gray-400',
            error && 'border-red-500',
            className
          )}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={type === 'number' ? 'decimal-pad' : props.keyboardType || 'default'}
          accessibilityLabel={accessibilityLabel || label}
          aria-invalid={!!error}
          {...props}
        />
        {error && (
          <Text className="text-xs text-red-500" accessibilityRole="alert">{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
