import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  FlatList,
} from 'react-native';
import { Package, ArrowLeft, CheckCircle2, Circle } from 'lucide-react-native';
import { PicksheetItemData } from '@/providers/picksheet-provider';
import { useTheme } from '@/providers/theme-provider';

interface ItemDetailModalProps {
  visible: boolean;
  item: PicksheetItemData | null;
  itemIndex: number;
  onClose: () => void;
  onTogglePicked: () => void;
  onToggleSpecial?: () => void;
  onUpdateItem?: (item: PicksheetItemData) => void;
}

export function ItemDetailModal({
  visible,
  item,
  itemIndex,
  onClose,
  onTogglePicked,
  onToggleSpecial,
  onUpdateItem,
}: ItemDetailModalProps) {
  const { currentTheme } = useTheme();
  const [editableItem, setEditableItem] = useState<PicksheetItemData | null>(null);
  const [numberSelectorVisible, setNumberSelectorVisible] = useState(false);
  const [selectedField, setSelectedField] = useState<'quantity' | 'parts' | 'units' | null>(null);
  const [tempValue, setTempValue] = useState(1);
  const [showMakeSpecialAlert, setShowMakeSpecialAlert] = useState(false);
  const [showPartsSelector, setShowPartsSelector] = useState(false);
  const [selectedParts, setSelectedParts] = useState<boolean[]>([]);

  React.useEffect(() => {
    if (item) {
      setEditableItem({ ...item });
      // Initialize parts selection array - use existing selection or create new
      const partsCount = (parseInt(item.parts) || 1) * (parseInt(item.quantity) || 1);
      if (item.selectedParts && item.selectedParts.length === partsCount) {
        setSelectedParts([...item.selectedParts]);
      } else {
        setSelectedParts(new Array(partsCount).fill(false));
      }
    }
  }, [item]);

  if (!item || !editableItem) return null;

  const totalParts = Math.floor((parseInt(editableItem.quantity) / parseInt(editableItem.units)) * parseInt(editableItem.parts));



  const openNumberSelector = (field: 'quantity' | 'parts' | 'units') => {
    if (!editableItem?.special) return;
    
    setSelectedField(field);
    setTempValue(parseInt(editableItem[field]) || 1);
    setNumberSelectorVisible(true);
  };

  const handleNumberSelectorSave = () => {
    if (!editableItem || !selectedField) return;
    
    let newValue = tempValue;
    
    // Ensure quantity is divisible by units
    if (selectedField === 'quantity' || selectedField === 'units') {
      const units = selectedField === 'units' ? newValue : parseInt(editableItem.units) || 1;
      const quantity = selectedField === 'quantity' ? newValue : parseInt(editableItem.quantity) || 1;
      
      if (selectedField === 'quantity' && quantity % units !== 0) {
        newValue = Math.round(quantity / units) * units;
        newValue = Math.max(units, Math.min(99, newValue));
      }
    }
    
    const updatedItem = { ...editableItem, [selectedField]: newValue.toString() };
    setEditableItem(updatedItem);
    
    if (onUpdateItem) {
      onUpdateItem(updatedItem);
    }
    
    setNumberSelectorVisible(false);
    setSelectedField(null);
  };

  const getQuantityOptions = () => {
    if (!editableItem) return [];
    const units = parseInt(editableItem.units) || 1;
    const options = [];
    for (let i = units; i <= 99; i += units) {
      options.push(i);
    }
    return options;
  };

  const NumberSelector = ({ field, label, max }: { field: 'quantity' | 'parts' | 'units', label: string, max: number }) => {
    const value = parseInt(editableItem?.[field] || '1');
    
    return (
      <View style={[styles.detailGridCard, { borderWidth: 1, borderColor: currentTheme.border }]}>
        <Text style={[styles.detailCardLabel, { color: currentTheme.textSecondary }]}>{label}</Text>
        {editableItem?.special ? (
          <TouchableOpacity 
            style={styles.numberSelectorButton}
            onPress={() => openNumberSelector(field)}
          >
            <Text style={[styles.detailCardValue, { color: '#000000' }]}>{value}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.detailCardValue, { color: '#000000' }]}>{value}</Text>
        )}
      </View>
    );
  };

  const handleFieldChange = (field: keyof PicksheetItemData, value: string) => {
    if (!editableItem) return;
    
    const updatedItem = { ...editableItem, [field]: value };
    setEditableItem(updatedItem);
    
    if (onUpdateItem) {
      onUpdateItem(updatedItem);
    }
  };

  const handleFieldBlur = (field: keyof PicksheetItemData, originalValue: string) => {
    if (!editableItem) return;
    
    // If field is empty, restore original value
    if (!editableItem[field] || (editableItem[field] as string).trim() === '') {
      const restoredItem = { ...editableItem, [field]: originalValue };
      setEditableItem(restoredItem);
      if (onUpdateItem) {
        onUpdateItem(restoredItem);
      }
    }
  };

  const handleMakeSpecial = () => {
    setShowMakeSpecialAlert(true);
  };

  const confirmMakeSpecial = () => {
    setShowMakeSpecialAlert(false);
    if (onToggleSpecial) {
      onToggleSpecial();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: currentTheme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.border }]}>
          <View style={styles.topSection}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.primary, borderWidth: 1 }]} onPress={onClose}>
              <ArrowLeft size={24} color={currentTheme.primary} />
            </TouchableOpacity>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: currentTheme.text }]}>Item Details</Text>
            </View>
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.appHeader}>
            <Package size={24} color={currentTheme.primary} />
            <Text style={[styles.appTitle, { color: currentTheme.text }]}>PickPerfect V1.2</Text>
            <Text style={[styles.appSubtitle, { color: currentTheme.textSecondary }]}>Warehouse Picksheet Scanner</Text>
            <Text style={[styles.appCopyright, { color: currentTheme.textSecondary }]}>(c)Alanicus 2025</Text>
          </View>
          
          <View style={styles.itemInfoSection}>
            <View style={styles.itemNumberContainer}>
              <View style={[styles.itemNumberCircle, { backgroundColor: currentTheme.primary }]}>
                <Text style={styles.itemNumberText}>{itemIndex + 1}</Text>
              </View>
            </View>
            {item?.special && (
              <Text style={styles.specialItemText}>Special Item</Text>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.detailCard, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <View style={[styles.locationHighlight, { backgroundColor: currentTheme.primary + '20', borderColor: currentTheme.primary }]}>
              <Text style={[styles.locationLabel, { color: currentTheme.primary }]}>LOCATION</Text>
              {editableItem.special ? (
                <TextInput
                  style={[styles.editableLocationValue, { color: currentTheme.primary, borderColor: currentTheme.primary }]}
                  value={editableItem.location}
                  onChangeText={(value) => handleFieldChange('location', value)}
                  onBlur={() => handleFieldBlur('location', item.location)}
                  placeholder="Location"
                  placeholderTextColor={currentTheme.textSecondary}
                />
              ) : (
                <Text style={[styles.locationValue, { color: currentTheme.primary }]}>{editableItem.location}</Text>
              )}
            </View>
            
            <View style={styles.detailSection}>
              <Text style={[styles.descriptionText, { color: currentTheme.text }]}>{editableItem.description}</Text>
              
              <View style={styles.codeContainer}>
                <Text style={[styles.codeText, { color: currentTheme.primary }]}>{editableItem.code}</Text>
              </View>
              
              <View style={styles.detailGrid}>
                <NumberSelector field="quantity" label="Quantity" max={99} />
                <NumberSelector field="parts" label="Parts per Item" max={5} />
                <NumberSelector field="units" label="Units per Box" max={20} />
              </View>
              
              <View style={styles.detailGrid}>
                <View style={[styles.detailGridCard, { borderWidth: 1, borderColor: currentTheme.border }]}>
                  <Text style={[styles.detailCardLabel, { color: currentTheme.textSecondary }]}>Order #</Text>
                  {editableItem.special ? (
                    <TextInput
                      style={[styles.editableFieldValue, { color: '#000000', borderColor: currentTheme.border }]}
                      value={editableItem.orderNumber}
                      onChangeText={(value) => handleFieldChange('orderNumber', value.slice(0, 5))}
                      onBlur={() => handleFieldBlur('orderNumber', item.orderNumber)}
                      placeholder="Order #"
                      placeholderTextColor={currentTheme.textSecondary}
                      maxLength={5}
                    />
                  ) : (
                    <Text style={[styles.detailCardValue, { color: '#000000' }]}>{editableItem.orderNumber}</Text>
                  )}
                </View>
                <View style={[styles.detailGridCard, { borderWidth: 1, borderColor: currentTheme.border }]}>
                  <Text style={[styles.detailCardLabel, { color: currentTheme.textSecondary }]}>Customer</Text>
                  {editableItem.special ? (
                    <TextInput
                      style={[styles.editableFieldValue, { color: '#000000', borderColor: currentTheme.border }]}
                      value={editableItem.surname}
                      onChangeText={(value) => handleFieldChange('surname', value.slice(0, 20))}
                      onBlur={() => handleFieldBlur('surname', item.surname)}
                      placeholder="Customer"
                      placeholderTextColor={currentTheme.textSecondary}
                      maxLength={20}
                    />
                  ) : (
                    <Text style={[styles.detailCardValue, { color: '#000000' }]}>{editableItem.surname}</Text>
                  )}
                </View>
              </View>
            </View>
            
            {/* Notes section - show for all items if notes exist, editable for special items */}
            {(editableItem.notes.trim() !== '' || editableItem.special) && (
              <View style={[styles.notesSection, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
                <Text style={[styles.notesLabel, { color: currentTheme.textSecondary }]}>Notes</Text>
                {editableItem.special ? (
                  <TextInput
                    style={[styles.notesInput, { color: currentTheme.text, borderColor: currentTheme.border }]}
                    value={editableItem.notes}
                    onChangeText={(value) => {
                      const lines = value.split('\n');
                      if (lines.length <= 3) {
                        handleFieldChange('notes', value);
                      }
                    }}
                    placeholder="Add notes..."
                    placeholderTextColor={currentTheme.textSecondary}
                    multiline
                    numberOfLines={3}
                    maxLength={150}
                  />
                ) : (
                  <Text style={[styles.notesText, { color: currentTheme.text }]}>
                    {editableItem.notes}
                  </Text>
                )}
              </View>
            )}
            
            <View style={[styles.totalPartsSection, { backgroundColor: currentTheme.primary + '10', borderColor: currentTheme.primary }]}>
              <Text style={[styles.totalPartsLabel, { color: currentTheme.textSecondary }]}>Total Number of Parts</Text>
              <Text style={[styles.totalPartsValue, { color: currentTheme.primary }]}>{totalParts}</Text>
            </View>
          </View>
          
          {/* Add bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: currentTheme.background, borderTopColor: currentTheme.border }]}>
          <View style={styles.buttonRow}>
            {!editableItem.special && onToggleSpecial && (
              <TouchableOpacity 
                style={[
                  styles.specialButton, 
                  { 
                    backgroundColor: '#eab308',
                    borderColor: '#eab308'
                  }
                ]} 
                onPress={handleMakeSpecial}
              >
                <Text style={styles.specialButtonText}>Make Special</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.pickButton, 
                { 
                  backgroundColor: editableItem.picked ? currentTheme.surface : currentTheme.primary,
                  borderColor: editableItem.picked ? currentTheme.border : currentTheme.primary,
                  flex: editableItem.special ? 1 : 1
                }
              ]} 
              onPress={() => {
                const partsCount = (parseInt(editableItem.parts) || 1) * (parseInt(editableItem.quantity) || 1);
                if (partsCount > 1 && !editableItem.picked) {
                  setShowPartsSelector(true);
                } else {
                  onTogglePicked();
                }
              }}
            >
              {editableItem.picked ? (
                <CheckCircle2 size={20} color={currentTheme.primary} />
              ) : (
                <Circle size={20} color="white" />
              )}
              <Text style={[
                styles.pickButtonText, 
                { color: editableItem.picked ? currentTheme.primary : 'white' }
              ]}>
                {editableItem.picked ? 'Unpick Item' : ((parseInt(editableItem.parts) || 1) * (parseInt(editableItem.quantity) || 1) > 1 ? 'Pick Items' : 'Pick Item')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Number Selector Modal */}
      <Modal
        visible={numberSelectorVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setNumberSelectorVisible(false)}
      >
        <View style={styles.numberModalOverlay}>
          <View style={[styles.numberModal, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.numberModalTitle, { color: currentTheme.text }]}>Select {selectedField}</Text>
            
            <View style={styles.numberModalContent}>
              <FlatList
                data={selectedField === 'quantity' ? getQuantityOptions() : Array.from({ length: selectedField === 'parts' ? 5 : 20 }, (_, i) => i + 1)}
                keyExtractor={(item) => item.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.numberListItem,
                      { borderColor: currentTheme.border },
                      tempValue === item && { backgroundColor: currentTheme.primary + '20' }
                    ]}
                    onPress={() => setTempValue(item)}
                  >
                    <Text style={[
                      styles.numberListText,
                      { color: tempValue === item ? currentTheme.primary : currentTheme.text }
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
                style={styles.numberList}
                showsVerticalScrollIndicator={true}
                getItemLayout={(data, index) => ({
                  length: 44,
                  offset: 44 * index,
                  index,
                })}
                initialScrollIndex={Math.max(0, (selectedField === 'quantity' ? getQuantityOptions().indexOf(tempValue) : tempValue - 1))}
              />
            </View>
            
            <View style={styles.numberModalButtons}>
              <TouchableOpacity 
                style={[styles.numberModalCancelButton, { borderColor: currentTheme.border }]}
                onPress={() => setNumberSelectorVisible(false)}
              >
                <Text style={[styles.numberModalCancelText, { color: currentTheme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.numberModalSaveButton, { backgroundColor: currentTheme.primary }]}
                onPress={handleNumberSelectorSave}
              >
                <Text style={styles.numberModalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Parts Selection Modal */}
      <Modal
        visible={showPartsSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPartsSelector(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertModal, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.alertTitle, { color: currentTheme.text }]}>Select Parts to Pick</Text>
            <Text style={[styles.itemDescriptionText, { color: currentTheme.text }]}>
              {editableItem?.description}
            </Text>
            <Text style={[styles.alertMessage, { color: currentTheme.textSecondary }]}>
              This item has {parseInt(editableItem?.parts || '1') * parseInt(editableItem?.quantity || '1')} parts. Select which parts you are picking:
            </Text>
            
            <ScrollView style={styles.partsScrollView} showsVerticalScrollIndicator={true}>
              {Array.from({ length: parseInt(editableItem?.parts || '1') * parseInt(editableItem?.quantity || '1') }, (_, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.partToggle,
                    { 
                      backgroundColor: selectedParts[index] ? currentTheme.primary + '20' : currentTheme.surface,
                      borderColor: selectedParts[index] ? currentTheme.primary : currentTheme.border
                    }
                  ]}
                  onPress={() => {
                    const newSelectedParts = [...selectedParts];
                    newSelectedParts[index] = !newSelectedParts[index];
                    setSelectedParts(newSelectedParts);
                  }}
                >
                  <Text style={[
                    styles.partToggleText,
                    { color: selectedParts[index] ? currentTheme.primary : currentTheme.text }
                  ]}>
                    Part {index + 1}
                  </Text>
                  {selectedParts[index] && (
                    <CheckCircle2 size={16} color={currentTheme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <View style={styles.alertButtons}>
              <TouchableOpacity 
                style={[styles.alertCancelButton, { borderColor: currentTheme.border }]}
                onPress={() => {
                  setShowPartsSelector(false);
                  // Reset to the saved selection or empty if none exists
                  const partsCount = (parseInt(editableItem?.parts || '1')) * (parseInt(editableItem?.quantity || '1'));
                  if (editableItem?.selectedParts && editableItem.selectedParts.length === partsCount) {
                    setSelectedParts([...editableItem.selectedParts]);
                  } else {
                    setSelectedParts(new Array(partsCount).fill(false));
                  }
                }}
              >
                <Text style={[styles.alertCancelText, { color: currentTheme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.alertConfirmButton, 
                  { 
                    backgroundColor: selectedParts.every(p => p) ? currentTheme.primary : currentTheme.border
                  }
                ]}
                onPress={() => {
                  const allPartsSelected = selectedParts.every(p => p);
                  
                  // Save the current selection to the item
                  if (editableItem && onUpdateItem) {
                    const updatedItem = { ...editableItem, selectedParts: [...selectedParts] };
                    onUpdateItem(updatedItem);
                  }
                  
                  if (allPartsSelected) {
                    onTogglePicked();
                  }
                  setShowPartsSelector(false);
                }}
                disabled={!selectedParts.some(p => p)}
              >
                <Text style={styles.alertConfirmText}>
                  {selectedParts.every(p => p) ? 'Pick All Parts' : 'Pick Items'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Make Special Confirmation Modal */}
      <Modal
        visible={showMakeSpecialAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMakeSpecialAlert(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={[styles.alertModal, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
            <Text style={[styles.alertTitle, { color: currentTheme.text }]}>Make Special Item</Text>
            <Text style={[styles.alertMessage, { color: currentTheme.textSecondary }]}>
              This item will be made special and will only apply to this picksheet.
            </Text>
            
            <View style={styles.alertButtons}>
              <TouchableOpacity 
                style={[styles.alertCancelButton, { borderColor: currentTheme.border }]}
                onPress={() => setShowMakeSpecialAlert(false)}
              >
                <Text style={[styles.alertCancelText, { color: currentTheme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.alertConfirmButton, { backgroundColor: currentTheme.primary }]}
                onPress={confirmMakeSpecial}
              >
                <Text style={styles.alertConfirmText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 4,
  },
  appHeader: {
    alignItems: 'center',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  appTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    marginTop: 4,
  },
  appSubtitle: {
    fontSize: 10,
    marginTop: 2,
  },
  appCopyright: {
    fontSize: 8,
    marginTop: 1,
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  itemInfoSection: {
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  titleSection: {
    alignItems: 'center',
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  itemNumberContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  itemNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemNumberText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: 'white',
  },
  specialItemText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#eab308',
    color: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  detailCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
  },
  locationHighlight: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    letterSpacing: 1,
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  detailSection: {
    gap: 12,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginBottom: 6,
  },
  codeContainer: {
    alignSelf: 'center',
  },
  codeText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  detailGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 8,
    flexWrap: 'wrap',
  },
  detailGridCard: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  detailCardLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  detailCardValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#000000',
  },
  notesSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  totalPartsSection: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  totalPartsLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  totalPartsValue: {
    fontSize: 28,
    fontWeight: 'bold' as const,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 2,
    gap: 8,
  },
  pickButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  specialButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 120,
  },
  specialButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: 'white',
  },
  bottomSpacing: {
    height: 40,
  },

  editableLocationValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textAlign: 'center',
    minWidth: 100,
  },
  editableFieldValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    textAlign: 'center',
    minWidth: 60,
  },
  notesInput: {
    fontSize: 14,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    textAlignVertical: 'top',
    minHeight: 60,
  },
  numberSelectorButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
  },
  numberModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  numberModal: {
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
  },
  numberModalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  numberModalContent: {
    height: 200,
    marginBottom: 24,
  },
  numberList: {
    flex: 1,
  },
  numberListItem: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    backgroundColor: '#f8fafc',
  },
  numberListText: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  numberModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  numberModalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  numberModalCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  numberModalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  numberModalSaveText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  
  // Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertModal: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 12,
  },
  alertMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  alertCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  alertCancelText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  alertConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertConfirmText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: 'white',
  },
  
  // Parts Selection Styles
  partsContainer: {
    marginVertical: 16,
    gap: 8,
  },
  partsScrollView: {
    maxHeight: 180,
    marginVertical: 16,
  },
  scrollHintText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic' as const,
    marginTop: 8,
  },
  partToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  partToggleText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  itemDescriptionText: {
    fontSize: 16,
    fontWeight: '600' as const,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});