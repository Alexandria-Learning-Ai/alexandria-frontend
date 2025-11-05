import { useState, useCallback } from 'react';
import { Vibration } from 'react-native';
import { StudentProfileService } from '../services/StudentProfileService';
import logger from '../utils/logger';

interface SubjectValidation {
    valid: boolean;
    message: string;
    suggestions: string[];
}

export const useSubjectValidation = () => {
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [subjectValidation, setSubjectValidation] = useState<SubjectValidation | null>(null);
    const [validatingSubject, setValidatingSubject] = useState(false);

    /**
     * Validate subject/course when user types or selects custom subjects
     */
    const validateSubject = useCallback(async (subjectText: string) => {
        if (!subjectText.trim()) {
            setSubjectValidation(null);
            return;
        }

        setValidatingSubject(true);
        try {
            const validation = await StudentProfileService.validateCourse(subjectText.trim());
            setSubjectValidation(validation);
            logger.info('📚 Upload screen - Subject validation result:', validation);
        } catch (error) {
            logger.error('❌ Error validating subject on Upload screen:', error);
            setSubjectValidation({
                valid: false,
                message: 'Unable to validate subject. Please try again.',
                suggestions: []
            });
        } finally {
            setValidatingSubject(false);
        }
    }, []);

    /**
     * Handle subject selection
     */
    const handleSubjectSelect = useCallback((subjectData: any) => {
        setSelectedSubject(subjectData);
        logger.info('📚 Document subject selected:', subjectData);

        // Validate custom subjects for better data quality
        if (subjectData.type === 'custom' || subjectData.type === 'guest') {
            validateSubject(subjectData.name);
        } else {
            setSubjectValidation(null); // Clear validation for known subjects
        }

        Vibration.vibrate(50);
    }, [validateSubject]);

    /**
     * Clear selected subject
     */
    const clearSelectedSubject = useCallback(() => {
        setSelectedSubject(null);
        setSubjectValidation(null); // Also clear validation
        Vibration.vibrate(30);
    }, []);

    return {
        selectedSubject,
        setSelectedSubject,
        subjectValidation,
        validatingSubject,
        validateSubject,
        handleSubjectSelect,
        clearSelectedSubject
    };
};
