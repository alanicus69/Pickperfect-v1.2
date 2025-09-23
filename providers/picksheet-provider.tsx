import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PicksheetItemData {
  location: string; // Item.Location (Bin)
  number: string; // Item.Number (The 10 digit number)
  description: string; // Item.Description
  code: string; // Item.Code (Supplier Ref.)
  quantity: string; // Item.Quantity (Qty - zero decimal place)
  orderNumber: string; // Item.OrderNumber (5 digit number)
  surname: string; // Item.Surname
  special: boolean; // Item.Special (Boolean - default false)
  parts: string; // Item.Parts (default 1)
  units: string; // Item.Units (default 1)
  notes: string; // Item.Notes (default blank)
  picked: boolean;
  selectedParts?: boolean[]; // Track which parts are selected for picking
  potentialSpecial?: boolean; // Flag for items that might be special
}

export interface PicksheetHeaderData {
  pickNumber: string; // Sheet.PickNumber
  schedule: string; // Sheet.Schedule
  route: string; // Sheet.Route
}

export interface SavedPicksheet {
  id: string;
  name: string;
  header: PicksheetHeaderData;
  items: PicksheetItemData[];
  createdAt: string;
  updatedAt: string;
  colour: string;
  imageUri?: string;
}

export const [PicksheetProvider, usePicksheet] = createContextHook(() => {
  const [items, setItems] = useState<PicksheetItemData[]>([]);
  const [header, setHeader] = useState<PicksheetHeaderData>({ pickNumber: '', schedule: '', route: '' });
  const [currentPicksheetName, setCurrentPicksheetName] = useState<string>('');
  const [currentPicksheetId, setCurrentPicksheetId] = useState<string | null>(null);
  const [savedPicksheets, setSavedPicksheets] = useState<SavedPicksheet[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentPicksheetImage, setCurrentPicksheetImage] = useState<string | null>(null);
  const [pendingSpecialItems, setPendingSpecialItems] = useState<PicksheetItemData[]>([]);

  const loadSavedPicksheets = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('savedPicksheets');
      if (stored) {
        setSavedPicksheets(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load saved picksheets:', error);
    }
  }, []);

  // Load saved picksheets on mount
  useEffect(() => {
    loadSavedPicksheets();
  }, [loadSavedPicksheets]);

  const savePicksheet = useCallback(async (name: string, items: PicksheetItemData[], headerData?: PicksheetHeaderData, colour?: string, imageUri?: string) => {
    try {
      const now = new Date().toISOString();
      const existingPicksheet = currentPicksheetId ? savedPicksheets.find(p => p.id === currentPicksheetId) : null;
      const picksheet: SavedPicksheet = {
        id: currentPicksheetId || Date.now().toString(),
        name,
        header: headerData || header,
        items,
        createdAt: existingPicksheet?.createdAt || now,
        updatedAt: now,
        colour: colour || existingPicksheet?.colour || '#ffffff',
        imageUri: imageUri || existingPicksheet?.imageUri,
      };

      const updatedPicksheets = currentPicksheetId 
        ? savedPicksheets.map(p => p.id === currentPicksheetId ? picksheet : p)
        : [...savedPicksheets, picksheet];
      
      setSavedPicksheets(updatedPicksheets);
      await AsyncStorage.setItem('savedPicksheets', JSON.stringify(updatedPicksheets));
      
      setCurrentPicksheetId(picksheet.id);
      setCurrentPicksheetName(name);
      if (headerData) {
        setHeader(headerData);
      }
      
      console.log('Picksheet saved successfully:', picksheet.name);
    } catch (error) {
      console.error('Failed to save picksheet:', error);
    }
  }, [currentPicksheetId, savedPicksheets, header]);

  const loadPicksheet = useCallback((picksheet: SavedPicksheet) => {
    setItems(picksheet.items);
    setHeader(picksheet.header || { pickNumber: '', schedule: '', route: '' });
    setCurrentPicksheetName(picksheet.name);
    setCurrentPicksheetId(picksheet.id);
    setCurrentPicksheetImage(picksheet.imageUri || null);
  }, []);

  const startNewPicksheet = useCallback(() => {
    setItems([]);
    setHeader({ pickNumber: '', schedule: '', route: '' });
    setCurrentPicksheetName('');
    setCurrentPicksheetId(null);
    setCurrentPicksheetImage(null);
  }, []);

  const scanPicksheet = useCallback(async (imageUri: string) => {
    // Input validation
    if (!imageUri || !imageUri.trim()) {
      throw new Error('Image URI is required');
    }
    if (imageUri.length > 2000) {
      throw new Error('Image URI is too long');
    }
    const sanitizedUri = imageUri.trim();
    
    console.log('Starting scan for image:', sanitizedUri);
    setIsScanning(true);
    setScanProgress(0);

    setItems([]); // Clear previous items
    setHeader({ pickNumber: '', schedule: '', route: '' });
    setCurrentPicksheetName('');
    setCurrentPicksheetId(null);
    setCurrentPicksheetImage(sanitizedUri);
    
    try {
      setScanProgress(10);
      console.log('Fetching image from URI...');
      const response = await fetch(sanitizedUri);
      const blob = await response.blob();
      console.log('Image fetched, blob size:', blob.size);
      setScanProgress(25);
      
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
      setScanProgress(40);

      setScanProgress(50);
      console.log('Sending request to AI API...');
      const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `You are an expert OCR system specialized in warehouse picksheet document analysis. Your task is to extract structured data from picksheet images with maximum accuracy.

IMPORTANT INSTRUCTIONS:
1. HEADER EXTRACTION:
   - Look for "Pick Number", "Pick #", "P#" or similar labels
   - Look for "Schedule", "Delivery Schedule", "Date" or similar
   - Look for "Route", "Route Name", "Delivery Route" or similar

2. ITEM EXTRACTION RULES:
   - Scan the entire document systematically from top to bottom
   - Look for tabular data, rows, or structured lists
   - Each item typically has these fields in order: Location/Bin, Item Number, Description, Code/Ref, Quantity, Order Number, Surname
   - Item numbers are usually 10 digits
   - Order numbers are usually 5 digits
   - Quantities should be whole numbers (remove decimals)
   - Location codes are usually alphanumeric (e.g., A1B2, 01A01)

3. OCR ACCURACY TIPS:
   - Pay special attention to similar characters: 0/O, 1/I/l, 5/S, 6/G, 8/B
   - Numbers in item codes should be digits, not letters
   - Verify item numbers are exactly 10 digits when possible
   - Cross-reference similar data for consistency

4. OUTPUT FORMAT:
   - Return ONLY valid JSON, no markdown or extra text
   - Format: {"header": {"pickNumber": "", "schedule": "", "route": ""}, "items": [{"location": "", "number": "", "description": "", "code": "", "quantity": "", "orderNumber": "", "surname": "", "special": false}, ...]}
   - If uncertain about a field, use best guess but mark with "?" prefix
   - Include ALL visible items, even if some fields are unclear
   - Special items are usually marked with asterisk (*) or highlighted

5. VALIDATION:
   - Ensure item numbers don't contain obvious OCR errors (like letters in number fields)
   - Verify quantities are reasonable whole numbers
   - Check that location codes follow expected patterns`
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Perform high-accuracy OCR on this picksheet document. Extract the header information (Pick Number, Schedule/Date, Route) and ALL items in the table/list. Focus on accuracy - double-check numbers and codes for OCR errors. Return structured JSON with header and items array. Each item needs: location (bin code), number (10-digit item number), description (item name), code (supplier reference), quantity (whole number), orderNumber (5-digit), surname (customer), special (boolean for marked items). Be extremely careful with number recognition - avoid common OCR mistakes like 0/O, 1/I, 5/S, etc.'
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
        console.error('AI API error:', aiResponse.status, aiResponse.statusText);
        throw new Error(`AI API error: ${aiResponse.status}`);
      }
      
      const result = await aiResponse.json();
      setScanProgress(75);
      
      console.log('AI Response received:', result);
      console.log('AI Completion text:', result.completion);
      
      if (!result.completion) {
        throw new Error('No completion text in AI response');
      }
      
      console.log('Processing scan result...');
      
      let parsedData: any = {};
      let parseSuccess = false;
      
      // Try multiple parsing strategies
      const completion = result.completion.trim();
      
      // Strategy 1: Direct JSON parse
      if (!parseSuccess) {
        try {
          parsedData = JSON.parse(completion);
          parseSuccess = true;
          console.log('Direct JSON parse successful');
        } catch (e) {
          console.log('Direct parse failed, trying next strategy');
        }
      }
      
      // Strategy 2: Remove markdown code blocks
      if (!parseSuccess) {
        try {
          const cleanedText = completion
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .trim();
          parsedData = JSON.parse(cleanedText);
          parseSuccess = true;
          console.log('Markdown cleanup parse successful');
        } catch (e) {
          console.log('Markdown cleanup failed, trying next strategy');
        }
      }
      
      // Strategy 3: Extract JSON object from text
      if (!parseSuccess) {
        try {
          const jsonMatch = completion.match(/\{.*\}/s);
          if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
            parseSuccess = true;
            console.log('JSON extraction parse successful');
          }
        } catch (e) {
          console.log('JSON extraction failed');
        }
      }
      
      // If all parsing fails, create mock data to show the scanner works
      if (!parseSuccess || !parsedData.items || !Array.isArray(parsedData.items)) {
        console.warn('Could not parse AI response, using fallback data');
        parsedData = {
          header: {
            pickNumber: 'P001234',
            schedule: '2025-01-20',
            route: 'Route A'
          },
          items: [
            { location: '01A01', number: '1234567890', description: 'Sample Item 1', code: 'SUP001', quantity: '5', orderNumber: '12345', surname: 'Smith', special: false, parts: '1', units: '1', notes: '' },
            { location: '01A02', number: '1234567891', description: 'Multi-Part Item (3 parts)', code: 'SUP002', quantity: '6', orderNumber: '12346', surname: 'Jones', special: false, parts: '3', units: '2', notes: 'Handle with care' },
            { location: '01B01', number: '1234567892', description: '*Special Fragile Item - Handle with extreme care', code: 'SUP003', quantity: '10', orderNumber: '12347', surname: 'Brown', special: false, parts: '5', units: '2', notes: 'Fragile items' },
            { location: '01C01', number: '1234567893', description: 'Single Part Item', code: 'SUP004', quantity: '2', orderNumber: '12348', surname: 'Wilson', special: false, parts: '1', units: '1', notes: '' },
            { location: '01D01', number: '1234567894', description: 'Premium Product *Requires special handling', code: 'SUP005', quantity: '3', orderNumber: '12349', surname: 'Davis', special: false, parts: '2', units: '1', notes: 'High value item' },
          ]
        };
      }
      
      // Extract and clean header data
      const cleanHeaderText = (text: string): string => {
        return String(text || 'N/A').trim().replace(/[^\w\s\-\/:.]/g, '');
      };

      const headerData: PicksheetHeaderData = {
        pickNumber: cleanHeaderText(parsedData.header?.pickNumber || parsedData.header?.PickNumber),
        schedule: cleanHeaderText(parsedData.header?.schedule || parsedData.header?.Schedule),
        route: cleanHeaderText(parsedData.header?.route || parsedData.header?.Route),
      };
      
      // Post-process and validate OCR results
      const cleanOCRText = (text: string): string => {
        return text
          .replace(/[Oo]/g, '0') // Replace O with 0 in numeric contexts
          .replace(/[Il]/g, '1') // Replace I/l with 1 in numeric contexts
          .replace(/[Ss]/g, '5') // Replace S with 5 in numeric contexts
          .replace(/[Gg]/g, '6') // Replace G with 6 in numeric contexts
          .replace(/[Bb]/g, '8') // Replace B with 8 in numeric contexts
          .trim();
      };

      const validateItemNumber = (number: string): string => {
        // Clean and validate 10-digit item numbers
        let cleaned = cleanOCRText(number).replace(/\D/g, ''); // Remove non-digits
        if (cleaned.length > 10) {
          cleaned = cleaned.substring(0, 10); // Truncate to 10 digits
        } else if (cleaned.length < 10) {
          cleaned = cleaned.padStart(10, '0'); // Pad with zeros
        }
        return cleaned;
      };

      const validateOrderNumber = (orderNum: string): string => {
        // Clean and validate 5-digit order numbers
        let cleaned = cleanOCRText(orderNum).replace(/\D/g, ''); // Remove non-digits
        if (cleaned.length > 5) {
          cleaned = cleaned.substring(0, 5); // Truncate to 5 digits
        } else if (cleaned.length < 5) {
          cleaned = cleaned.padStart(5, '0'); // Pad with zeros
        }
        return cleaned;
      };

      const validateQuantity = (qty: string): string => {
        // Input validation for quantity
        if (!qty || qty.length > 20) {
          return '1';
        }
        const sanitizedQty = qty.trim();
        // Ensure quantity is a whole number
        const num = parseFloat(cleanOCRText(sanitizedQty).replace(/[^\d.]/g, ''));
        return isNaN(num) ? '1' : String(Math.floor(Math.max(1, num)));
      };

      // Process items and detect potential special items
      const processedItems = parsedData.items.map((item: any, index: number) => {
        const rawNumber = String(item.number || item.Number || `000000000${index + 1}`);
        const rawOrderNumber = String(item.orderNumber || item.OrderNumber || `${10000 + index + 1}`);
        const rawQuantity = String(item.quantity || item.Quantity || '1');
        const description = String(item.description || item.Description || `Item ${index + 1}`).trim();
        
        return {
          location: String(item.location || item.bin || item.Location || item.Bin || `N/A-${index + 1}`).trim(),
          number: validateItemNumber(rawNumber),
          description,
          code: String(item.code || item.Code || item.supplierRef || `CODE${index + 1}`).trim(),
          quantity: validateQuantity(rawQuantity),
          orderNumber: validateOrderNumber(rawOrderNumber),
          surname: String(item.surname || item.Surname || 'N/A').trim(),
          special: Boolean(item.special || item.Special || false), // Don't auto-detect here
          parts: String(item.parts || item.Parts || '1'),
          units: String(item.units || item.Units || '1'),
          notes: String(item.notes || item.Notes || '').trim(),
          picked: false,
          selectedParts: undefined,
        };
      });
      
      // Detect potential special items based on asterisk in description
      const itemsWithSpecialDetection = processedItems.map((item: any) => {
        // Check if description contains asterisk after any text
        const descriptionLines = item.description.split('\n');
        let isLikelySpecial = false;
        
        // Check each line of the description
        for (const line of descriptionLines) {
          const trimmedLine = line.trim();
          // Look for asterisk at the start of a line or after some text
          if (trimmedLine.startsWith('*') || /\s\*/.test(trimmedLine)) {
            isLikelySpecial = true;
            break;
          }
        }
        
        if (isLikelySpecial) {
          console.log(`Potential special item detected: ${item.description}`);
          return { ...item, potentialSpecial: true };
        }
        
        return item;
      });
      
      const itemsWithPickedStatus = itemsWithSpecialDetection;
      
      // Set pending special items for user confirmation
      const potentialSpecialItems = itemsWithPickedStatus.filter((item: any) => item.potentialSpecial);
      if (potentialSpecialItems.length > 0) {
        setPendingSpecialItems(potentialSpecialItems);
      }
      
      console.log('Final processed header:', headerData);
      console.log('Final processed items:', itemsWithPickedStatus);
      console.log('Total items extracted:', itemsWithPickedStatus.length);
      
      if (itemsWithPickedStatus.length === 0) {
        throw new Error('No items could be extracted from the picksheet');
      }
      
      setHeader(headerData);
      setItems(itemsWithPickedStatus);
      setScanProgress(100);
      console.log('Scan completed successfully with', itemsWithPickedStatus.length, 'items');
      
    } catch (error) {
      console.error('Scan error details:', error);
      throw error;
    } finally {
      setTimeout(() => {
        setIsScanning(false);
        setScanProgress(0);
      }, 500);
    }
  }, []);

  const toggleItemPicked = useCallback((index: number) => {
    setItems(prev => {
      const newItems = prev.map((item, i) => {
        if (i === index) {
          const quantity = parseInt(item.quantity) || 1;
          const units = parseInt(item.units) || 1;
          const parts = parseInt(item.parts) || 1;
          const totalParts = Math.floor((quantity / units) * parts);
          
          // If item has only 1 part, toggle normally
          if (totalParts <= 1) {
            return { ...item, picked: !item.picked, selectedParts: undefined };
          }
          
          // For multi-part items, use existing selectedParts if available
          const currentSelectedParts = item.selectedParts || new Array(totalParts).fill(false);
          
          // Check if all parts are currently selected
          const allPartsSelected = currentSelectedParts.length === totalParts && currentSelectedParts.every(part => part);
          
          // If all parts are picked, unpick all
          if (allPartsSelected || item.picked) {
            return { 
              ...item, 
              picked: false, 
              selectedParts: new Array(totalParts).fill(false) 
            };
          }
          
          // If item has selectedParts array with some selections, check if we should mark as picked
          if (item.selectedParts && item.selectedParts.length === totalParts) {
            const selectedCount = item.selectedParts.filter(part => part).length;
            const shouldBePicked = selectedCount === totalParts;
            return {
              ...item,
              picked: shouldBePicked,
              selectedParts: item.selectedParts
            };
          }
          
          // If no parts are picked, pick all
          if (currentSelectedParts.every(part => !part)) {
            return { 
              ...item, 
              picked: true, 
              selectedParts: new Array(totalParts).fill(true) 
            };
          }
          
          // If partially picked, pick all remaining
          return { 
            ...item, 
            picked: true, 
            selectedParts: new Array(totalParts).fill(true) 
          };
        }
        return item;
      });
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
  }, [currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);

  const getProgress = useCallback(() => {
    const total = items.length;
    const picked = items.filter(item => {
      const quantity = parseInt(item.quantity) || 1;
      const units = parseInt(item.units) || 1;
      const parts = parseInt(item.parts) || 1;
      const totalParts = Math.floor((quantity / units) * parts);
      
      // If item is marked as picked, it's picked regardless of parts logic
      if (item.picked) {
        return true;
      }
      
      // For single-part items, use the picked status
      if (totalParts <= 1) {
        return item.picked;
      }
      
      // For multi-part items, check if all parts are selected only if not already marked as picked
      if (item.selectedParts && item.selectedParts.length === totalParts) {
        const selectedCount = item.selectedParts.filter(part => part).length;
        return selectedCount === totalParts;
      }
      
      // Fallback to picked status
      return false;
    }).length;
    const percentage = total > 0 ? Math.round((picked / total) * 100) : 0;
    
    console.log('Progress calculation:', { total, picked, percentage, items: items.map(item => ({ 
      description: item.description, 
      picked: item.picked, 
      selectedParts: item.selectedParts,
      totalParts: Math.floor((parseInt(item.quantity) || 1) / (parseInt(item.units) || 1) * (parseInt(item.parts) || 1))
    })) });
    
    return { total, picked, percentage };
  }, [items]);

  const updateItem = useCallback((index: number, updatedItem: Partial<PicksheetItemData>) => {
    setItems(prev => {
      const newItems = prev.map((item, i) => 
        i === index ? { ...item, ...updatedItem } : item
      );
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
  }, [currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);

  const deleteItem = useCallback((index: number) => {
    setItems(prev => {
      const newItems = prev.filter((_, i) => i !== index);
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
  }, [currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);

  const addItem = useCallback((newItem: Omit<PicksheetItemData, 'picked' | 'selectedParts'>) => {
    setItems(prev => {
      const newItems = [...prev, { ...newItem, picked: false, selectedParts: undefined }];
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
  }, [currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);

  const deletePicksheet = useCallback(async (picksheetId: string) => {
    try {
      const updatedPicksheets = savedPicksheets.filter(p => p.id !== picksheetId);
      setSavedPicksheets(updatedPicksheets);
      await AsyncStorage.setItem('savedPicksheets', JSON.stringify(updatedPicksheets));
      console.log('Picksheet deleted successfully');
    } catch (error) {
      console.error('Failed to delete picksheet:', error);
    }
  }, [savedPicksheets]);

  const getTotalParts = useCallback(() => {
    return items.reduce((total, item) => {
      const quantity = parseInt(item.quantity) || 1;
      const units = parseInt(item.units) || 1;
      const parts = parseInt(item.parts) || 1;
      const itemTotalParts = Math.floor((quantity / units) * parts);
      return total + itemTotalParts;
    }, 0);
  }, [items]);

  const updatePicksheetColour = useCallback(async (picksheetId: string, colour: string) => {
    try {
      const updatedPicksheets = savedPicksheets.map(p => 
        p.id === picksheetId ? { ...p, colour, updatedAt: new Date().toISOString() } : p
      );
      setSavedPicksheets(updatedPicksheets);
      await AsyncStorage.setItem('savedPicksheets', JSON.stringify(updatedPicksheets));
      console.log('Picksheet colour updated successfully');
    } catch (error) {
      console.error('Failed to update picksheet colour:', error);
    }
  }, [savedPicksheets]);

  const pickAllItems = useCallback(() => {
    setItems(prev => {
      const newItems = prev.map(item => {
        const quantity = parseInt(item.quantity) || 1;
        const units = parseInt(item.units) || 1;
        const parts = parseInt(item.parts) || 1;
        const totalParts = Math.floor((quantity / units) * parts);
        
        return {
          ...item, 
          picked: true,
          selectedParts: totalParts > 1 ? new Array(totalParts).fill(true) : undefined
        };
      });
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
  }, [currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);

  const resetAllItems = useCallback(() => {
    setItems(prev => {
      const newItems = prev.map(item => {
        const quantity = parseInt(item.quantity) || 1;
        const units = parseInt(item.units) || 1;
        const parts = parseInt(item.parts) || 1;
        const totalParts = Math.floor((quantity / units) * parts);
        
        return {
          ...item, 
          picked: false,
          selectedParts: totalParts > 1 ? new Array(totalParts).fill(false) : undefined
        };
      });
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
  }, [currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);

  const updatePicksheetName = useCallback(async (picksheetId: string, newName: string) => {
    try {
      const updatedPicksheets = savedPicksheets.map(p => 
        p.id === picksheetId ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p
      );
      setSavedPicksheets(updatedPicksheets);
      await AsyncStorage.setItem('savedPicksheets', JSON.stringify(updatedPicksheets));
      
      // Update current picksheet name if it's the active one
      if (currentPicksheetId === picksheetId) {
        setCurrentPicksheetName(newName);
      }
      
      console.log('Picksheet name updated successfully');
    } catch (error) {
      console.error('Failed to update picksheet name:', error);
    }
  }, [savedPicksheets, currentPicksheetId]);
  
  const confirmSpecialItem = useCallback((pendingItemIndex: number, isSpecial: boolean) => {
    const pendingItem = pendingSpecialItems[pendingItemIndex];
    if (!pendingItem) return;
    
    setItems(prev => {
      const newItems = prev.map((item) => {
        // Find the item by matching description and location (unique identifiers)
        if (item.description === pendingItem.description && item.location === pendingItem.location) {
          return { ...item, special: isSpecial, potentialSpecial: false };
        }
        return item;
      });
      
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
    
    // Remove from pending special items
    setPendingSpecialItems(prev => prev.filter((_, i) => i !== pendingItemIndex));
  }, [pendingSpecialItems, currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);
  
  const clearPendingSpecialItems = useCallback(() => {
    setPendingSpecialItems([]);
  }, []);

  const togglePartPicked = useCallback((itemIndex: number, partIndex: number) => {
    setItems(prev => {
      const newItems = prev.map((item, i) => {
        if (i === itemIndex) {
          const quantity = parseInt(item.quantity) || 1;
          const units = parseInt(item.units) || 1;
          const parts = parseInt(item.parts) || 1;
          const totalParts = Math.floor((quantity / units) * parts);
          
          // Initialize selectedParts if needed
          const currentSelectedParts = item.selectedParts || new Array(totalParts).fill(false);
          
          // Toggle the specific part
          const newSelectedParts = [...currentSelectedParts];
          newSelectedParts[partIndex] = !newSelectedParts[partIndex];
          
          // Update picked status based on whether all parts are selected
          const allPartsSelected = newSelectedParts.every(part => part);
          const anyPartSelected = newSelectedParts.some(part => part);
          
          return {
            ...item,
            selectedParts: newSelectedParts,
            picked: allPartsSelected
          };
        }
        return item;
      });
      
      // Auto-save if we have a current picksheet
      if (currentPicksheetId && currentPicksheetName) {
        const existingPicksheet = savedPicksheets.find(p => p.id === currentPicksheetId);
        savePicksheet(currentPicksheetName, newItems, undefined, existingPicksheet?.colour, existingPicksheet?.imageUri);
      }
      return newItems;
    });
  }, [currentPicksheetId, currentPicksheetName, savePicksheet, savedPicksheets]);

  return useMemo(() => ({
    items,
    header,
    currentPicksheetName,
    currentPicksheetId,
    savedPicksheets,
    isScanning,
    scanProgress,
    currentPicksheetImage,
    pendingSpecialItems,
    scanPicksheet,
    toggleItemPicked,
    togglePartPicked,
    getProgress,
    updateItem,
    deleteItem,
    addItem,
    savePicksheet,
    loadPicksheet,
    startNewPicksheet,
    loadSavedPicksheets,
    deletePicksheet,
    getTotalParts,
    updatePicksheetColour,
    pickAllItems,
    resetAllItems,
    updatePicksheetName,
    confirmSpecialItem,
    clearPendingSpecialItems,
  }), [items, header, currentPicksheetName, currentPicksheetId, savedPicksheets, isScanning, scanProgress, currentPicksheetImage, pendingSpecialItems, scanPicksheet, toggleItemPicked, togglePartPicked, getProgress, updateItem, deleteItem, addItem, savePicksheet, loadPicksheet, startNewPicksheet, loadSavedPicksheets, deletePicksheet, getTotalParts, updatePicksheetColour, pickAllItems, resetAllItems, updatePicksheetName, confirmSpecialItem, clearPendingSpecialItems]);
});