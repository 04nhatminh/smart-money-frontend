import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  Image, 
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  RefreshControl
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { userStorage } from "../../src/storage/userStorage";
import { UserResponse } from "../../src/types/auth.types";
import { BottomBar } from "../../src/components/BottomBar";
import { CameraModal } from "../../src/components/camera/CameraModal";
import { useTabNavigation } from "../../src/hooks/useTabNavigation";

// Mock data for categories
const categories = [
  { id: '1', name: 'Groceries', icon: 'cart', color: '#4CAF50' },
  { id: '2', name: 'Transport', icon: 'car', color: '#2196F3' },
  { id: '3', name: 'Food', icon: 'restaurant', color: '#FF9800' },
  { id: '4', name: 'Shopping', icon: 'bag', color: '#E91E63' },
  { id: '5', name: 'Entertainment', icon: 'film', color: '#9C27B0' },
  { id: '6', name: 'Bills', icon: 'document-text', color: '#F44336' },
];

// Mock data for recent transactions
const recentTransactions = [
  { id: '1', name: 'Supermarket', amount: '-$45.99', date: 'Today', icon: 'cart' },
  { id: '2', name: 'Starbucks', amount: '-$5.50', date: 'Yesterday', icon: 'cafe' },
  { id: '3', name: 'Uber', amount: '-$12.75', date: 'Yesterday', icon: 'car' },
  { id: '4', name: 'Netflix', amount: '-$15.99', date: '2 days ago', icon: 'tv' },
];

export default function HomePage() {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useTabNavigation(() => setCameraVisible(true));

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await userStorage.getUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to load user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserData();
    setRefreshing(false);
  };

  const renderCategoryItem = ({ item }: { item: typeof categories[0] }) => (
    <TouchableOpacity style={styles.categoryItem}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={24} color={item.color} />
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderTransactionItem = ({ item }: { item: typeof recentTransactions[0] }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIcon}>
          <Ionicons name={item.icon as any} size={20} color="#666" />
        </View>
        <View>
          <Text style={styles.transactionName}>{item.name}</Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      </View>
      <Text style={styles.transactionAmount}>{item.amount}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#3629B7']}
            tintColor="#3629B7"
          />
        }
      >
        <View style={styles.container}>
          {/* Header with Avatar and Greeting */}
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                {user?.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user?.fullName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Hello,</Text>
                <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.notificationBtn}>
              <Ionicons name="notifications-outline" size={24} color="#333" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            ) : (
              <Ionicons name="options-outline" size={20} color="#999" />
            )}
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>$12,345.67</Text>
            <View style={styles.balanceFooter}>
              <View style={styles.balanceChange}>
                <Ionicons name="arrow-up" size={16} color="#4CAF50" />
                <Text style={styles.balanceChangeText}>+2.5% from last month</Text>
              </View>
            </View>
          </View>

          {/* Categories Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesList}
            />
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {recentTransactions.map(item => (
              <View key={item.id}>
                {renderTransactionItem({ item })}
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#3629B7' }]}>
                <Ionicons name="send" size={20} color="#fff" />
              </View>
              <Text style={styles.actionText}>Send</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="download" size={20} color="#fff" />
              </View>
              <Text style={styles.actionText}>Receive</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#FF9800' }]}>
                <Ionicons name="card" size={20} color="#fff" />
              </View>
              <Text style={styles.actionText}>Pay</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <View style={[styles.actionIcon, { backgroundColor: '#E91E63' }]}>
                <Ionicons name="add" size={20} color="#fff" />
              </View>
              <Text style={styles.actionText}>Top up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <BottomBar
        active={navigation.activeTab}
        onHome={navigation.navigateToHome}
        onStats={navigation.navigateToStats}
        onAdd={navigation.handleCameraOpen}
        onWallet={navigation.navigateToWallet}
        onProfile={navigation.navigateToProfile}
        onAddByForm={() => console.log("Form input triggered")}
        onAddByCamera={() => setCameraVisible(true)}
        onAddByVoice={() => console.log("Voice input triggered")}
      />

      <CameraModal
        visible={cameraVisible}
        onClose={() => setCameraVisible(false)}
        onCaptureBill={(receipt) => {
          console.log("Bill captured:", receipt);
          setCameraVisible(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3629B7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  greetingContainer: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  balanceCard: {
    backgroundColor: '#3629B7',
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  balanceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  balanceChangeText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#3629B7',
    fontWeight: '600',
  },
  categoriesList: {
    paddingRight: 20,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#999',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F44336',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 30,
  },
  actionButton: {
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});