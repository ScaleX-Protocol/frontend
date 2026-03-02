import * as React from 'react';
import { View, Pressable, PressableProps } from 'react-native';
import { Text } from './text';
import { cn } from '~/lib/utils';

export interface TabOption {
  label: string;
  value: string;
}

interface TabsProps {
  tabs: TabOption[];
  activeTab: string;
  onTabChange: (value: string) => void;
  variant?: 'underline' | 'pill';
  className?: string;
}

const Tabs = React.forwardRef<View, TabsProps>(
  ({ tabs, activeTab, onTabChange, variant = 'underline', className }, ref) => {
    return (
      <View
        ref={ref}
        className={cn(
          'flex-row',
          {
            'gap-0': variant === 'underline',
            'gap-1 bg-muted p-1 rounded-lg': variant === 'pill',
          },
          className
        )}
        role="tablist"
        accessible
        accessibilityRole="tablist"
      >
        {tabs.map((tab) => (
          <TabItem
            key={tab.value}
            tab={tab}
            isActive={activeTab === tab.value}
            onPress={() => onTabChange(tab.value)}
            variant={variant}
          />
        ))}
      </View>
    );
  }
);

Tabs.displayName = 'Tabs';

interface TabItemProps extends PressableProps {
  tab: TabOption;
  isActive: boolean;
  variant: 'underline' | 'pill';
}

const TabItem = React.forwardRef<View, TabItemProps>(
  ({ tab, isActive, variant, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(
          'items-center justify-center min-h-[44px]',
          {
            // Underline variant
            'border-b-2 flex-1': variant === 'underline',
            'border-primary': variant === 'underline' && isActive,
            'border-transparent': variant === 'underline' && !isActive,
            // Pill variant
            'flex-1 rounded-md px-4 py-3': variant === 'pill',
            'bg-background shadow-sm': variant === 'pill' && isActive,
            'bg-transparent': variant === 'pill' && !isActive,
          }
        )}
        role="tab"
        accessible
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={tab.label}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
        })}
        {...props}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            {
              'text-foreground': isActive,
              'text-muted-foreground': !isActive,
            }
          )}
        >
          {tab.label}
        </Text>
      </Pressable>
    );
  }
);

TabItem.displayName = 'TabItem';

export { Tabs };
export type { TabsProps };
