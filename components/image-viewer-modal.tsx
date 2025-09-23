import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '@/providers/theme-provider';

interface ImageViewerModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
}

export function ImageViewerModal({ visible, imageUri, onClose }: ImageViewerModalProps) {
  const { currentTheme } = useTheme();
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [screenDimensions, setScreenDimensions] = useState(() => Dimensions.get('window'));
  const [imageOrientation, setImageOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [imageRotation, setImageRotation] = useState<number>(0);
  
  // Animation values
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // Gesture state
  const lastScale = useRef(1);
  const lastTranslateX = useRef(0);
  const lastTranslateY = useRef(0);
  const initialDistance = useRef<number | null>(null);
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store current values when gesture starts
        scale.setOffset(lastScale.current);
        translateX.setOffset(lastTranslateX.current);
        translateY.setOffset(lastTranslateY.current);
        scale.setValue(0);
        translateX.setValue(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle pinch-to-zoom
        if (evt.nativeEvent.touches?.length === 2) {
          const touch1 = evt.nativeEvent.touches[0];
          const touch2 = evt.nativeEvent.touches[1];
          const distance = Math.sqrt(
            Math.pow(touch2.pageX - touch1.pageX, 2) + Math.pow(touch2.pageY - touch1.pageY, 2)
          );
          
          if (!initialDistance.current) {
            initialDistance.current = distance;
          }
          
          const scaleValue = distance / initialDistance.current;
          const clampedScale = Math.max(0.5, Math.min(scaleValue, 3));
          scale.setValue(clampedScale - 1);
        } else {
          // Handle pan
          translateX.setValue(gestureState.dx);
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: () => {
        // Get current animated values
        const currentScale = (scale as any)._value;
        const currentTranslateX = (translateX as any)._value;
        const currentTranslateY = (translateY as any)._value;
        
        // Update last values
        lastScale.current = Math.max(0.5, Math.min(lastScale.current + currentScale, 3));
        lastTranslateX.current += currentTranslateX;
        lastTranslateY.current += currentTranslateY;
        
        // Reset offsets
        scale.flattenOffset();
        translateX.flattenOffset();
        translateY.flattenOffset();
        
        // Reset initial distance for next pinch gesture
        initialDistance.current = null;
        
        // Animate back to bounds if needed
        const maxTranslateX = (screenDimensions.width * (lastScale.current - 1)) / 2;
        const maxTranslateY = (screenDimensions.height * (lastScale.current - 1)) / 2;
        
        const boundedX = Math.max(-maxTranslateX, Math.min(maxTranslateX, lastTranslateX.current));
        const boundedY = Math.max(-maxTranslateY, Math.min(maxTranslateY, lastTranslateY.current));
        
        if (boundedX !== lastTranslateX.current || boundedY !== lastTranslateY.current) {
          lastTranslateX.current = boundedX;
          lastTranslateY.current = boundedY;
          
          Animated.parallel([
            Animated.spring(translateX, { toValue: boundedX, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: boundedY, useNativeDriver: true }),
          ]).start();
        }
      },
    })
  ).current;
  
  const resetZoom = () => {
    lastScale.current = 1;
    lastTranslateX.current = 0;
    lastTranslateY.current = 0;
    
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };
  
  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    setImageSize({ width, height });
    // Detect orientation
    const orientation = height > width ? 'portrait' : 'landscape';
    setImageOrientation(orientation);
  };

  const detectCorrectRotation = async (imageUri: string): Promise<number> => {
    try {
      console.log('Detecting correct rotation for image viewer:', imageUri);
      
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
      console.log('AI orientation response for viewer:', result.completion);
      
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
      
      console.log('Detected rotation needed for viewer:', rotation, 'degrees');
      setImageRotation(rotation);
      return rotation;
      
    } catch (error) {
      console.error('Error detecting image rotation for viewer:', error);
      return 0; // Default to no rotation on error
    }
  };

  // Detect orientation and rotation when imageUri changes
  useEffect(() => {
    if (imageUri) {
      Image.getSize(
        imageUri,
        (width, height) => {
          const orientation = height > width ? 'portrait' : 'landscape';
          setImageOrientation(orientation);
        },
        (error) => {
          console.log('Error getting image size:', error);
          setImageOrientation('landscape');
        }
      );
      
      // Detect correct rotation
      detectCorrectRotation(imageUri);
    }
  }, [imageUri]);
  
  const getImageDimensions = () => {
    if (!imageSize.width || !imageSize.height) {
      return { width: screenDimensions.width * 0.9, height: screenDimensions.height * 0.7 };
    }
    
    const aspectRatio = imageSize.width / imageSize.height;
    const maxWidth = screenDimensions.width * 0.9;
    const maxHeight = screenDimensions.height * 0.7;
    
    let displayWidth = maxWidth;
    let displayHeight = displayWidth / aspectRatio;
    
    if (displayHeight > maxHeight) {
      displayHeight = maxHeight;
      displayWidth = displayHeight * aspectRatio;
    }
    
    return { width: displayWidth, height: displayHeight };
  };
  
  const imageDimensions = getImageDimensions();
  
  if (!imageUri) {
    return null;
  }
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: currentTheme.background + 'E6' }]}>
          <Text style={[styles.headerTitle, { color: currentTheme.text }]}>Picksheet Image</Text>
          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: currentTheme.surface }]}
            onPress={onClose}
          >
            <X size={24} color={currentTheme.text} />
          </TouchableOpacity>
        </View>
        
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Animated.View
            style={[
              styles.imageWrapper,
              {
                transform: [
                  { scale: Animated.add(scale, 1) },
                  { translateX },
                  { translateY },
                ],
              },
            ]}
            {...(Platform.OS !== 'web' ? panResponder.panHandlers : {})}
          >
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.image,
                {
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                },
                imageRotation !== 0 && {
                  transform: [{ rotate: `${imageRotation}deg` }]
                },
              ]}
              onLoad={handleImageLoad}
              resizeMode="contain"
            />
          </Animated.View>
        </View>
        
        {/* Instructions */}
        <View style={[styles.instructions, { backgroundColor: currentTheme.background + 'E6' }]}>
          <Text style={[styles.instructionText, { color: currentTheme.textSecondary }]}>
            {Platform.OS === 'web' ? 'Use mouse wheel to zoom' : 'Pinch to zoom • Drag to pan'}
          </Text>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: currentTheme.primary }]}
            onPress={resetZoom}
          >
            <Text style={styles.resetButtonText}>Reset Zoom</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingBottom: 100,
  },
  imageWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    borderRadius: 8,
  },
  instructions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 14,
    flex: 1,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  rotatedImage: {
    transform: [{ rotate: '90deg' }],
  },
});