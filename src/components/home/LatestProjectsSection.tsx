import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useMemo } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemeMode } from '../../theme/ThemeProvider';
import { t } from '../../i18n';

export type LatestProjectParticipant = {
  userId: string;
  username?: string;
  fullName?: string;
  avatarUrl?: string | null;
};

export type LatestProjectItem = {
  projectId: string;
  name: string;
  targetAmount: number;
  currency: string;
  progressPercent?: number;
  status?: string;
  // Chỉ có với project thuộc group project (backend trả kèm participants khi đó).
  participants?: LatestProjectParticipant[];
  isPlaceholder?: boolean;
};

// Hiện tối đa 2 avatar trên thẻ; phần vượt gộp thành badge "+N".
const MAX_AVATARS = 2;

type LatestProjectsSectionProps = {
  projects: LatestProjectItem[];
  loading?: boolean;
  onAddPress?: () => void;
};

// Pastel nhận diện của thẻ project — nền sáng cố định, chữ đậm trên thẻ luôn
// đọc được ở cả 3 theme nên giữ nguyên (tương tự balanceCard ở home).
const cardColors = ['#FFC857', '#E7DAF7', '#D9F3EA', '#DDEBFF'];

const formatMoney = (amount: number, currency: string) => {
  return `${amount.toLocaleString('en-US')} ${currency}`;
};

export default function LatestProjectsSection({
  projects,
  loading = false,
  onAddPress,
}: LatestProjectsSectionProps) {
  const { theme, mode } = useThemeMode();

  // Accent: dark mode dùng link (sáng hơn primary) cho đủ tương phản trên nền tối.
  const accent = mode === 'dark' ? theme.link : theme.primary;

  const styles = useMemo(() => StyleSheet.create({
    section: {
      marginBottom: 22,
    },

    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.text,
    },

    seeAllText: {
      fontSize: 13,
      fontWeight: '700',
      color: accent,
    },

    projectList: {
      gap: 14,
      paddingRight: 4,
    },

    projectCard: {
      width: 142,
      height: 160,
      borderRadius: 18,
      padding: 16,
      justifyContent: 'space-between',
    },

    addCard: {
      width: 142,
      height: 160,
      borderRadius: 18,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: theme.border,
      backgroundColor: theme.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },

    projectIconBox: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',

      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },

    // Thẻ nền pastel sáng cố định nên avatar dùng viền trắng + chữ tối, không theo theme.
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: 8,
    },

    avatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      marginLeft: -8,
      borderWidth: 2,
      borderColor: '#FFFFFF',
      backgroundColor: '#E2E8F0',
    },

    avatarFallback: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarInitial: {
      fontSize: 10,
      fontWeight: '800',
      color: '#334155',
    },

    projectAmount: {
      fontSize: 16,
      fontWeight: '900',
      color: '#020617',
    },

    projectName: {
      marginTop: 4,
      fontSize: 13,
      fontWeight: '500',
      color: '#475569',
    },

    loadingBox: {
      height: 120,
      borderRadius: 18,
      backgroundColor: theme.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyCard: {
      backgroundColor: theme.inputBg,
      borderRadius: 18,
      paddingVertical: 22,
      paddingHorizontal: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },

    emptyTitle: {
      marginTop: 8,
      fontSize: 15,
      fontWeight: '800',
      color: theme.text,
    },

    emptyText: {
      marginTop: 4,
      fontSize: 13,
      color: theme.subtext,
      textAlign: 'center',
      lineHeight: 18,
    },
  }), [theme, mode]);

  if (loading) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("home.projects")}</Text>
        </View>

        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={theme.text} />
        </View>
      </View>
    );
  }

  const displayData = [...projects];
  if (projects.length < 3) {
    displayData.push({
      projectId: 'add_project_placeholder',
      name: '',
      targetAmount: 0,
      currency: '',
      isPlaceholder: true,
    } as any);
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t("home.projects")}</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(tabs)/project')}
        >
          <Text style={styles.seeAllText}>{t("common.see_all")}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.projectId}
        contentContainerStyle={styles.projectList}
        renderItem={({ item, index }) => {
          if (item.isPlaceholder) {
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.addCard}
                onPress={onAddPress}
              >
                <MaterialCommunityIcons name="plus" size={32} color={theme.subtext} />
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={[
                styles.projectCard,
                {
                  backgroundColor: cardColors[index % cardColors.length],
                },
              ]}
              onPress={() =>
                router.push(`/(tabs)/project/${item.projectId}` as any)
              }
            >
              <View style={styles.cardTopRow}>
                <View style={styles.projectIconBox}>
                  <MaterialCommunityIcons
                    name="piggy-bank"
                    size={25}
                    color="#0F172A"
                  />
                </View>

                {!!item.participants?.length && (
                  <View style={styles.avatarRow}>
                    {item.participants.slice(0, MAX_AVATARS).map((p) =>
                      p.avatarUrl ? (
                        <Image
                          key={p.userId}
                          source={{ uri: p.avatarUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View
                          key={p.userId}
                          style={[styles.avatar, styles.avatarFallback]}
                        >
                          <Text style={styles.avatarInitial}>
                            {(p.fullName || p.username || '?')
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )
                    )}
                    {item.participants.length > MAX_AVATARS && (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitial}>
                          +{item.participants.length - MAX_AVATARS}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View>
                <Text style={styles.projectAmount} numberOfLines={1}>
                  {formatMoney(item.targetAmount, item.currency)}
                </Text>

                <Text style={styles.projectName} numberOfLines={1}>
                  {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
