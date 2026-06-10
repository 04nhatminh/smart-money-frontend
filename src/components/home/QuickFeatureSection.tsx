import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

type QuickFeatureSectionProps = {
  onOpenCreateProject: () => void;
};

export default function QuickFeatureSection({
  onOpenCreateProject,
}: QuickFeatureSectionProps) {
  const quickFeatures = [
    {
      id: 'project',
      title: 'Project',
      iconName: 'folder-plus-outline',
      iconType: 'material',
      onPress: onOpenCreateProject,
    },
    {
      id: 'budget',
      title: 'Budget',
      iconName: 'wallet-outline',
      iconType: 'ion',
      onPress: () => router.push('/(tabs)/budget-allocation'),
    },
    {
      id: 'classify',
      title: 'Classify',
      iconName: 'tag-multiple-outline',
      iconType: 'material',
      onPress: () => router.push('/(tabs)/transaction/unclassified'),
    },
  ];

  return (
    <View style={styles.quickFeatureWrapper}>
      <View style={styles.quickFeatureContainer}>
        {quickFeatures.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.quickFeatureItem}
            activeOpacity={0.82}
            onPress={item.onPress}
          >
            <View style={styles.quickFeatureIconBox}>
              {item.iconType === 'ion' ? (
                <Ionicons
                  name={item.iconName as any}
                  size={22}
                  color="#1F2937"
                />
              ) : (
                <MaterialCommunityIcons
                  name={item.iconName as any}
                  size={22}
                  color="#1F2937"
                />
              )}

            </View>

            <Text style={styles.quickFeatureLabel}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickFeatureWrapper: {
    marginBottom: 15,
  },

  quickFeatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EDF4F4',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },

  quickFeatureItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickFeatureIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,

    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },

  quickFeatureLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
});