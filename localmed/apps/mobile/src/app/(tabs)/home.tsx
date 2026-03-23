import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Find Medicines</Text>
            <Text style={styles.subtitle}>near you</Text>
          </View>
        </View>

        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/search')}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search medicines..."
              editable={false}
              onPressIn={() => router.push('/(tabs)/search')}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>💊</Text>
              <Text style={styles.actionText}>Prescription</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard}>
              <Text style={styles.actionIcon}>🏥</Text>
              <Text style={styles.actionText}>24/7 Pharmacies</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.nearbySection}>
          <Text style={styles.sectionTitle}>Nearby Pharmacies</Text>
          <TouchableOpacity style={styles.pharmacyCard}>
            <View>
              <Text style={styles.pharmacyName}>Sharma Medical Store</Text>
              <Text style={styles.pharmacyAddress}>0.3 km • Karol Bagh</Text>
            </View>
            <Text style={styles.openBadge}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pharmacyCard}>
            <View>
              <Text style={styles.pharmacyName}>Apollo Pharmacy</Text>
              <Text style={styles.pharmacyAddress}>0.8 km • Connaught Place</Text>
            </View>
            <Text style={styles.openBadge}>Open</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quickActions: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#64748b',
  },
  nearbySection: {
    padding: 16,
  },
  pharmacyCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  pharmacyAddress: {
    fontSize: 14,
    color: '#64748b',
  },
  openBadge: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
  },
});
