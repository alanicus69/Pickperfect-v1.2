import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Save, X, AlertCircle } from 'lucide-react-native';
import { PicksheetHeaderData, usePicksheet } from '@/providers/picksheet-provider';
import { useTheme } from '@/providers/theme-provider';

interface PicksheetSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: (name: string) => void;
  onAbort: () => void;
  header: PicksheetHeaderData;
  itemCount: number;
}

export function PicksheetSummaryModal({
  visible,
  onClose,
  onContinue,
  onAbort,
  header,
  itemCount,
}: PicksheetSummaryModalProps) {
  const { currentTheme } = useTheme();
  const { getTotalParts } = usePicksheet();
  const [name, setName] = useState('');
  
  const totalParts = getTotalParts();

  const handleContinue = () => {
    if (!name.trim()) {
      return;
    }
    onContinue(name.trim());
    setName('');
  };

  const handleAbort = () => {
    onAbort();
    setName('');
    onClose();
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: currentTheme.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.header, { backgroundColor: currentTheme.surface, borderBottomColor: currentTheme.border }]}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.text }]}>Picksheet Summary</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.nameSection}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>Save Sheet as:</Text>
            <TextInput
              style={[styles.nameInput, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
              value={name}
              onChangeText={(text) => setName(text.slice(0, 23))}
              maxLength={23}
              placeholder="Enter picksheet name"
              placeholderTextColor={currentTheme.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
          </View>

          <View style={styles.summarySection}>
            <View style={[styles.summaryBox, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <View style={[styles.summaryRow, { borderBottomColor: currentTheme.border + '40' }]}>
                <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>Pick Number:</Text>
                <Text style={[styles.summaryValue, { color: currentTheme.text }]}>{header.pickNumber}</Text>
              </View>
              
              <View style={[styles.summaryRow, { borderBottomColor: currentTheme.border + '40' }]}>
                <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>Delivery Schedule:</Text>
                <Text style={[styles.summaryValue, { color: currentTheme.text }]}>{header.schedule}</Text>
              </View>
              
              <View style={[styles.summaryRow, { borderBottomColor: currentTheme.border + '40' }]}>
                <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>Route Name:</Text>
                <Text style={[styles.summaryValue, { color: currentTheme.text }]}>{header.route}</Text>
              </View>
              
              <View style={[styles.summaryRow, styles.itemCountRow, { borderTopColor: currentTheme.primary }]}>
                <Text style={[styles.summaryLabel, { color: currentTheme.textSecondary }]}>Number of Items:</Text>
                <Text style={[styles.summaryValue, styles.itemCountValue, { color: currentTheme.primary }]}>{itemCount}</Text>
              </View>
            </View>
            
            <View style={[styles.totalPartsBox, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}>
              <Text style={[styles.totalPartsLabel, { color: currentTheme.textSecondary }]}>Total Parts:</Text>
              <Text style={[styles.totalPartsValue, { color: currentTheme.primary }]}>{totalParts}</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border }]}>
          <TouchableOpacity 
            style={[styles.abortButton, { backgroundColor: currentTheme.danger + '20', borderColor: currentTheme.danger + '40' }]} 
            onPress={handleAbort}
          >
            <AlertCircle size={20} color={currentTheme.danger} />
            <Text style={[styles.abortButtonText, { color: currentTheme.danger }]}>Abort Picksheet</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.continueButton, 
              { backgroundColor: currentTheme.primary },
              !name.trim() && { backgroundColor: currentTheme.border }
            ]} 
            onPress={handleContinue}
            disabled={!name.trim()}
          >
            <Save size={20} color="white" />
            <Text style={styles.continueButtonText}>Continue to Picking</Text>
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
    fontWeight: '600' as const,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  nameSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  summarySection: {
    flex: 1,
  },
  summaryBox: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  itemCountRow: {
    borderBottomWidth: 0,
    paddingTop: 16,
    marginTop: 8,
    borderTopWidth: 2,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    flex: 1,
    textAlign: 'right',
  },
  itemCountValue: {
    fontSize: 18,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  abortButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  abortButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  continueButton: {
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  totalPartsBox: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPartsLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  totalPartsValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
});