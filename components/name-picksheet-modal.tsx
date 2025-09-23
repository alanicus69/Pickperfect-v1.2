import React, { useState } from 'react';
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
} from 'react-native';
import { Save, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

interface NamePicksheetModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

export function NamePicksheetModal({
  visible,
  onClose,
  onSave,
}: NamePicksheetModalProps) {
  const { currentTheme } = useTheme();
  const [name, setName] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for this picksheet');
      return;
    }

    onSave(name.trim());
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
            <ArrowLeft size={24} color={currentTheme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.text }]}>Name Your Picksheet</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={[styles.description, { color: currentTheme.textSecondary }]}>
            Give this picksheet a name so you can easily find it later.
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: currentTheme.text }]}>Picksheet Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
              value={name}
              onChangeText={(text) => setName(text.slice(0, 23))}
              maxLength={23}
              placeholder="Enter picksheet name (e.g., Morning Pick - Zone A)"
              placeholderTextColor={currentTheme.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
          </View>
        </View>

        <View style={[styles.footer, { backgroundColor: currentTheme.surface, borderTopColor: currentTheme.border }]}>
          <TouchableOpacity style={[styles.saveButton, { backgroundColor: currentTheme.primary }]} onPress={handleSave}>
            <Save size={20} color="white" />
            <Text style={styles.saveButtonText}>Save Picksheet</Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  inputContainer: {
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
    fontWeight: '600',
  },
});