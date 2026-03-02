import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";

interface ProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  gradientColors?: [string, string];
  borderRadius?: number;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  height = 4,
  backgroundColor = "#222222",
  gradientColors = ["#E26B1D", "#F07830"],
  borderRadius = 999,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <View
      style={[
        styles.container,
        { height, borderRadius, backgroundColor },
        style,
      ]}
    >
      <View
        style={[
          styles.progressContainer,
          { width: `${clampedProgress}%`, height, borderRadius },
        ]}
      >
        <Svg width="100%" height={height} style={styles.svg}>
          <Defs>
            <LinearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <Stop offset="0%" stopColor={gradientColors[0]} stopOpacity="1" />
              <Stop
                offset="100%"
                stopColor={gradientColors[1]}
                stopOpacity="1"
              />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height={height}
            fill="url(#progressGradient)"
            rx={borderRadius}
          />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  progressContainer: {
    overflow: "hidden",
  },
  svg: {
    position: "absolute",
    top: 0,
    left: 0,
  },
});
