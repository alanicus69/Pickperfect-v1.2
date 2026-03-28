import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';

import { PicksheetItemData } from '@/providers/picksheet-provider';
import { useTheme } from '@/providers/theme-provider';

interface PicksheetItemProps {
  item: PicksheetItemData;
  index: number;
  onToggle: () => void;
  onLongPress: () => void;
  onPress?: () => void;
}

export function PicksheetItem({ item, index, onToggle, onLongPress, onPress }: PicksheetItemProps) {
  const { currentTheme } = useTheme();
  const scaleValue = new Animated.Value(1);
  const isEven = index % 2 === 0;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onPress) {
      onPress();
    } else {
      onToggle();
    }
  };

  const getBackgroundColor = () => {
    const quantity = parseInt(item.quantity) || 1;
    const units = parseInt(item.units) || 1;
    const parts = parseInt(item.parts) || 1;
    const totalParts = Math.floor((quantity / units) * parts);
    
    // If item is marked as picked, show as picked regardless of parts logic
    if (item.picked) {
      return currentTheme.id === 'dark' ? currentTheme.secondary + '40' : currentTheme.primary + '20';
    }
    
    // For single-part items, use original logic
    if (totalParts <= 1) {
      return isEven ? currentTheme.background : currentTheme.surface;
    }
    
    // For multi-part items, show partial progress only if not already marked as picked
    if (item.selectedParts && item.selectedParts.length > 0) {
      const selectedCount = item.selectedParts.filter(part => part).length;
      const progressPercentage = selectedCount / totalParts;
      
      if (progressPercentage === 0) {
        // No parts selected
        return isEven ? currentTheme.background : currentTheme.surface;
      } else if (progressPercentage === 1) {
        // All parts selected
        return currentTheme.id === 'dark' ? currentTheme.secondary + '40' : currentTheme.primary + '20';
      } else {
        // Partially selected - create a gradient effect with opacity
        const opacity = Math.round(progressPercentage * 40); // 0-40% opacity
        return currentTheme.primary + opacity.toString(16).padStart(2, '0');
      }
    }
    
    return isEven ? currentTheme.background : currentTheme.surface;
  };

  const getBorderColor = () => {
    const quantity = parseInt(item.quantity) || 1;
    const units = parseInt(item.units) || 1;
    const parts = parseInt(item.parts) || 1;
    const totalParts = Math.floor((quantity / units) * parts);
    
    // If item is marked as picked, show primary border
    if (item.picked) {
      return currentTheme.primary;
    }
    
    // For single-part items, use original logic
    if (totalParts <= 1) {
      return currentTheme.id === 'dark' ? currentTheme.border + '40' : currentTheme.border + '20';
    }
    
    // For multi-part items, show partial progress in border only if not already marked as picked
    if (item.selectedParts && item.selectedParts.length > 0) {
      const selectedCount = item.selectedParts.filter(part => part).length;
      const progressPercentage = selectedCount / totalParts;
      
      if (progressPercentage === 0) {
        return currentTheme.id === 'dark' ? currentTheme.border + '40' : currentTheme.border + '20';
      } else {
        return currentTheme.primary;
      }
    }
    
    return currentTheme.id === 'dark' ? currentTheme.border + '40' : currentTheme.border + '20';
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleValue }] }]}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderWidth: (() => {
              const quantity = parseInt(item.quantity) || 1;
              const units = parseInt(item.units) || 1;
              const parts = parseInt(item.parts) || 1;
              const totalParts = Math.floor((quantity / units) * parts);
              
              // If item is marked as picked, show thick border
              if (item.picked) {
                return 2;
              }
              
              if (totalParts > 1 && item.selectedParts) {
                const selectedCount = item.selectedParts.filter(part => part).length;
                return selectedCount > 0 ? 2 : 1;
              }
              return 1;
            })(),
          }
        ]}
        onPress={handlePress}
        onLongPress={onLongPress}
        activeOpacity={0.8}
      >
        <View style={styles.itemRow}>
          {/* Item Number */}
          <View style={[
            styles.numberContainer,
            { backgroundColor: currentTheme.primary },
            item.picked && { backgroundColor: currentTheme.primary }
          ]}>
            <Text style={[
              styles.number,
              { color: 'white' }
            ]}>
              {index + 1}
            </Text>
          </View>

          {/* Item Details */}
          <View style={styles.itemDetails}>
            <View style={styles.mainInfo}>
              <Text style={[
                styles.locationText,
                { color: currentTheme.primary },
                item.picked && styles.pickedText
              ]}>
                {item.location}
              </Text>
              <Text style={[
                styles.descriptionText,
                { color: currentTheme.text },
                item.picked && styles.pickedText
              ]}>
                {item.description}
              </Text>
              <Text style={[
                styles.codeText,
                { color: currentTheme.primary },
                item.picked && styles.pickedText
              ]}>
                {item.code}
              </Text>
              <View style={styles.quantityRow}>
                <Text style={[
                  styles.quantityText,
                  { color: currentTheme.textSecondary },
                  item.picked && styles.pickedText
                ]}>
                  Qty: <Text style={{ color: currentTheme.primary }}>{item.quantity}</Text>
                </Text>
                <Text style={[
                  styles.partsTextAligned,
                  { color: currentTheme.textSecondary },
                  item.picked && styles.pickedText
                ]}>
                  Parts: {(() => {
                    const quantity = parseInt(item.quantity) || 1;
                    const units = parseInt(item.units) || 1;
                    const parts = parseInt(item.parts) || 1;
                    const totalParts = Math.floor((quantity / units) * parts);
                    
                    if (totalParts > 1 && item.selectedParts) {
                      const selectedCount = item.selectedParts.filter(part => part).length;
                      return (
                        <Text style={{ color: currentTheme.primary, fontWeight: 'bold' }}>
                          {selectedCount} / {totalParts}
                        </Text>
                      );
                    } else {
                      return (
                        <Text style={{ color: currentTheme.primary }}>
                          {totalParts}
                        </Text>
                      );
                    }
                  })()} 
                </Text>
              </View>
              <View style={styles.quantityRow}>
                <Text style={[
                  styles.quantityText,
                  { color: currentTheme.textSecondary },
                  item.picked && styles.pickedText
                ]}>
                  Order #: <Text style={{ color: currentTheme.primary }}>{item.orderNumber}</Text>
                </Text>
                <Text style={[
                  styles.partsText,
                  { color: currentTheme.textSecondary },
                  item.picked && styles.pickedText
                ]}>
                  Customer: <Text style={{ color: currentTheme.primary }}>{item.surname}</Text>
                </Text>
              </View>
            </View>
            
            {/* Special Item and Notes Warnings on same line */}
            {(item.special || (item.notes && item.notes.trim())) && (
              <View style={styles.warningsRow}>
                {item.special && (
                  <View style={[styles.warningContainer, { backgroundColor: currentTheme.secondary }]}>
                    <Text style={styles.warningText}>Special Item</Text>
                  </View>
                )}
                {item.notes && item.notes.trim() && (
                  <View style={[styles.warningContainer, { backgroundColor: currentTheme.danger }]}>
                    <Text style={styles.warningText}>Notes</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Status Indicator */}
          <View style={styles.statusContainer}>
            {(() => {
              const quantity = parseInt(item.quantity) || 1;
              const units = parseInt(item.units) || 1;
              const parts = parseInt(item.parts) || 1;
              const totalParts = Math.floor((quantity / units) * parts);
              
              // If item is marked as picked, show as picked regardless of parts logic
              if (item.picked) {
                return (
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: currentTheme.primary }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: 'white' }
                    ]}>
                      PICKED
                    </Text>
                  </View>
                );
              }
              
              if (totalParts > 1 && item.selectedParts) {
                const selectedCount = item.selectedParts.filter(part => part).length;
                const progressPercentage = selectedCount / totalParts;
                
                if (progressPercentage === 0) {
                  return (
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: currentTheme.textSecondary }
                      ]}>
                        UNPICKED
                      </Text>
                    </View>
                  );
                } else if (progressPercentage === 1) {
                  return (
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: currentTheme.primary }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: 'white' }
                      ]}>
                        PICKED
                      </Text>
                    </View>
                  );
                } else {
                  return (
                    <View style={[
                      styles.statusIndicator,
                      { backgroundColor: currentTheme.primary + '80', borderWidth: 1, borderColor: currentTheme.primary }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: 'white', fontSize: 10 }
                      ]}>
                        {Math.round(progressPercentage * 100)}%
                      </Text>
                    </View>
                  );
                }
              } else {
                return (
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: currentTheme.surface, borderWidth: 1, borderColor: currentTheme.border }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: currentTheme.textSecondary }
                    ]}>
                      UNPICKED
                    </Text>
                  </View>
                );
              }
            })()} 
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.03,
    shadowRadius: 1,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberContainer: {
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  pickedNumberContainer: {
    // Background color handled by theme
  },
  number: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pickedNumber: {
    color: 'white',
  },
  itemDetails: {
    flex: 1,
    paddingRight: 8,
  },
  mainInfo: {
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  locationHighlight: {
    fontWeight: 'bold',
  },
  codeText: {
    fontSize: 13,
    fontWeight: '600',
    marginVertical: 2,
    alignSelf: 'flex-start',
  },
  descriptionText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 16,
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '500',
  },
  partsText: {
    fontSize: 13,
    fontWeight: '500',
  },
  partsTextAligned: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  pickedText: {
    textDecorationLine: 'line-through',
    opacity: 0.8,
  },
  statusContainer: {
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  pickedIndicator: {
    // Background color handled by theme
  },
  unpickedIndicator: {
    borderWidth: 1,
    // Background and border colors handled by theme
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pickedStatusText: {
    // Color handled by theme
  },
  unpickedStatusText: {
    // Color handled by theme
  },
  checkIcon: {
    padding: 2,
  },
  warningsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
    marginLeft: -16,
    marginRight: -16,
    paddingHorizontal: 16,
  },
  warningContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    minWidth: 100,
  },
  warningText: {
    fontSize: 11,
    fontWeight: 'bold' as const,
    color: 'white',
    letterSpacing: 0.5,
  },
});