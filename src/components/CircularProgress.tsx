import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CircularProgressProps {
    percentage: number; // 0-100
    size?: number;
    strokeWidth?: number;
    color: string;
    children: React.ReactNode; // Icon component
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
    percentage,
    size = 80,
    strokeWidth = 5,
    color,
    children,
}) => {
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (clampedPercentage / 100) * circumference;

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} style={styles.svg}>
                {/* Background Track Circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#EAEAEA"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Circle */}
                {clampedPercentage > 0 && (
                    <Circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth={strokeWidth}
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation={-90}
                        originX={size / 2}
                        originY={size / 2}
                    />
                )}
            </Svg>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    svg: {
        position: 'absolute',
    },
});

