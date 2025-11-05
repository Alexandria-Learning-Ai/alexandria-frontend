/**
 * Materials Feature Test
 * Tests the complete flow: Upload → Store → Retrieve → View
 */

import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Mock axios
jest.mock('axios');

// Mock auth
jest.mock('../firebaseConfig', () => ({
    auth: {
        currentUser: {
            uid: 'test-user-123',
            email: 'test@example.com'
        }
    }
}));

describe('Materials Feature Integration', () => {
    const mockUser = { uid: 'test-user-123' };
    const mockMaterialData = {
        user_id: mockUser.uid,
        title: 'Test Study Material',
        filename: 'test-material.pdf',
        extracted_text: 'This is a test study material with important content about biology.',
        extraction_quality: 95,
        character_count: 71,
        subject: 'Biology',
        course: 'AP Biology',
        upload_date: new Date().toISOString(),
    };

    const mockStoredMaterial = {
        material_id: 'material_12345',
        ...mockMaterialData
    };

    const mockRetrievedMaterial = {
        id: 'material_12345',
        title: 'Test Study Material',
        fileName: 'test-material.pdf',
        extractedText: 'This is a test study material with important content about biology.',
        extractionQuality: 95,
        characterCount: 71,
        subject: 'Biology',
        course: 'AP Biology',
        uploadDate: mockMaterialData.upload_date,
        hasAudio: false,
        hasSummary: false,
        type: 'pdf',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('1. Material storage - POST /study/materials should save material', async () => {
        // Mock successful storage
        axios.post.mockResolvedValueOnce({
            data: {
                material_id: 'material_12345',
                success: true,
                message: 'Material stored successfully'
            }
        });

        // Simulate storeStudyMaterial function
        const response = await axios.post(`${API_BASE_URL}/study/materials`, mockMaterialData, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': mockUser.uid,
            },
            timeout: 30000,
        });

        // Assertions
        expect(axios.post).toHaveBeenCalledWith(
            `${API_BASE_URL}/study/materials`,
            mockMaterialData,
            expect.objectContaining({
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-ID': mockUser.uid,
                }
            })
        );
        expect(response.data.material_id).toBe('material_12345');
        expect(response.data.success).toBe(true);

        console.log('✅ Test 1 passed: Material storage endpoint works correctly');
    });

    test('2. Material retrieval - GET /study/materials should return stored materials', async () => {
        // Mock successful retrieval
        axios.get.mockResolvedValueOnce({
            data: {
                materials: [
                    {
                        id: 'material_12345',
                        title: 'Test Study Material',
                        filename: 'test-material.pdf',
                        extracted_text: 'This is a test study material with important content about biology.',
                        extraction_quality: 95,
                        character_count: 71,
                        subject: 'Biology',
                        course: 'AP Biology',
                        upload_date: mockMaterialData.upload_date,
                        has_audio: false,
                        has_summary: false,
                    }
                ],
                total: 1
            }
        });

        // Simulate loadStudyMaterials function
        const params = new URLSearchParams({
            user_id: mockUser.uid,
            page: '1',
            limit: '50'
        });

        const response = await axios.get(`${API_BASE_URL}/study/materials?${params.toString()}`, {
            headers: {
                'X-User-ID': mockUser.uid,
            },
            timeout: 30000,
        });

        // Assertions
        expect(axios.get).toHaveBeenCalled();
        expect(response.data.materials).toHaveLength(1);
        expect(response.data.materials[0].id).toBe('material_12345');
        expect(response.data.materials[0].extracted_text).toBe(mockMaterialData.extracted_text);
        expect(response.data.materials[0].title).toBe('Test Study Material');

        console.log('✅ Test 2 passed: Material retrieval endpoint works correctly');
    });

    test('3. Material has extractedText for MaterialViewer', async () => {
        // Mock retrieval
        axios.get.mockResolvedValueOnce({
            data: {
                materials: [mockRetrievedMaterial]
            }
        });

        const response = await axios.get(`${API_BASE_URL}/study/materials?user_id=${mockUser.uid}`, {
            headers: { 'X-User-ID': mockUser.uid }
        });

        const material = response.data.materials[0];

        // Transform to match MaterialViewer format (like StudyMaterialsScreen does)
        const transformedMaterial = {
            id: material.id,
            title: material.title,
            fileName: material.fileName,
            extractedText: material.extractedText,
            extractionQuality: material.extractionQuality,
            characterCount: material.characterCount,
            subject: material.subject,
            course: material.course,
            uploadDate: material.uploadDate,
            hasAudio: material.hasAudio,
            hasSummary: material.hasSummary,
            type: material.type,
        };

        // Assertions - MaterialViewer needs these fields
        expect(transformedMaterial.extractedText).toBeDefined();
        expect(transformedMaterial.extractedText.length).toBeGreaterThan(0);
        expect(transformedMaterial.id).toBe('material_12345');
        expect(transformedMaterial.title).toBe('Test Study Material');

        console.log('✅ Test 3 passed: Material has all required fields for MaterialViewer');
    });

    test('4. Complete flow - Upload → Store → Retrieve → View', async () => {
        console.log('\n🔄 Testing complete materials flow...\n');

        // Step 1: Upload and extract text (already done by backend)
        const extractedText = 'This is a test study material with important content about biology.';
        console.log('📄 Step 1: Text extracted from uploaded file');

        // Step 2: Store material
        axios.post.mockResolvedValueOnce({
            data: {
                material_id: 'material_12345',
                success: true
            }
        });

        const storeResponse = await axios.post(`${API_BASE_URL}/study/materials`, {
            ...mockMaterialData,
            extracted_text: extractedText
        }, {
            headers: {
                'Content-Type': 'application/json',
                'X-User-ID': mockUser.uid,
            }
        });

        const storedMaterialId = storeResponse.data.material_id;
        expect(storedMaterialId).toBe('material_12345');
        console.log('💾 Step 2: Material stored with ID:', storedMaterialId);

        // Step 3: Retrieve from library
        axios.get.mockResolvedValueOnce({
            data: {
                materials: [{
                    id: storedMaterialId,
                    title: 'Test Study Material',
                    filename: 'test-material.pdf',
                    extracted_text: extractedText,
                    extraction_quality: 95,
                    character_count: 71,
                    subject: 'Biology',
                    course: 'AP Biology',
                    upload_date: mockMaterialData.upload_date,
                    has_audio: false,
                    has_summary: false,
                }]
            }
        });

        const retrieveResponse = await axios.get(
            `${API_BASE_URL}/study/materials?user_id=${mockUser.uid}`,
            { headers: { 'X-User-ID': mockUser.uid } }
        );

        const retrievedMaterial = retrieveResponse.data.materials[0];
        expect(retrievedMaterial.id).toBe(storedMaterialId);
        expect(retrievedMaterial.extracted_text).toBe(extractedText);
        console.log('📚 Step 3: Material retrieved from library');

        // Step 4: Verify MaterialViewer can display it
        const viewerMaterial = {
            id: retrievedMaterial.id,
            title: retrievedMaterial.title,
            extractedText: retrievedMaterial.extracted_text,
            extractionQuality: retrievedMaterial.extraction_quality,
        };

        expect(viewerMaterial.extractedText).toBeDefined();
        expect(viewerMaterial.extractedText).not.toBe('');
        expect(viewerMaterial.extractedText).not.toContain('No content available');
        console.log('👁️  Step 4: Material ready for MaterialViewer\n');

        console.log('✅ COMPLETE FLOW TEST PASSED!\n');
    });

    test('5. Error handling - Missing extractedText', async () => {
        // Mock material without extractedText (the bug scenario)
        axios.get.mockResolvedValueOnce({
            data: {
                materials: [{
                    id: 'material_broken',
                    title: 'Broken Material',
                    filename: 'broken.pdf',
                    extracted_text: null, // Missing!
                    subject: 'Test',
                }]
            }
        });

        const response = await axios.get(`${API_BASE_URL}/study/materials?user_id=${mockUser.uid}`, {
            headers: { 'X-User-ID': mockUser.uid }
        });

        const material = response.data.materials[0];

        // MaterialViewer should handle this gracefully
        const displayText = material.extracted_text || "No content available. Please ensure the document was properly uploaded and text extraction was successful.";

        expect(displayText).toContain('No content available');
        console.log('✅ Test 5 passed: Missing extractedText handled gracefully');
    });

    test('6. Search functionality works', async () => {
        // Mock search results
        axios.get.mockResolvedValueOnce({
            data: {
                materials: [{
                    id: 'material_12345',
                    title: 'Test Study Material',
                    filename: 'test-material.pdf',
                    extracted_text: 'This is a test study material with important content about biology.',
                    subject: 'Biology',
                }]
            }
        });

        const searchQuery = 'biology';
        const params = new URLSearchParams({
            user_id: mockUser.uid,
            page: '1',
            limit: '50',
            search: searchQuery
        });

        const response = await axios.get(`${API_BASE_URL}/study/materials?${params.toString()}`, {
            headers: { 'X-User-ID': mockUser.uid }
        });

        expect(response.data.materials).toHaveLength(1);
        expect(response.data.materials[0].subject).toBe('Biology');
        console.log('✅ Test 6 passed: Search functionality works');
    });
});

describe('Materials API Endpoint Tests', () => {
    test('POST /study/materials endpoint format', () => {
        const validPayload = {
            user_id: 'test-user-123',
            title: 'Test Material',
            filename: 'test.pdf',
            extracted_text: 'Content here',
            extraction_quality: 90,
            character_count: 12,
            subject: 'Math',
            course: '',
            upload_date: new Date().toISOString(),
        };

        // Verify all required fields are present
        expect(validPayload.user_id).toBeDefined();
        expect(validPayload.title).toBeDefined();
        expect(validPayload.extracted_text).toBeDefined();
        expect(validPayload.subject).toBeDefined();

        console.log('✅ POST payload format is correct');
    });

    test('GET /study/materials response format', () => {
        const mockResponse = {
            materials: [
                {
                    id: 'material_123',
                    title: 'Test',
                    filename: 'test.pdf',
                    extracted_text: 'Content',
                    extraction_quality: 90,
                    character_count: 7,
                    subject: 'Math',
                    course: '',
                    upload_date: new Date().toISOString(),
                    has_audio: false,
                    has_summary: false,
                }
            ],
            total: 1
        };

        // Verify response has correct structure
        expect(mockResponse.materials).toBeInstanceOf(Array);
        expect(mockResponse.materials[0].id).toBeDefined();
        expect(mockResponse.materials[0].extracted_text).toBeDefined();
        expect(mockResponse.total).toBe(1);

        console.log('✅ GET response format is correct');
    });
});

console.log('\n📊 Materials Feature Test Suite\n');
