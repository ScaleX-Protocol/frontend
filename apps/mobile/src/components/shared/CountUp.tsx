import React, { useEffect, useRef } from "react";
import { Text, Animated, TextStyle } from "react-native";

interface CountUpProps {
  end: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  separator?: string;
  className?: string;
  style?: TextStyle;
}

export default function CountUp({
  end,
  duration = 1000,
  decimals = 0,
  prefix = "",
  suffix = "",
  separator = "",
  style,
}: CountUpProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = React.useState("0");

  useEffect(() => {
    animatedValue.setValue(0);

    const listener = animatedValue.addListener(({ value }) => {
      let formattedValue = value.toFixed(decimals);

      // Add thousand separators if requested
      if (separator) {
        const parts = formattedValue.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, separator);
        formattedValue = parts.join(".");
      }

      setDisplayValue(`${prefix}${formattedValue}${suffix}`);
    });

    Animated.timing(animatedValue, {
      toValue: end,
      duration,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [end, duration, decimals, prefix, suffix, separator]);

  return <Text style={style}>{displayValue}</Text>;
}
