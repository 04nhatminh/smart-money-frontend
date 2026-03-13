import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, DimensionValue  } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import {t} from '../../src/i18n';

const { width, height } = Dimensions.get('window');

// Danh sách các vòng tròn trang trí với vị trí và kích thước khác nhau
const decorativeCircles: {
  top?: DimensionValue;
  left?: DimensionValue;
  right?: DimensionValue;
  bottom?: DimensionValue;
  size: number;
  opacity: number;
}[] = [
  { top: '10%', left: '5%', size: 80, opacity: 0.3 },
  { top: '20%', right: '10%', size: 120, opacity: 0.2 },
  { bottom: '15%', left: '20%', size: 60, opacity: 0.4 },
  { bottom: '30%', right: '15%', size: 100, opacity: 0.25 },
  { top: '50%', left: '30%', size: 40, opacity: 0.5 },
  { top: '70%', right: '25%', size: 150, opacity: 0.15 },
];

const WaitScreen = () => {
  return (
    <View style={styles.container}>
      {/* Video nền */}
      <Video
        source={require('../../assets/wait.webm')} // File wait.webm trong thư mục assets
        style={styles.video}
        shouldPlay
        isLooping
        resizeMode={ResizeMode.COVER}
        isMuted={true}
      />

      {/* Lớp vòng tròn trang trí */}
      <View style={styles.circlesOverlay}>
        {decorativeCircles.map((circle, index) => (
          <View
            key={index}
            style={[
              styles.circle1,
              {
                width: circle.size,
                height: circle.size,
                borderRadius: circle.size / 2,
                backgroundColor: '#3629B7',
                opacity: circle.opacity,
                top: circle.top,
                left: circle.left,
                right: circle.right,
                bottom: circle.bottom,
              },
            ]}
          />
        ))}
      </View>

      {/* Vòng tròn loading */}
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>

      {/* Chữ dưới cùng */}
      <View style={styles.textContainer}>
        <Text style={styles.text}>{t('wait.waiting')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff', // Màu nền dự phòng
  },
  video: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  circlesOverlay: {
    ...StyleSheet.absoluteFillObject, // Phủ lên video
  },
  circle1: {
    position: 'absolute',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: height * 0.6, // Điều chỉnh vị trí loading
  },
  textContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    color: '#000',
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
});

export default WaitScreen;