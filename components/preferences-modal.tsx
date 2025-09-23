import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme, themes } from '@/providers/theme-provider';

interface PreferencesModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PreferencesModal({ visible, onClose }: PreferencesModalProps) {
  const { currentTheme, selectTheme } = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.modal, { backgroundColor: currentTheme.background }]}>
          <View style={[styles.header, { borderBottomColor: currentTheme.border }]}>
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: currentTheme.text }]}>PickPerfect</Text>
              <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
                Created by Alanicus Ward 2025
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.primary, borderWidth: 1 }]}>
              <ArrowLeft size={24} color={currentTheme.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>
              Theme Styles
            </Text>
            
            <View style={styles.themesGrid}>
              {themes.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.themeOption,
                    { 
                      backgroundColor: theme.surface,
                      borderColor: currentTheme.id === theme.id ? theme.primary : theme.border,
                      borderWidth: currentTheme.id === theme.id ? 2 : 1,
                    }
                  ]}
                  onPress={() => selectTheme(theme.id)}
                >
                  <View style={styles.themePreview}>
                    <View style={[styles.colorSample, { backgroundColor: theme.primary }]} />
                    <View style={[styles.colorSample, { backgroundColor: theme.secondary }]} />
                    <View style={[styles.colorSample, { backgroundColor: theme.background }]} />
                  </View>
                  <Text style={[styles.themeName, { color: theme.text }]}>
                    {theme.name}
                  </Text>
                  {currentTheme.id === theme.id && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.primary }]}>
                      <Text style={styles.selectedText}>Selected</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  themesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  themeOption: {
    width: '47%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  themePreview: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  colorSample: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  themeName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});