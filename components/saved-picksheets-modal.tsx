import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { ArrowLeft, FileText, CheckCircle2, Trash2 } from 'lucide-react-native';
import { SavedPicksheet, usePicksheet } from '@/providers/picksheet-provider';
import { useTheme } from '@/providers/theme-provider';
import { SavedPicksheetDetailModal } from '@/components/saved-picksheet-detail-modal';

interface SavedPicksheetsModalProps {
  visible: boolean;
  onClose: () => void;
  picksheets: SavedPicksheet[];
  onSelectPicksheet: (picksheet: SavedPicksheet) => void;
}

export function SavedPicksheetsModal({
  visible,
  onClose,
  picksheets,
  onSelectPicksheet,
}: SavedPicksheetsModalProps) {
  const { currentTheme } = useTheme();
  const { deletePicksheet } = usePicksheet();
  const [selectedPicksheet, setSelectedPicksheet] = useState<SavedPicksheet | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
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

  const getProgress = (items: any[]) => {
    const total = items.length;
    const picked = items.filter(item => item.picked).length;
    const percentage = total > 0 ? Math.round((picked / total) * 100) : 0;
    return { total, picked, percentage };
  };

  const sortedPicksheets = [...picksheets].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  const handleDeletePicksheet = (picksheet: SavedPicksheet) => {
    Alert.alert(
      'Delete Picksheet',
      `Are you sure you want to delete "${picksheet.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deletePicksheet(picksheet.id);
          },
        },
      ],
      { cancelable: true }
    );
  };

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
          <Text style={[styles.title, { color: currentTheme.text }]}>Saved Picksheets</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {sortedPicksheets.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={currentTheme.border} />
              <Text style={[styles.emptyTitle, { color: currentTheme.text }]}>No Saved Picksheets</Text>
              <Text style={[styles.emptyDescription, { color: currentTheme.textSecondary }]}>
                Scan your first picksheet to get started
              </Text>
            </View>
          ) : (
            <View style={styles.picksheetsList}>
              {sortedPicksheets.map((picksheet) => {
                const progress = getProgress(picksheet.items);
                const isCompleted = progress.percentage === 100;
                
                return (
                  <View key={picksheet.id} style={styles.picksheetCardContainer}>
                    <TouchableOpacity
                      style={[styles.picksheetCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                      onPress={() => {
                        setSelectedPicksheet(picksheet);
                        setDetailModalVisible(true);
                      }}
                    >
                      <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                          <View style={styles.cardTitleRow}>
                            <FileText size={20} color={currentTheme.primary} />
                            <Text style={[styles.picksheetName, { color: currentTheme.text }]} numberOfLines={1}>
                              {picksheet.name}
                            </Text>
                            {isCompleted && (
                              <CheckCircle2 size={16} color="#10b981" />
                            )}
                          </View>
                          <Text style={[styles.dateText, { color: currentTheme.textSecondary }]}>
                            {formatDate(picksheet.updatedAt)}
                          </Text>
                        </View>

                        <View style={styles.progressSection}>
                          <View style={[styles.progressInfo, isCompleted && styles.progressInfoWithTrash]}>
                            <Text style={[styles.progressText, { color: currentTheme.textSecondary }]}>
                              {progress.picked} of {progress.total} picked
                            </Text>
                            <Text style={[
                              styles.percentageText,
                              { color: currentTheme.primary },
                              isCompleted && styles.completedText
                            ]}>
                              {progress.percentage}%
                            </Text>
                          </View>
                          <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBar, { backgroundColor: currentTheme.border + '40' }]}>
                              <View 
                                style={[
                                  styles.progressFill,
                                  { width: `${progress.percentage}%` as any, backgroundColor: currentTheme.primary },
                                  isCompleted && styles.completedFill
                                ]} 
                              />
                            </View>
                            {isCompleted && (
                              <View style={styles.trashIconSpace} />
                            )}
                          </View>
                        </View>
                      </View>
                      
                      {/* Colour circle in top right corner */}
                      <View style={styles.colourCircleContainer}>
                        <View 
                          style={[
                            styles.colourCircle, 
                            { 
                              backgroundColor: picksheet.colour || '#ffffff',
                              borderColor: currentTheme.border,
                              borderWidth: 2
                            }
                          ]} 
                        />
                      </View>
                      
                      {/* Delete button for completed picksheets - positioned after progress bar */}
                      {isCompleted && (
                        <View style={styles.deleteButtonContainer}>
                          <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              handleDeletePicksheet(picksheet);
                            }}
                          >
                            <Trash2 size={16} color={currentTheme.danger} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
      
      <SavedPicksheetDetailModal
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setSelectedPicksheet(null);
        }}
        picksheet={selectedPicksheet}
        onGoToPicksheet={() => {
          if (selectedPicksheet) {
            onSelectPicksheet(selectedPicksheet);
            setDetailModalVisible(false);
            setSelectedPicksheet(null);
            onClose();
          }
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
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  picksheetsList: {
    padding: 20,
    gap: 12,
  },
  picksheetCardContainer: {
    marginBottom: 12,
  },
  picksheetCard: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  deleteButtonContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  deleteButton: {
    padding: 6,
    borderWidth: 1,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trashIconSpace: {
    width: 24,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  picksheetName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  progressSection: {
    gap: 8,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInfoWithTrash: {
    paddingRight: 40,
  },
  progressText: {
    fontSize: 14,
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '600',
  },
  completedText: {
    color: '#10b981',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  completedFill: {
    backgroundColor: '#10b981',
  },
  colourCircleContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 1,
  },
  colourCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});