import React, { useEffect, useRef, useState } from "react";
import { View, Animated, TouchableOpacity, Text } from "react-native";
import AIInsightBubble from "./AIInsightBubble";
import { InsightItem } from "../../storage/aiInsightStorage";

interface Props {
    insights: InsightItem[];
}

export default function AIInsightList({ insights }: Props) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(true);

    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!insights.length || !visible) return;

        let isMounted = true;

        const runAnimation = () => {
            opacity.setValue(0);

            // fade in
            Animated.timing(opacity, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }).start(() => {

                // giữ 5s
                setTimeout(() => {
                    // fade out
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 400,
                        useNativeDriver: true,
                    }).start(() => {
                        if (!isMounted) return;

                        setCurrentIndex((prev) => {
                            const next = prev + 1;

                            // ❌ hết list → ẩn luôn
                            if (next >= insights.length) {
                                setVisible(false);
                                return prev;
                            }

                            return next;
                        });
                    });
                }, 5000);
            });
        };

        runAnimation();

        return () => {
            isMounted = false;
        };
    }, [currentIndex, insights, visible]);

    if (!insights.length || !visible) return null;

    return (
        <View
            style={{
                position: "absolute",
                bottom: 100,
                left: 0,
                right: 0,
                zIndex: 100,
                alignItems: "center",
            }}
        >
            <Animated.View
                style={{
                    opacity,
                    width: "100%",
                    alignItems: "center",
                }}
            >
                <AIInsightBubble
                    insight={insights[currentIndex]}
                    loading={false}
                    onClose={() => setVisible(false)}
                />
            </Animated.View>
        </View>
    );
}