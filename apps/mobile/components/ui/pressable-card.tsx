import * as React from 'react';
import { Pressable, PressableProps, View, GestureResponderEvent } from 'react-native';
import { cn } from '~/lib/utils';
import { Card, CardProps } from './card';

export interface PressableCardProps extends Omit<CardProps, 'onPress'> {
  onPress?: ((event: GestureResponderEvent) => void) | null;
  onLongPress?: ((event: GestureResponderEvent) => void) | null;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const PressableCard = React.forwardRef<View, PressableCardProps>(
  ({ className, children, onPress, onLongPress, disabled, ...props }, ref) => {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        onLongPress={disabled ? undefined : onLongPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled ?? false }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : disabled ? 0.5 : 1.0,
        })}
        className={cn('min-h-[44px]', className)}
      >
        <View ref={ref}>
          <Card {...props}>
            {children}
          </Card>
        </View>
      </Pressable>
    );
  }
);

PressableCard.displayName = 'PressableCard';

export { PressableCard };
