import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { PicksheetItemData } from '@/providers/picksheet-provider';
import { useTheme } from '@/providers/theme-provider';

interface EditItemModalProps {
  visible: boolean;
  item: PicksheetItemData | null;
  itemIndex: number;
  onClose: () => void;
  onSave: (index: number, updatedItem: Partial<PicksheetItemData>) => void;
  onDelete: (index: number) => void;
}

export function EditItemModal({
  visible,
  item,
  itemIndex,
  onClose,
  onSave,
  onDelete,
}: EditItemModalProps) {
  const { currentTheme } = useTheme();
  const [location, setLocation] = useState('');
  const [number, setNumber] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [quantity, setQuantity] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [surname, setSurname] = useState('');
  const [special, setSpecial] = useState(false);
  const [parts, setParts] = useState('');
  const [units, setUnits] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setLocation(item.location);
      setNumber(item.number);
      setDescription(item.description);
      setCode(item.code);
      setQuantity(item.quantity);
      setOrderNumber(item.orderNumber);
      setSurname(item.surname);
      setSpecial(item.special);
      setParts(item.parts || '1');
      setUnits(item.units || '1');
      setNotes(item.notes || '');
    }
  }, [item]);

  const handleSave = () => {
    if (!description.trim() || !location.trim() || !quantity.trim()) {
      Alert.alert('Error', 'Please fill in required fields (Description, Location, Quantity)');
      return;
    }

    onSave(itemIndex, {
      location: location.trim(),
      number: number.trim(),
      description: description.trim(),
      code: code.trim(),
      quantity: Math.floor(parseFloat(quantity.trim()) || 1).toString(),
      orderNumber: orderNumber.trim(),
      surname: surname.trim(),
      special,
      parts: Math.floor(parseFloat(parts.trim()) || 1).toString(),
      units: Math.floor(parseFloat(units.trim()) || 1).toString(),
      notes: notes.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item from the pick list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(itemIndex);
            onClose();
          },
        },
      ]
    );
  };

  if (!item) return null;

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
        <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <ArrowLeft size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.text }]}>Edit Item</Text>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={24} color={currentTheme.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Location (Bin) *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={location}
                onChangeText={setLocation}
                placeholder="Enter bin location (e.g., 01A01)"
                placeholderTextColor={currentTheme.textSecondary}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Item Number (10 digits)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={number}
                onChangeText={setNumber}
                placeholder="Enter 10-digit item number"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
                maxLength={10}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Description *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter item description"
                placeholderTextColor={currentTheme.textSecondary}
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Supplier Code</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={code}
                onChangeText={setCode}
                placeholder="Enter supplier reference code"
                placeholderTextColor={currentTheme.textSecondary}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Quantity *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="Enter quantity (whole numbers only)"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Parts</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={parts}
                onChangeText={setParts}
                placeholder="Enter parts per item (default: 1)"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Units</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={units}
                onChangeText={setUnits}
                placeholder="Enter units (default: 1)"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Order Number (5 digits)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={orderNumber}
                onChangeText={setOrderNumber}
                placeholder="Enter 5-digit order number"
                placeholderTextColor={currentTheme.textSecondary}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Surname</Text>
              <TextInput
                style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={surname}
                onChangeText={setSurname}
                placeholder="Enter customer surname"
                placeholderTextColor={currentTheme.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Notes</Text>
              <TextInput
                style={[styles.input, styles.notesInput, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Enter any additional notes for this item"
                placeholderTextColor={currentTheme.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={[styles.label, { color: currentTheme.text }]}>Special Item</Text>
              <TouchableOpacity
                style={[
                  styles.checkboxContainer, 
                  { backgroundColor: currentTheme.surface, borderColor: currentTheme.border },
                  special && { borderColor: currentTheme.primary, backgroundColor: currentTheme.primary + '20' }
                ]}
                onPress={() => setSpecial(!special)}
              >
                <View style={[
                  styles.checkbox, 
                  { borderColor: currentTheme.border },
                  special && { backgroundColor: currentTheme.primary, borderColor: currentTheme.primary }
                ]}>
                  {special && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.checkboxLabel, { color: currentTheme.text }]}>Mark as special item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border }]}>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: currentTheme.primary }]} onPress={handleSave}>
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 60,
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
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
    gap: 24,
  },
  fieldContainer: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveButton: {
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
  notesInput: {
    minHeight: 80,
    paddingTop: 12,
  },
});