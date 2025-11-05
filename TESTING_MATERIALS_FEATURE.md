# 📚 Testing Guide - Materials Feature

## What We Fixed
✅ Materials now properly save to the backend database
✅ Materials persist and can be accessed later from the library
✅ MaterialViewer properly displays content with text extraction

---

## 🧪 Test Plan

### **Test 1: Upload a Study Material (NEW UPLOAD)**

**Steps:**
1. Launch the Alexandria app
2. From HomeScreen, tap **"Upload Materials"** or navigate to UploadScreen
3. **Important:** Select **"Study Mode"** (NOT Quiz Mode)
4. Tap **"Choose File"** and select a PDF or text document
   - Use a PDF with readable text (not image-based)
   - Or use a .txt file
5. Select a subject (e.g., "Biology", "Mathematics")
6. Tap **"Upload"**

**Expected Results:**
- ✅ Progress bar shows file uploading
- ✅ Text extraction happens automatically
- ✅ You see: "Study Material Added!" alert
- ✅ Material opens in MaterialViewer with readable content
- ✅ You can read the extracted text

**If it fails:**
- Check logs for: `📚 Material stored with ID: material_...`
- Check backend API is running at: `https://alexandria-api-ywcw.onrender.com`

---

### **Test 2: View Material from Library (PERSISTENCE TEST)**

**Steps:**
1. After uploading (from Test 1), tap **Back** to return to HomeScreen
2. Navigate to **"Study Materials"** or **"Materials Library"**
3. You should see your uploaded document in the list
4. Tap on the material to open it

**Expected Results:**
- ✅ Material appears in the library list
- ✅ Shows: Title, subject, upload date, character count
- ✅ Tapping opens MaterialViewer
- ✅ **CRITICAL:** Content is displayed (not "No content available")
- ✅ You can read the full text that was extracted

**If it fails:**
- Material not in list → Backend didn't save it (check API endpoint)
- Material shows but no content → `extractedText` field is missing from API response
- Check browser DevTools Network tab for API calls

---

### **Test 3: Material Viewer Features**

**Steps:**
1. With a material open in MaterialViewer
2. Try these features:

**Reading Mode:**
- ✅ Text is displayed clearly
- ✅ Can scroll through content
- ✅ Font size controls work (+/- buttons)

**Summary Mode:**
- Tap **"Summary"** button
- ✅ Shows loading indicator
- ✅ Generates AI summary of content
- ✅ Can switch between "Brief", "Comprehensive", "Key Points"

**Audio Mode (Listen):**
- Tap **"Listen"** or 🔊 button
- ✅ Shows loading: "Generating audio..."
- ✅ Audio player appears
- ✅ Can play/pause audio narration

**Expected Results:**
- All modes work without crashing
- Content persists across mode switches
- No "No content available" errors

---

### **Test 4: Search & Filter Materials**

**Steps:**
1. Navigate to Study Materials screen
2. Upload several documents (different subjects)
3. Use the search bar to search by:
   - Title
   - Subject
   - Content keywords

**Expected Results:**
- ✅ Search filters the list correctly
- ✅ Can filter by subject
- ✅ All materials remain accessible

---

### **Test 5: Persistence Across App Restarts**

**Steps:**
1. Upload a study material
2. Close the app completely (swipe up from task manager)
3. Reopen the app
4. Navigate to Study Materials

**Expected Results:**
- ✅ **CRITICAL:** Uploaded materials are still there
- ✅ Can open and view content
- ✅ No data loss

**This is the main bug we fixed!**

---

## 🐛 Common Issues & Solutions

### Issue 1: "No content available" in MaterialViewer
**Cause:** Backend not returning `extracted_text` field
**Fix:** Check API response format at `/study/materials` endpoint

### Issue 2: Material uploads but doesn't appear in library
**Cause:** Frontend calling wrong endpoint
**Fix:** Should POST to `/study/materials` (not `/study/extract-text`)

### Issue 3: Material appears but shows as 0 characters
**Cause:** Text extraction failed
**Fix:** Use a PDF with selectable text (not scanned images)

---

## 📊 Success Criteria

All tests pass if:
- ✅ Can upload materials in Study Mode
- ✅ Materials save to backend database
- ✅ Materials appear in library after upload
- ✅ Materials persist after closing/reopening app
- ✅ MaterialViewer displays extracted text
- ✅ Can switch between Read/Summary/Listen modes
- ✅ No "Property 'extractedText' doesn't exist" errors
- ✅ Search and filter work correctly

---

## 🔍 Debugging Tips

### Check Backend API:
```bash
# Test if materials endpoint exists
curl https://alexandria-api-ywcw.onrender.com/study/materials?user_id=test

# Should return: { "materials": [...] }
```

### Check Logs:
Look for these messages in console:
- ✅ `📚 Material stored with ID: material_12345`
- ✅ `📚 Loaded X study materials from API`
- ✅ `📖 MaterialViewer received material: ...`

### Check AsyncStorage (if using Expo Go):
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// In a test component:
AsyncStorage.getAllKeys().then(keys => console.log('All keys:', keys));
```

---

## 📝 Test Report Template

After testing, report results:

```
Test 1 - Upload Material: ✅ PASS / ❌ FAIL
  - File uploaded: ___________
  - Text extracted: ___________
  - Material ID: ___________

Test 2 - Library Persistence: ✅ PASS / ❌ FAIL
  - Material appears in list: ___________
  - Content displays: ___________
  - Character count: ___________

Test 3 - Viewer Features: ✅ PASS / ❌ FAIL
  - Read mode: ___________
  - Summary mode: ___________
  - Audio mode: ___________

Test 4 - Search/Filter: ✅ PASS / ❌ FAIL
  - Search works: ___________
  - Filter works: ___________

Test 5 - App Restart: ✅ PASS / ❌ FAIL
  - Materials persist: ___________
  - Content accessible: ___________
```

---

## ✅ What Was Fixed

**Before (BUG):**
- Materials worked immediately after upload ✅
- But disappeared after navigating away ❌
- Backend storage was broken ❌
- No content available error in MaterialViewer ❌

**After (FIXED):**
- Materials work immediately after upload ✅
- Materials save to backend database ✅
- Materials persist in library ✅
- Can access materials anytime ✅
- Content displays correctly ✅
- Text extraction works properly ✅

**Key Changes:**
1. ✅ **Fixed endpoint routing**: Study Mode now calls `/study/extract-text` (not `/upload`)
2. ✅ **Backend extracts and stores**: `/study/extract-text` endpoint handles both text extraction AND database storage
3. ✅ **Returns material_id**: Backend generates UUID and returns it to frontend
4. ✅ **Proper text extraction**: Uses PyMuPDF, Tesseract OCR, and enhanced PDF processing
5. ✅ **StudyMaterialsScreen retrieves**: Correctly fetches from `/study/materials` endpoint
6. ✅ **MaterialViewer displays**: Receives full `extracted_text` field from API

---

## 🚀 Next Steps After Testing

If tests pass:
1. ✅ Feature is production-ready
2. Consider adding:
   - Offline mode support
   - Material sharing between users
   - Flashcard generation from materials
   - Quiz generation from materials

If tests fail:
1. Check which test failed
2. Review error logs
3. Verify backend API is running
4. Check network connectivity
5. Report specific error messages

---

**Happy Testing! 🎉**
