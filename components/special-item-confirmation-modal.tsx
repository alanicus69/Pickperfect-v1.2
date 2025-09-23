import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AlertTriangle, Check, X } from 'lucide-react-native';
import { PicksheetItemData } from '@/providers/picksheet-provider';
import { useTheme } from '@/providers/theme-provider';

interface SpecialItemConfirmationModalProps {
  visible: boolean;
  pendingItems: PicksheetItemData[];
  onConfirm: (itemIndex: number, isSpecial: boolean) => void;
  onClose: () => void;
}

export function SpecialItemConfirmationModal({
  visible,
  pendingItems,
  onConfirm,
  onClose,
}: SpecialItemConfirmationModalProps) {
  const { currentTheme } = useTheme();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [processedItems, setProcessedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible && pendingItems.length > 0) {
      setCurrentItemIndex(0);
      setProcessedItems(new Set());
    }
  }, [visible, pendingItems]);

  const currentItem = pendingItems[currentItemIndex];
  const hasMoreItems = currentItemIndex < pendingItems.length - 1;

  const handleConfirm = (isSpecial: boolean) => {
    if (!currentItem) return;
    
    // Input validation
    if (typeof isSpecial !== 'boolean') return;
    
    // Find the actual index of this item in the main items array
    // For now, we'll use the currentItemIndex as a placeholder
    onConfirm(currentItemIndex, isSpecial);
    
    const newProcessedItems = new Set(processedItems);
    newProcessedItems.add(currentItemIndex);
    setProcessedItems(newProcessedItems);

    if (hasMoreItems) {
      setCurrentItemIndex(currentItemIndex + 1);
    } else {
      // All items processed, close modal
      onClose();
    }
  };

  const handleSkipAll = () => {
    // Mark all remaining items as not special
    for (let i = currentItemIndex; i < pendingItems.length; i++) {
      onConfirm(i, false);
    }
    onClose();
  };

  if (!visible || !currentItem || pendingItems.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
            <View style={styles.headerIcon}>
              <AlertTriangle size={24} color={currentTheme.primary} />
            </View>
            <Text style={[styles.title, { color: currentTheme.text }]}>Special Item Detected</Text>
            <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
              Item {currentItemIndex + 1} of {pendingItems.length}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={[styles.itemCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <View style={styles.itemHeader}>
                <Text style={[styles.itemLocation, { color: currentTheme.primary }]}>
                  {currentItem.location}
                </Text>
                <Text style={[styles.itemNumber, { color: currentTheme.textSecondary }]}>
                  #{currentItem.number}
                </Text>
              </View>
              
              <Text style={[styles.itemDescription, { color: currentTheme.text }]}>
                {currentItem.description}
              </Text>
              
              <View style={styles.itemDetails}>
                <Text style={[styles.itemDetail, { color: currentTheme.textSecondary }]}>
                  Code: {currentItem.code}
                </Text>
                <Text style={[styles.itemDetail, { color: currentTheme.textSecondary }]}>
                  Qty: {currentItem.quantity}
                </Text>
                <Text style={[styles.itemDetail, { color: currentTheme.textSecondary }]}>
                  Order: {currentItem.orderNumber}
                </Text>
              </View>
            </View>

            <View style={styles.messageContainer}>
              <Text style={[styles.message, { color: currentTheme.text }]}>
                This item appears to contain special markings (asterisk *) in its description.
              </Text>
              <Text style={[styles.question, { color: currentTheme.text }]}>
                Would you like to mark this item as Special?
              </Text>
            </View>
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: currentTheme.border }]}>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.noButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                onPress={() => handleConfirm(false)}
              >
                <X size={20} color={currentTheme.textSecondary} />
                <Text style={[styles.buttonText, { color: currentTheme.textSecondary }]}>No</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.yesButton, { backgroundColor: currentTheme.primary }]}
                onPress={() => handleConfirm(true)}
              >
                <Check size={20} color="white" />
                <Text style={[styles.buttonText, { color: 'white' }]}>Yes, Special</Text>
              </TouchableOpacity>
            </View>
            
            {pendingItems.length > 1 && (
              <TouchableOpacity
                style={[styles.skipAllButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                onPress={handleSkipAll}
              >
                <Text style={[styles.skipAllText, { color: currentTheme.textSecondary }]}>Skip All Remaining</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  headerIcon: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    maxHeight: 300,
  },
  itemCard: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemLocation: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  itemNumber: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  itemDescription: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 12,
    lineHeight: 22,
  },
  itemDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemDetail: {
    fontSize: 12,
  },
  messageContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  question: {
    fontSize: 18,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  noButton: {
    borderWidth: 1,
  },
  yesButton: {
    // Background color set via style prop
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  skipAllButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipAllText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});