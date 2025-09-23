import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

interface ColourPickerModalProps {
  visible: boolean;
  onClose: () => void;
  currentColour: string;
  onSelectColour: (colour: string) => void;
}

const COLOURS = [
  // Reds
  '#ff0000', // Pure Red
  '#dc2626', // Red 600
  '#ef4444', // Red 500
  '#f87171', // Red 400
  
  // Oranges
  '#ff4500', // Orange Red
  '#ea580c', // Orange 600
  '#f97316', // Orange 500
  '#fb923c', // Orange 400
  
  // Yellows
  '#ffff00', // Pure Yellow
  '#ca8a04', // Yellow 600
  '#eab308', // Yellow 500
  '#facc15', // Yellow 400
  
  // Greens
  '#00ff00', // Pure Green
  '#16a34a', // Green 600
  '#22c55e', // Green 500
  '#4ade80', // Green 400
  
  // Cyans/Teals
  '#00ffff', // Pure Cyan
  '#0891b2', // Cyan 600
  '#06b6d4', // Cyan 500
  '#22d3ee', // Cyan 400
  
  // Blues
  '#0000ff', // Pure Blue
  '#2563eb', // Blue 600
  '#3b82f6', // Blue 500
  '#60a5fa', // Blue 400
  
  // Purples
  '#8000ff', // Purple
  '#7c3aed', // Violet 600
  '#8b5cf6', // Violet 500
  '#a78bfa', // Violet 400
  
  // Magentas/Pinks
  '#ff00ff', // Pure Magenta
  '#be185d', // Pink 700
  '#ec4899', // Pink 500
  '#f472b6', // Pink 400
];

export function ColourPickerModal({
  visible,
  onClose,
  currentColour,
  onSelectColour,
}: ColourPickerModalProps) {
  const { currentTheme } = useTheme();

  const handleSelectColour = (colour: string) => {
    onSelectColour(colour);
    // Small delay to ensure the update is processed before closing
    setTimeout(() => {
      onClose();
    }, 100);
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
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: '#fff7ed', borderColor: '#f97316', borderWidth: 1 }]} onPress={onClose}>
            <ArrowLeft size={24} color="#f97316" />
          </TouchableOpacity>
          <Text style={[styles.title, { color: currentTheme.text }]}>Choose Colour</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.description, { color: currentTheme.textSecondary }]}>
            Select a colour to label your picksheet for easy identification
          </Text>
          
          <View style={styles.colourGrid}>
            {COLOURS.map((colour) => {
              const isSelected = colour === currentColour;
              const isLightColour = colour === '#ffff00' || colour === '#00ffff' || colour === '#00ff00' || colour === '#facc15' || colour === '#22d3ee' || colour === '#4ade80';
              
              return (
                <TouchableOpacity
                  key={colour}
                  style={[
                    styles.colourOption,
                    { 
                      backgroundColor: colour,
                      borderColor: currentTheme.border,
                      borderWidth: 2
                    },
                    isSelected && styles.selectedColour
                  ]}
                  onPress={() => handleSelectColour(colour)}
                >
                  {isSelected && (
                    <Check 
                      size={24} 
                      color={isLightColour ? currentTheme.text : '#ffffff'} 
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
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
    borderRadius: 8,
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
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  colourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colourOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedColour: {
    transform: [{ scale: 1.1 }],
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});