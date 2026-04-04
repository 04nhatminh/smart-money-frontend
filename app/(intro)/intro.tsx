import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width, height } = Dimensions.get('window');
import { router } from 'expo-router';
import { useOnboarding } from '../../src/context/OnboardingContext';
import { useAuth } from '../../src/context/AuthContext';

const videos = [
  require('../../assets/intro1.mp4'),
  require('../../assets/intro2.mp4'),
  require('../../assets/intro3.mp4'),
  require('../../assets/intro4.mp4'),
];
  
const texts = [
  'Theo dõi chi tiêu dễ dàng',
  'Lập kế hoạch tiết kiệm thông minh',
  'Phân tích tài chính cá nhân',
  'Xây dựng thói quen tài chính lành mạnh',
];

const Intro: React.FC = () => {
  const [gifIndex, setGifIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const dotAnimations = useRef([...Array(4)].map(() => new Animated.Value(0))).current;
  const { completeOnboarding } = useOnboarding();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    const gifInterval = setInterval(() => {
      // Fade out
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      
      setGifIndex((prev) => (prev + 1) % videos.length);
    }, 3000);

    const textInterval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 3000);

    return () => {
      clearInterval(gifInterval);
      clearInterval(textInterval);
    };
  }, []);

  // Update dot animations when index changes
  useEffect(() => {
    dotAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === textIndex ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [textIndex]);

  const handlePressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleGetStarted = async () => {
    await completeOnboarding();


    if (isSignedIn) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/auth");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9ff" />
      
      {/* Background Image/Video */}
      <View style={styles.mediaContainer}>
        <Animated.View style={[styles.mediaWrapper, { opacity: fadeAnim }]}>
          <Video
            source={videos[gifIndex]}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.mediaOverlay}
          />
        </Animated.View>
      </View>

      {/* Content Overlay */}
      <View style={styles.contentOverlay}>
        {/* Main Content Card */}
        <View style={styles.contentCard}>
          {/* Title - Căn giữa */}
          <Text style={styles.title}>
            <Text style={styles.titleLight}>SMART</Text>
            {'\n'}
            <Text style={styles.titleHighlight}>MONEY</Text>
          </Text>

          {/* Dot Indicators - Căn giữa */}
          <View style={styles.dotContainer}>
            {texts.map((_, index) => {
              const dotWidth = dotAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [8, 20],
              });
              
              const dotOpacity = dotAnimations[index].interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: index === textIndex ? '#3629B7' : '#A0A0A0',
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Description with animation - Căn giữa */}
          <Animated.View style={[styles.descriptionContainer]}>
            <Text style={styles.description}>{texts[textIndex]}</Text>
          </Animated.View>

          {/* Get Started Button - Căn giữa */}
          <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: buttonScaleAnim }] }]}>
            <TouchableOpacity
              style={styles.button}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              onPress={handleGetStarted}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#3629B7', '#4B3FCC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Get Started</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>

      {/* Decorative Elements */}
      <View style={styles.decorativeCircle1} />
      <View style={styles.decorativeCircle2} />
    </View>
  );
};

export default Intro;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  mediaContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.55,
    backgroundColor: '#3629B7',
  },
  mediaWrapper: {
    flex: 1,
    backgroundColor: '#000',
  },
  media: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  contentOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 30,
  },
  contentCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 30,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center', // Căn giữa tất cả nội dung trong card
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 36,
    textAlign: 'center', // Căn giữa text
    marginBottom: 25,
    lineHeight: 46,
  },
  titleLight: {
    fontWeight: '300',
    color: '#333',
  },
  titleHighlight: {
    fontWeight: '700',
    color: '#3629B7',
  },
  dotContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Căn giữa các dot
    width: '100%',
    marginBottom: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4, // Sử dụng margin ngang thay vì marginRight
  },
  descriptionContainer: {
    marginBottom: 35,
    width: '100%',
    alignItems: 'center', // Căn giữa nội dung description
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    opacity: 0.9,
    textAlign: 'center', // Căn giữa text description
    paddingHorizontal: 20, // Thêm padding để text không sát mép
  },
  buttonWrapper: {
    width: '100%',
    alignItems: 'center', // Căn giữa button
  },
  button: {
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#3629B7',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '80%', // Button chiếm 80% chiều rộng card
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: height * 0.3,
    right: -40,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(54, 41, 183, 0.05)',
    zIndex: -1,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(54, 41, 183, 0.05)',
    zIndex: -1,
  },
});