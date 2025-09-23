import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Package, Plus, ArrowLeft, History, Camera, Edit3, Settings } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { usePicksheet, PicksheetItemData } from '@/providers/picksheet-provider';
import { PicksheetItem } from '@/components/picksheet-item';
import { EditItemModal } from '@/components/edit-item-modal';
import { ItemDetailModal } from '@/components/item-detail-modal';
import { NamePicksheetModal } from '@/components/name-picksheet-modal';
import { SavedPicksheetsModal } from '@/components/saved-picksheets-modal';
import { PreferencesModal } from '@/components/preferences-modal';
import { PicksheetSummaryModal } from '@/components/picksheet-summary-modal';
import { ColourPickerModal } from '@/components/colour-picker-modal';
import { ImageViewerModal } from '@/components/image-viewer-modal';
import { SpecialItemConfirmationModal } from '@/components/special-item-confirmation-modal';
import { useTheme } from '@/providers/theme-provider';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { currentTheme } = useTheme();
  const { 
    items, 
    header,
    currentPicksheetName,
    currentPicksheetId,
    savedPicksheets,
    currentPicksheetImage,
    pendingSpecialItems,
    scanPicksheet, 
    isScanning, 
    toggleItemPicked, 
    getProgress, 
    scanProgress, 
    updateItem, 
    deleteItem, 
    addItem,
    savePicksheet,
    loadPicksheet,
    startNewPicksheet,
    getTotalParts,
    updatePicksheetColour,
    confirmSpecialItem,
    clearPendingSpecialItems
  } = usePicksheet();
  
  // Get the new functions from the provider
  const { pickAllItems, resetAllItems, updatePicksheetName } = usePicksheet();
  const [showPicksheet, setShowPicksheet] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<PicksheetItemData | null>(null);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [itemDetailModalVisible, setItemDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PicksheetItemData | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [savedPicksheetsModalVisible, setSavedPicksheetsModalVisible] = useState(false);
  const [scanMethodModalVisible, setScanMethodModalVisible] = useState(false);
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [colourPickerModalVisible, setColourPickerModalVisible] = useState(false);
  const [imageViewerModalVisible, setImageViewerModalVisible] = useState(false);
  const [changeFilenameModalVisible, setChangeFilenameModalVisible] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [imageOrientation, setImageOrientation] = useState<{ [key: string]: 'portrait' | 'landscape' }>({});
  const [imageRotation, setImageRotation] = useState<{ [key: string]: number }>({});
  const [specialItemModalVisible, setSpecialItemModalVisible] = useState(false);


  const detectImageOrientation = (imageUri: string): Promise<'portrait' | 'landscape'> => {
    return new Promise((resolve) => {
      Image.getSize(
        imageUri,
        (width, height) => {
          const orientation = height > width ? 'portrait' : 'landscape';
          setImageOrientation(prev => ({ ...prev, [imageUri]: orientation }));
          resolve(orientation);
        },
        (error) => {
          console.log('Error getting image size:', error);
          resolve('landscape'); // Default to landscape if we can't determine
        }
      );
    });
  };

  const detectCorrectRotation = async (imageUri: string): Promise<number> => {
    try {
      console.log('Detecting correct rotation for image:', imageUri);
      
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          if (reader.result) {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          } else {
            reject(new Error('Failed to read image'));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read image'));
      });
      reader.readAsDataURL(blob);
      const base64Image = await base64Promise;

      // Use AI to detect correct orientation
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an image orientation detector. Analyze the image and determine how many degrees clockwise it needs to be rotated to be "the right way up" (properly oriented for reading text and viewing content).
              
              Return ONLY a JSON object with the rotation needed: {"rotation": 0} for no rotation, {"rotation": 90} for 90 degrees clockwise, {"rotation": 180} for 180 degrees, or {"rotation": 270} for 270 degrees clockwise.
              
              Consider:
              - Text should be readable (not upside down or sideways)
              - People should be upright
              - Documents should be oriented for normal reading
              - If unsure, return {"rotation": 0}`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'How many degrees clockwise should this image be rotated to be the right way up? Return only JSON with rotation value.'
                },
                {
                  type: 'image',
                  image: base64Image
                }
              ]
            }
          ]
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI orientation detection failed:', aiResponse.status);
        return 0; // Default to no rotation
      }
      
      const result = await aiResponse.json();
      console.log('AI orientation response:', result.completion);
      
      // Parse the AI response
      let rotation = 0;
      try {
        const completion = result.completion.trim();
        let parsedData: any = {};
        
        // Try direct JSON parse
        try {
          parsedData = JSON.parse(completion);
        } catch (e) {
          // Try removing markdown code blocks
          const cleanedText = completion
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          parsedData = JSON.parse(cleanedText);
        }
        
        if (parsedData.rotation !== undefined) {
          rotation = parseInt(parsedData.rotation) || 0;
          // Ensure rotation is valid (0, 90, 180, or 270)
          if (![0, 90, 180, 270].includes(rotation)) {
            rotation = 0;
          }
        }
      } catch (parseError) {
        console.error('Failed to parse AI rotation response:', parseError);
        rotation = 0;
      }
      
      console.log('Detected rotation needed:', rotation, 'degrees');
      setImageRotation(prev => ({ ...prev, [imageUri]: rotation }));
      return rotation;
      
    } catch (error) {
      console.error('Error detecting image rotation:', error);
      return 0; // Default to no rotation on error
    }
  };

  const selectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to scan picksheets.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      // Detect orientation for display purposes
      await detectImageOrientation(imageUri);
      
      try {
        // First, scan the picksheet with original image (AI text reading)
        await scanPicksheet(imageUri);
        
        // After successful scan, detect correct rotation for aesthetic display
        console.log('Scan completed, now detecting aesthetic rotation...');
        await detectCorrectRotation(imageUri);
        
        // Check for pending special items first
        if (pendingSpecialItems.length > 0) {
          setSpecialItemModalVisible(true);
        } else {
          // Show summary modal after scan completes
          setSummaryModalVisible(true);
        }
      } catch (error) {
        Alert.alert('Scan Error', 'AI scanning failed. You can still create a picksheet manually.');
        console.error('Scan error:', error);
        setSelectedImage(null);
        // Show naming modal even if scan fails, so user can create empty picksheet
        setNameModalVisible(true);
      }
    }
  };
  
  const handleSpecialItemConfirm = (itemIndex: number, isSpecial: boolean) => {
    confirmSpecialItem(itemIndex, isSpecial);
    
    // If no more pending special items, show summary modal
    if (pendingSpecialItems.length <= 1) {
      setSpecialItemModalVisible(false);
      setSummaryModalVisible(true);
    }
  };
  
  const handleSpecialItemModalClose = () => {
    setSpecialItemModalVisible(false);
    clearPendingSpecialItems();
    setSummaryModalVisible(true);
  };

  const startManualEntry = () => {
    startNewPicksheet();
    setNameModalVisible(true);
  };

  const handleSavePicksheetName = async (name: string) => {
    try {
      await savePicksheet(name, items);
      setShowPicksheet(true);
      setSelectedImage(null);
    } catch (error) {
      Alert.alert('Save Error', 'Failed to save the picksheet. Please try again.');
      console.error('Save error:', error);
    }
  };

  const handleSummaryModalContinue = async (name: string) => {
    try {
      await savePicksheet(name, items, header, undefined, selectedImage || undefined);
      setSummaryModalVisible(false);
      setShowPicksheet(true);
      setSelectedImage(null);
    } catch (error) {
      Alert.alert('Save Error', 'Failed to save the picksheet. Please try again.');
      console.error('Save error:', error);
    }
  };

  const handleSummaryModalAbort = () => {
    startNewPicksheet();
    setSummaryModalVisible(false);
    setSelectedImage(null);
  };

  const handleLoadPicksheet = (picksheet: any) => {
    loadPicksheet(picksheet);
    setShowPicksheet(true);
  };

  const handleBackToHome = () => {
    setShowPicksheet(false);
    setSelectedImage(null);
    setImageOrientation({});
    setImageRotation({});
    startNewPicksheet();
  };

  // Detect orientation and rotation for current picksheet image when it changes
  useEffect(() => {
    if (currentPicksheetImage && !imageOrientation[currentPicksheetImage]) {
      detectImageOrientation(currentPicksheetImage);
      // Only detect rotation for aesthetic purposes after image is loaded
      setTimeout(() => {
        detectCorrectRotation(currentPicksheetImage);
      }, 100);
    }
  }, [currentPicksheetImage]);

  const progress = getProgress();
  const totalParts = getTotalParts();
  const isAllPicked = progress.percentage === 100;

  const handleLongPress = (item: PicksheetItemData, index: number) => {
    setEditingItem(item);
    setEditingIndex(index);
    setEditModalVisible(true);
  };

  const handleItemPress = (item: PicksheetItemData, index: number) => {
    setSelectedItem(item);
    setSelectedItemIndex(index);
    setItemDetailModalVisible(true);
  };

  const handleTogglePickedFromDetail = () => {
    if (selectedItemIndex >= 0) {
      toggleItemPicked(selectedItemIndex);
      setItemDetailModalVisible(false);
      setSelectedItem(null);
      setSelectedItemIndex(-1);
    }
  };

  const handleToggleSpecialFromDetail = () => {
    if (selectedItemIndex >= 0 && selectedItem) {
      const updatedItem = { ...selectedItem, special: !selectedItem.special };
      updateItem(selectedItemIndex, updatedItem);
      setSelectedItem(updatedItem);
    }
  };

  const handleUpdateItemFromDetail = (updatedItem: PicksheetItemData) => {
    if (selectedItemIndex >= 0) {
      updateItem(selectedItemIndex, updatedItem);
      setSelectedItem(updatedItem);
    }
  };

  const handleAddNewItem = () => {
    const newItem: PicksheetItemData = {
      location: '01A01',
      number: '0000000001',
      description: 'New Item',
      code: 'CODE001',
      quantity: '1',
      orderNumber: '10001',
      surname: 'N/A',
      special: false,
      parts: '1',
      units: '1',
      notes: '',
      picked: false,
    };
    addItem(newItem);
    setEditingItem(newItem);
    setEditingIndex(items.length);
    setEditModalVisible(true);
  };

  const handleSaveEdit = (index: number, updatedItem: Partial<PicksheetItemData>) => {
    updateItem(index, updatedItem);
  };

  const handleDeleteItem = (index: number) => {
    deleteItem(index);
  };

  const handlePickAllItems = () => {
    Alert.alert(
      'Pick All Items',
      'Are you sure you want to mark all items as picked?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Pick All',
          style: 'default',
          onPress: () => {
            pickAllItems();
          },
        },
      ]
    );
  };

  const handleResetAllItems = () => {
    Alert.alert(
      'Reset to Unpicked',
      'Are you sure you want to reset all items to unpicked?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset All',
          style: 'destructive',
          onPress: () => {
            resetAllItems();
          },
        },
      ]
    );
  };

  const handleFilenamePress = () => {
    setNewFilename(currentPicksheetName || '');
    setChangeFilenameModalVisible(true);
  };

  const handleSaveFilename = () => {
    if (newFilename.trim() && currentPicksheetId) {
      updatePicksheetName(currentPicksheetId, newFilename.trim());
      setChangeFilenameModalVisible(false);
      setNewFilename('');
    }
  };

  return (
    <>
      {!showPicksheet ? (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: currentTheme.background }]}>
          <StatusBar style="light" />
          <LinearGradient
            colors={[currentTheme.primary, currentTheme.secondary]}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setPreferencesModalVisible(true)}
              >
                <Settings size={24} color="white" />
              </TouchableOpacity>
              <Package size={48} color="white" />
              <Text style={styles.title}>PickPerfect V1.2</Text>
              <Text style={styles.subtitle}>Warehouse Picksheet Scanner</Text>
              <Text style={styles.copyright}>(c)Alanicus 2025</Text>
            </View>

            <View style={styles.content}>
              {selectedImage && isScanning && (
                <View style={styles.scanningContainer}>
                  <Image 
                    source={{ uri: selectedImage }} 
                    style={[
                      styles.thumbnail,
                      imageRotation[selectedImage] && {
                        transform: [{ rotate: `${imageRotation[selectedImage]}deg` }]
                      }
                    ]} 
                  />
                  <View style={styles.scanProgressContainer}>
                    <Text style={styles.scanProgressTitle}>Scanning picksheet...</Text>
                    <View style={styles.scanProgressBar}>
                      <View 
                        style={[
                          styles.scanProgressFill,
                          { width: `${scanProgress}%` as any }
                        ]} 
                      />
                    </View>
                    <Text style={styles.scanProgressText}>{scanProgress}% complete</Text>
                  </View>
                </View>
              )}

              {!isScanning && (
                <View style={styles.buttonsContainer}>
                  <TouchableOpacity
                    style={styles.scanButton}
                    onPress={() => setScanMethodModalVisible(true)}
                    disabled={isScanning}
                  >
                    <Package size={32} color="white" />
                    <Text style={styles.scanButtonText}>Create New Picksheet</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.savedPicksheetsButton}
                    onPress={() => setSavedPicksheetsModalVisible(true)}
                  >
                    <History size={24} color="white" />
                    <Text style={styles.savedPicksheetsButtonText}>Load Previous Picksheets</Text>
                    {savedPicksheets.length > 0 && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{savedPicksheets.length}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      ) : (
        <View style={[styles.container, styles.picksheetContainer, { backgroundColor: currentTheme.background, borderColor: currentTheme.border }]}>
          <StatusBar style="dark" />
          
          {/* Top Orange Bar */}
          <View style={[styles.topBar, { backgroundColor: currentTheme.primary }]} />
          
          <View style={[styles.listHeader, { backgroundColor: currentTheme.background, borderBottomColor: currentTheme.border }]}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.primary }]}
                onPress={handleBackToHome}
              >
                <ArrowLeft size={20} color={currentTheme.primary} />
              </TouchableOpacity>
              
              <View style={styles.appHeader}>
                <Package size={24} color={currentTheme.primary} />
                <Text style={[styles.appTitle, { color: currentTheme.text }]}>PickPerfect V1.2</Text>
                <Text style={[styles.appSubtitle, { color: currentTheme.textSecondary }]}>Warehouse Picksheet Scanner</Text>
                <Text style={[styles.appCopyright, { color: currentTheme.textSecondary }]}>(c)Alanicus 2025</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.addItemButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                onPress={handleAddNewItem}
              >
                <Plus size={20} color={currentTheme.primary} />
              </TouchableOpacity>
            </View>
            
            {/* Divider line */}
            <View style={[styles.dividerLine, { backgroundColor: currentTheme.border }]} />
            
            <View style={styles.titleContainer}>
              <TouchableOpacity onPress={handleFilenamePress}>
                <Text style={[styles.listTitle, { color: currentTheme.primary }]}>{currentPicksheetName || 'Picksheet Items'}</Text>
              </TouchableOpacity>
              <View style={styles.headerInfoRow}>
                <View style={styles.headerInfoLeft}>
                  {header && (header.pickNumber || header.schedule || header.route) && (
                    <View style={styles.sheetHeaderInfo}>
                      {header.pickNumber && (
                        <Text style={[styles.sheetHeaderText, { color: currentTheme.textSecondary }]}>Pick: {header.pickNumber}</Text>
                      )}
                      {header.schedule && (
                        <Text style={[styles.sheetHeaderText, { color: currentTheme.textSecondary }]}>Schedule: {header.schedule}</Text>
                      )}
                      {header.route && (
                        <Text style={[styles.sheetHeaderText, { color: currentTheme.textSecondary }]}>Route: {header.route}</Text>
                      )}
                    </View>
                  )}
                </View>
                <View style={styles.headerInfoRight}>
                  <View style={styles.headerRightControls}>
                    {currentPicksheetImage && (
                      <TouchableOpacity 
                        style={styles.thumbnailContainer}
                        onPress={() => setImageViewerModalVisible(true)}
                      >
                        <Image 
                          source={{ uri: currentPicksheetImage }} 
                          style={[
                            styles.picksheetThumbnail,
                            { borderColor: currentTheme.border },
                            imageRotation[currentPicksheetImage] && {
                              transform: [{ rotate: `${imageRotation[currentPicksheetImage]}deg` }]
                            }
                          ]} 
                        />
                      </TouchableOpacity>
                    )}
                    {currentPicksheetId && (
                      <TouchableOpacity 
                        style={[
                          styles.picksheetColourCircle, 
                          { 
                            backgroundColor: savedPicksheets.find(p => p.id === currentPicksheetId)?.colour || currentTheme.background,
                            borderColor: currentTheme.border,
                            borderWidth: 2
                          }
                        ]} 
                        onPress={() => setColourPickerModalVisible(true)}
                      />
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.progressContainer}>
              <View style={[styles.progressBar, { backgroundColor: currentTheme.surface }]}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${progress.percentage}%` as any, 
                      backgroundColor: isAllPicked ? currentTheme.success : currentTheme.primary 
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressTextContainer}>
                <Text style={[styles.progressText, { color: currentTheme.textSecondary }]}>
                  {progress.picked} of {progress.total} picked ({progress.percentage}%)
                </Text>
                <Text style={[styles.partsText, { color: currentTheme.primary }]}>
                  Total parts: <Text style={{ color: currentTheme.primary }}>{totalParts}</Text>
                </Text>
              </View>
            </View>
          </View>

          <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
            <View style={styles.itemsContainer}>
              {items.length > 0 ? (
                items.map((item, index) => (
                  <PicksheetItem
                    key={index}
                    item={item}
                    index={index}
                    onToggle={() => toggleItemPicked(index)}
                    onLongPress={() => handleLongPress(item, index)}
                    onPress={() => handleItemPress(item, index)}
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyStateText, { color: currentTheme.textSecondary }]}>No items to display</Text>
                </View>
              )}
            </View>
            {/* Bottom spacing for Android buttons */}
            <View style={styles.androidButtonSpacing} />
          </ScrollView>
          
          {/* Fixed Bottom Buttons */}
          <View style={[styles.bottomButtonsContainer, { backgroundColor: currentTheme.background, borderTopColor: currentTheme.border }]}>
            <View style={styles.bottomButtons}>
              <TouchableOpacity 
                style={[styles.bottomButton, styles.pickAllButton, { backgroundColor: currentTheme.primary }]}
                onPress={handlePickAllItems}
              >
                <Text style={styles.bottomButtonText}>Pick all Items</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.bottomButton, styles.resetButton, { backgroundColor: currentTheme.danger, borderColor: currentTheme.danger }]}
                onPress={handleResetAllItems}
              >
                <Text style={styles.bottomButtonText}>Reset to Unpicked</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Bottom Orange Bar */}
          <View style={[styles.bottomBar, { backgroundColor: currentTheme.primary }]} />
        </View>
      )}

      <EditItemModal
        visible={editModalVisible}
        item={editingItem}
        itemIndex={editingIndex}
        onClose={() => {
          setEditModalVisible(false);
          setEditingItem(null);
          setEditingIndex(-1);
        }}
        onSave={handleSaveEdit}
        onDelete={handleDeleteItem}
      />

      <ItemDetailModal
        visible={itemDetailModalVisible}
        item={selectedItem}
        itemIndex={selectedItemIndex}
        onClose={() => {
          setItemDetailModalVisible(false);
          setSelectedItem(null);
          setSelectedItemIndex(-1);
        }}
        onTogglePicked={handleTogglePickedFromDetail}
        onToggleSpecial={handleToggleSpecialFromDetail}
        onUpdateItem={handleUpdateItemFromDetail}
      />

      <NamePicksheetModal
        visible={nameModalVisible}
        onClose={() => {
          setNameModalVisible(false);
          setSelectedImage(null);
        }}
        onSave={handleSavePicksheetName}
      />

      <PicksheetSummaryModal
        visible={summaryModalVisible}
        onClose={() => {
          setSummaryModalVisible(false);
          setSelectedImage(null);
        }}
        onContinue={handleSummaryModalContinue}
        onAbort={handleSummaryModalAbort}
        header={header}
        itemCount={items.length}
      />

      <SavedPicksheetsModal
        visible={savedPicksheetsModalVisible}
        onClose={() => setSavedPicksheetsModalVisible(false)}
        picksheets={savedPicksheets}
        onSelectPicksheet={handleLoadPicksheet}
      />

      {/* Scan Method Selection Modal */}
      <Modal
        visible={scanMethodModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setScanMethodModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.scanMethodModal, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.scanMethodTitle, { color: currentTheme.text }]}>Choose Input Method</Text>
            <Text style={[styles.scanMethodSubtitle, { color: currentTheme.textSecondary }]}>How would you like to create your picksheet?</Text>
            
            <View style={styles.scanMethodButtons}>
              <TouchableOpacity
                style={[styles.scanMethodButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                onPress={() => {
                  setScanMethodModalVisible(false);
                  selectImage();
                }}
              >
                <Camera size={24} color={currentTheme.primary} />
                <Text style={[styles.scanMethodButtonText, { color: currentTheme.primary }]}>Scan Photo</Text>
                <Text style={[styles.scanMethodButtonSubtext, { color: currentTheme.textSecondary }]}>Use AI to scan picksheet image</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.scanMethodButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                onPress={() => {
                  setScanMethodModalVisible(false);
                  startManualEntry();
                }}
              >
                <Edit3 size={24} color={currentTheme.primary} />
                <Text style={[styles.scanMethodButtonText, { color: currentTheme.primary }]}>Manual Entry</Text>
                <Text style={[styles.scanMethodButtonSubtext, { color: currentTheme.textSecondary }]}>Start with empty picksheet</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: currentTheme.surface }]}
              onPress={() => setScanMethodModalVisible(false)}
            >
              <Text style={[styles.cancelButtonText, { color: currentTheme.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PreferencesModal
        visible={preferencesModalVisible}
        onClose={() => setPreferencesModalVisible(false)}
      />
      
      <ColourPickerModal
        visible={colourPickerModalVisible}
        onClose={() => setColourPickerModalVisible(false)}
        currentColour={currentPicksheetId ? (savedPicksheets.find(p => p.id === currentPicksheetId)?.colour || currentTheme.background) : currentTheme.background}
        onSelectColour={(colour) => {
          if (currentPicksheetId) {
            updatePicksheetColour(currentPicksheetId, colour);
          }
        }}
      />
      
      <ImageViewerModal
        visible={imageViewerModalVisible}
        imageUri={currentPicksheetImage}
        onClose={() => setImageViewerModalVisible(false)}
      />
      
      {/* Change Filename Modal */}
      <Modal
        visible={changeFilenameModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setChangeFilenameModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.changeFilenameModal, { backgroundColor: currentTheme.background }]}>
            <Text style={[styles.changeFilenameTitle, { color: currentTheme.text }]}>Change Filename</Text>
            
            <TextInput
              style={[styles.filenameInput, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border, color: currentTheme.text }]}
              value={newFilename}
              onChangeText={(text) => setNewFilename(text.slice(0, 23))}
              maxLength={23}
              placeholder="Enter new filename"
              placeholderTextColor={currentTheme.textSecondary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveFilename}
            />
            
            <View style={styles.filenameModalButtons}>
              <TouchableOpacity
                style={[styles.filenameModalButton, { backgroundColor: currentTheme.surface, borderColor: currentTheme.border }]}
                onPress={() => {
                  setChangeFilenameModalVisible(false);
                  setNewFilename('');
                }}
              >
                <Text style={[styles.filenameModalButtonText, { color: currentTheme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filenameModalButton, 
                  { backgroundColor: currentTheme.primary },
                  !newFilename.trim() && { backgroundColor: currentTheme.border }
                ]}
                onPress={handleSaveFilename}
                disabled={!newFilename.trim()}
              >
                <Text style={styles.filenameModalButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      <SpecialItemConfirmationModal
        visible={specialItemModalVisible}
        pendingItems={pendingSpecialItems}
        onConfirm={handleSpecialItemConfirm}
        onClose={handleSpecialItemModalClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  picksheetContainer: {
    borderWidth: 4,
  },
  topBar: {
    height: 6,
    width: '100%',
  },
  bottomBar: {
    height: 6,
    width: '100%',
  },
  androidButtonSpacing: {
    height: 40,
  },
  gradient: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: 'white',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  copyright: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },

  buttonsContainer: {
    gap: 16,
  },
  scanButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  savedPicksheetsButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 32,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  savedPicksheetsButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'white',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold' as const,
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'white',
  },
  listHeader: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  appHeader: {
    alignItems: 'center',
    flex: 1,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginTop: 4,
  },
  appSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  appCopyright: {
    fontSize: 10,
    marginTop: 1,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  dividerLine: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  headerInfoLeft: {
    flex: 1,
  },
  headerInfoRight: {
    alignItems: 'flex-end',
  },
  headerRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  picksheetThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
  },
  picksheetColourCircle: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  addItemButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  listTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
  },
  sheetHeaderInfo: {
    alignItems: 'flex-start',
  },
  sheetHeaderText: {
    fontSize: 12,
    lineHeight: 16,
  },

  progressContainer: {
    gap: 8,
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
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  partsText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  itemsList: {
    flex: 1,
    paddingTop: 16,
  },
  itemsContainer: {
    paddingHorizontal: 24,
  },
  scanningContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 20,
  },
  thumbnail: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  scanProgressContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  scanProgressTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: 'white',
  },
  scanProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  scanProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  scanProgressText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500' as const,
  },

  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scanMethodModal: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  scanMethodTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 8,
  },
  scanMethodSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  scanMethodButtons: {
    gap: 12,
    marginBottom: 20,
  },
  scanMethodButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  scanMethodButtonText: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  scanMethodButtonSubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  cancelButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  
  // Bottom buttons styles
  bottomButtonsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickAllButton: {
    // Primary button styling handled by backgroundColor
  },
  resetButton: {
    // Danger button styling handled by backgroundColor
  },
  bottomButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  
  // Change filename modal styles
  changeFilenameModal: {
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  changeFilenameTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    marginBottom: 20,
  },
  filenameInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  filenameModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filenameModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  filenameModalButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  filenameModalButtonTextPrimary: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  rotatedImage: {
    transform: [{ rotate: '90deg' }],
  },
  rotatedThumbnail: {
    transform: [{ rotate: '90deg' }],
  },
});