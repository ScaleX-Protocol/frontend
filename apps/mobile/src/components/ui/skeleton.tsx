import * as React from 'react';
import { View, ViewStyle, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  useSharedValue,
} from 'react-native-reanimated';
import { cn } from '../../lib/utils';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

interface SkeletonProps extends ViewProps {
  variant?: 'text' | 'card' | 'circular';
  width?: number | string;
  height?: number | string;
  className?: string;
}

const Skeleton = React.forwardRef<View, SkeletonProps>(
  ({ className, variant = 'text', width, height, style, ...props }, ref) => {
    const shimmerValue = useSharedValue(0);
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
      setIsMounted(true);
    }, []);

    React.useEffect(() => {
      if (!isMounted) return;

      shimmerValue.value = withRepeat(
        withTiming(1, {
          duration: 1500,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    }, [isMounted, shimmerValue]);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          {
            translateX: `${shimmerValue.value * 200}%`,
          },
        ],
      };
    });

    const getDefaultDimensions = () => {
      switch (variant) {
        case 'text':
          return { height: 14, width: '100%' };
        case 'card':
          return { height: 110, width: '100%' };
        case 'circular':
          return { height: 40, width: 40 };
        default:
          return { height: 14, width: '100%' };
      }
    };

    const defaultDimensions = getDefaultDimensions();
    const finalWidth = width ?? defaultDimensions.width;
    const finalHeight = height ?? defaultDimensions.height;

    const getVariantStyle = (): ViewStyle => {
      switch (variant) {
        case 'text':
          return { borderRadius: 4 };
        case 'card':
          return { borderRadius: 12 };
        case 'circular':
          return { borderRadius: 9999 };
        default:
          return { borderRadius: 4 };
      }
    };

    const containerStyle: ViewStyle = {
      width: finalWidth as any,
      height: finalHeight as any,
      overflow: 'hidden' as any,
      backgroundColor: '#374151', // gray-700
      ...getVariantStyle(),
    };

    return (
      <Animated.View
        ref={ref}
        className={cn(className)}
        style={[containerStyle, style]}
        {...props}
      >
        {isMounted && (
          <AnimatedLinearGradient
            colors={['#37415100', '#4B5563', '#37415100']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              {
                flex: 1,
                width: '100%',
              },
              animatedStyle,
            ]}
          />
        )}
      </Animated.View>
    );
  }
);

Skeleton.displayName = 'Skeleton';

export { Skeleton };
export type { SkeletonProps };
