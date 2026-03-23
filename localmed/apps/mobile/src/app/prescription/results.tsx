import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

interface Medicine {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  quantity?: string;
  confidence: number;
  isVerified: boolean;
  matchedMedicine?: {
    id: string;
    name: string;
  };
}

export default function PrescriptionResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/v1/prescriptions/${id}/medicines`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setMedicines(data.data.medicines);
      }
    } catch (error) {
      console.error('Failed to fetch prescription results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Processing prescription...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Extracted Medicines</Text>
        <Text style={styles.subtitle}>
          Found {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} in your prescription
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {medicines.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No medicines found</Text>
            <Text style={styles.emptyText}>
              We couldn't find any medicines in your prescription. Please try again with a clearer image.
            </Text>
          </View>
        ) : (
          <View style={styles.medicineList}>
            {medicines.map((medicine) => (
              <View key={medicine.id} style={styles.medicineCard}>
                <View style={styles.medicineHeader}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <View style={[
                    styles.confidenceBadge,
                    medicine.confidence > 0.8 ? styles.highConfidence : styles.lowConfidence
                  ]}>
                    <Text style={styles.confidenceText}>
                      {Math.round(medicine.confidence * 100)}% confidence
                    </Text>
                  </View>
                </View>

                {medicine.dosage && (
                  <Text style={styles.medicineDetail}>Dosage: {medicine.dosage}</Text>
                )}
                {medicine.frequency && (
                  <Text style={styles.medicineDetail}>Frequency: {medicine.frequency}</Text>
                )}
                {medicine.quantity && (
                  <Text style={styles.medicineDetail}>Quantity: {medicine.quantity}</Text>
                )}

                {medicine.matchedMedicine ? (
                  <View style={styles.matchedContainer}>
                    <Text style={styles.matchedLabel}>✓ Matched with:</Text>
                    <Text style={styles.matchedName}>{medicine.matchedMedicine.name}</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.searchButton}>
                    <Text style={styles.searchButtonText}>Search Availability</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>
            1. Verify the extracted medicines are correct
          </Text>
          <Text style={styles.infoText}>
            2. Search for availability at nearby pharmacies
          </Text>
          <Text style={styles.infoText}>
            3. Reserve your medicines for pickup
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.searchAllButton}>
          <Text style={styles.searchAllButtonText}>Search All Medicines</Text>
        </TouchableOpacity>
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 24,
    paddingTop: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  medicineList: {
    gap: 16,
  },
  medicineCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  highConfidence: {
    backgroundColor: '#dcfce7',
  },
  lowConfidence: {
    backgroundColor: '#fef3c7',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  medicineDetail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  matchedContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#dcfce7',
    borderRadius: 8,
  },
  matchedLabel: {
    fontSize: 12,
    color: '#16a34a',
    marginBottom: 4,
  },
  matchedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
  },
  searchButton: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
  },
  infoSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#dbeafe',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
  footer: {
    padding: 24,
    paddingTop: 0,
  },
  searchAllButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
