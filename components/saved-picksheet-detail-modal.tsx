import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, FileText, Play, Calendar, MapPin, Package } from 'lucide-react-native';
import { SavedPicksheet, usePicksheet } from '@/providers/picksheet-provider';
import { useTheme } from '@/providers/theme-provider';
import { ColourPickerModal } from '@/components/colour-picker-modal';

interface SavedPicksheetDetailModalProps {
  visible: boolean;
  onClose: () => void;
  picksheet: SavedPicksheet | null;
  onGoToPicksheet: () => void;
}

export function SavedPicksheetDetailModal({
  visible,
  onClose,
  picksheet,
  onGoToPicksheet,
}: SavedPicksheetDetailModalProps) {
  const { currentTheme } = useTheme();
  const { updatePicksheetColour, savedPicksheets } = usePicksheet();
  const [colourPickerVisible, setColourPickerVisible] = useState(false);

  if (!picksheet) return null;

  // Get the most up-to-date picksheet from the provider
  const currentPicksheet = savedPicksheets.find(p => p.id === picksheet.id) || picksheet;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProgress = () => {
    const total = currentPicksheet.items.length;
    const picked = currentPicksheet.items.filter(item => item.picked).length;
    const percentage = total > 0 ? Math.round((picked / total) * 100) : 0;
    return { total, picked, percentage };
  };

  const progress = getProgress();
  const isCompleted = progress.percentage === 100;

  const getTotalParts = () => {
    return currentPicksheet.items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 1;
      const units = parseInt(item.units) || 1;
      const parts = parseInt(item.parts) || 1;
      const itemTotalParts = Math.floor((quantity / units) * parts);
      return total + itemTotalParts;
    }, 0);
  };

  const totalParts = getTotalParts();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ArrowLeft size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.text }]}>Picksheet Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.summaryCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                <FileText size={24} color={currentTheme.primary} />
                <Text style={[styles.picksheetName, { color: currentTheme.text }]}>{currentPicksheet.name}</Text>
                {isCompleted && (
                  <View style={[styles.completedBadge, { backgroundColor: '#10b981' }]}>
                    <Text style={styles.completedBadgeText}>Complete</Text>
                  </View>
                )}
                <TouchableOpacity 
                  style={[
                    styles.headerColourCircle, 
                    { 
                      backgroundColor: currentPicksheet.colour || '#ffffff',
                      borderColor: currentTheme.border,
                      borderWidth: 2
                    }
                  ]} 
                  onPress={() => setColourPickerVisible(true)}
                />
              </View>
              <Text style={[styles.dateText, { color: currentTheme.textSecondary }]}>
                Last updated: {formatDate(currentPicksheet.updatedAt)}
              </Text>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={[styles.progressLabel, { color: currentTheme.textSecondary }]}>Progress</Text>
                <Text style={[styles.progressValue, { color: currentTheme.primary }]}>
                  {progress.picked} of {progress.total} items ({progress.percentage}%)
                </Text>
              </View>
              <View style={[styles.progressBar, { backgroundColor: currentTheme.border + '40' }]}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${progress.percentage}%` as any, 
                      backgroundColor: isCompleted ? '#10b981' : currentTheme.primary 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>

          {/* Header Information */}
          {(currentPicksheet.header.pickNumber || currentPicksheet.header.schedule || currentPicksheet.header.route) && (
            <View style={[styles.headerInfoCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Picksheet Information</Text>
              
              {currentPicksheet.header.pickNumber && (
                <View style={styles.infoRow}>
                  <Package size={16} color={currentTheme.textSecondary} />
                  <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Pick Number:</Text>
                  <Text style={[styles.infoValue, { color: currentTheme.text }]}>{currentPicksheet.header.pickNumber}</Text>
                </View>
              )}
              
              {currentPicksheet.header.schedule && (
                <View style={styles.infoRow}>
                  <Calendar size={16} color={currentTheme.textSecondary} />
                  <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Schedule:</Text>
                  <Text style={[styles.infoValue, { color: currentTheme.text }]}>{currentPicksheet.header.schedule}</Text>
                </View>
              )}
              
              {currentPicksheet.header.route && (
                <View style={styles.infoRow}>
                  <MapPin size={16} color={currentTheme.textSecondary} />
                  <Text style={[styles.infoLabel, { color: currentTheme.textSecondary }]}>Route:</Text>
                  <Text style={[styles.infoValue, { color: currentTheme.text }]}>{currentPicksheet.header.route}</Text>
                </View>
              )}
            </View>
          )}

          {/* Items Summary */}
          <View style={[styles.itemsSummaryCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Items Summary</Text>
            
            <View style={styles.summaryStats}>
              <View style={[styles.statBox, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                <Text style={[styles.statValue, { color: currentTheme.primary }]}>{currentPicksheet.items.length}</Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Total Items</Text>
              </View>
              
              <View style={[styles.statBox, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                <Text style={[styles.statValue, { color: '#10b981' }]}>{progress.picked}</Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Picked</Text>
              </View>
              
              <View style={[styles.statBox, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
                <Text style={[styles.statValue, { color: '#ef4444' }]}>{progress.total - progress.picked}</Text>
                <Text style={[styles.statLabel, { color: currentTheme.textSecondary }]}>Remaining</Text>
              </View>
            </View>
            
            {/* Total Parts Box */}
            <View style={[styles.totalPartsBox, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
              <Text style={[styles.totalPartsValue, { color: currentTheme.primary }]}>{totalParts}</Text>
              <Text style={[styles.totalPartsLabel, { color: currentTheme.textSecondary }]}>Total Parts</Text>
            </View>
            
            {currentPicksheet.items.filter(item => item.special).length > 0 && (
              <View style={[styles.specialItemsNote, { backgroundColor: '#eab308' + '20', borderColor: '#eab308' }]}>
                <Text style={[styles.specialItemsText, { color: '#eab308' }]}>
                  {currentPicksheet.items.filter(item => item.special).length} special item(s) in this picksheet
                </Text>
              </View>
            )}
          </View>
          

        </ScrollView>

        <View style={[styles.footer, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border }]}>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]} 
            onPress={onClose}
          >
            <Text style={[styles.cancelButtonText, { color: currentTheme.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.goButton, { backgroundColor: currentTheme.primary }]} 
            onPress={onGoToPicksheet}
          >
            <Play size={20} color="white" />
            <Text style={styles.goButtonText}>Go to Picksheet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      
      <ColourPickerModal
        visible={colourPickerVisible}
        onClose={() => setColourPickerVisible(false)}
        currentColour={currentPicksheet.colour || '#ffffff'}
        onSelectColour={(colour) => {
          updatePicksheetColour(currentPicksheet.id, colour);
          setColourPickerVisible(false);
        }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerColourCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  picksheetName: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600' as const,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  dateText: {
    fontSize: 14,
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  headerInfoCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  itemsSummaryCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  specialItemsNote: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  specialItemsText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  totalPartsBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 12,
  },
  totalPartsValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  totalPartsLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  goButton: {
    flex: 2,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  goButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});