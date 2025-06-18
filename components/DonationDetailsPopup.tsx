import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { X, Package, Shirt, Dot, Baby } from 'lucide-react-native';

interface DonationItem {
  _id: string;
  type?: string;
  size?: string;
  color?: string;
  gender?: string;
  quantity: number;
  images: string[];
  name?: string;
  description?: string;
  ageGroup?: string;
  condition?: string;
}

interface DonationDetailsPopupProps {
  visible: boolean;
  onClose: () => void;
  donation: {
    _id: string;
    donationType: 'clothes' | 'toys';
    status: string;
    pickupAddress: string;
    pickupDate: string;
    pickupNotes: string;
    size: number;
    clothingItems?: DonationItem[];
    toyItems?: DonationItem[];
    userId: {
      _id: string;
      firstname: string;
      lastname: string;
    };
  } | null;
}

const { width, height } = Dimensions.get('window');

export default function DonationDetailsPopup({ visible, onClose, donation }: DonationDetailsPopupProps) {
  if (!donation) return null;

  const renderClothingItem = (item: DonationItem, index: number) => (
    <View key={item._id || index} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Dot size={20} color="#4A90E2" />
        <Text style={styles.itemTitle}>{item.type}</Text>
        <Text style={styles.quantityBadge}>x{item.quantity}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetail}>Size: {item.size}</Text>
        <Text style={styles.itemDetail}>Color: {item.color}</Text>
        <Text style={styles.itemDetail}>Gender: {item.gender}</Text>
      </View>
      {item.images && item.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
          {item.images.map((image, imgIndex) => (
            <Image key={imgIndex} source={{ uri: image }} style={styles.itemImage} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderToyItem = (item: DonationItem, index: number) => (
    <View key={item._id || index} style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <Dot size={20} color="#4A90E2" />
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.quantityBadge}>x{item.quantity}</Text>
      </View>
      <View style={styles.itemDetails}>
        <Text style={styles.itemDetail}>Description: {item.description}</Text>
        <Text style={styles.itemDetail}>Age Group: {item.ageGroup}</Text>
        <Text style={styles.itemDetail}>Condition: {item.condition}</Text>
      </View>
      {item.images && item.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
          {item.images.map((image, imgIndex) => (
            <Image key={imgIndex} source={{ uri: image }} style={styles.itemImage} />
          ))}
        </ScrollView>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.popupContainer}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Package size={24} color="#4A90E2" />
              <Text style={styles.title}>
                {donation.donationType.charAt(0).toUpperCase() + donation.donationType.slice(1)} Donation
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* Donor Information */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Donor Information</Text>
              <Text style={styles.detailText}>
                {donation.userId?.firstname || 'Unknown'} {donation.userId?.lastname || 'Donor'}
              </Text>
            </View>

            {/* Pickup Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pickup Details</Text>
              <Text style={styles.detailText}>Address: {donation.pickupAddress || 'Not specified'}</Text>
              <Text style={styles.detailText}>
                Date: {donation.pickupDate ? new Date(donation.pickupDate).toLocaleDateString() : 'Not specified'}
              </Text>
              <Text style={styles.detailText}>Total Items: {donation.size || 0}</Text>
              {donation.pickupNotes && (
                <Text style={styles.detailText}>Notes: {donation.pickupNotes}</Text>
              )}
            </View>

            {/* Donation Items */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Donation Items</Text>
              
              {/* Always show clothing items section */}
              <View>
                <Text style={styles.itemTypeTitle}>
                  Clothing Items ({donation.clothingItems?.length || 0})
                </Text>
                {donation.clothingItems && donation.clothingItems.length > 0 ? (
                  donation.clothingItems.map((item, index) => renderClothingItem(item, index))
                ) : (
                  <Text style={styles.noItemsText}>No clothing items</Text>
                )}
              </View>

              {/* Always show toy items section */}
              <View style={{ marginTop: 16 }}>
                <Text style={styles.itemTypeTitle}>
                  Toy Items ({donation.toyItems?.length || 0})
                </Text>
                {donation.toyItems && donation.toyItems.length > 0 ? (
                  donation.toyItems.map((item, index) => renderToyItem(item, index))
                ) : (
                  <Text style={styles.noItemsText}>No toy items</Text>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContainer: {
    width: width * 0.9,
    height: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    height: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemTypeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  quantityBadge: {
    backgroundColor: '#4A90E2',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  itemDetails: {
    marginBottom: 8,
  },
  itemDetail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  imageContainer: {
    flexDirection: 'row',
    marginTop: 8,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 8,
  },
  noItemsText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
}); 