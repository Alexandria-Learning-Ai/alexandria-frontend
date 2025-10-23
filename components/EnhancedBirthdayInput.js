import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    Modal,
    StyleSheet,
    Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Enhanced Birthday Input Component
 * Provides proper date validation, multiple format support, and user-friendly date picker
 */
const EnhancedBirthdayInput = ({
    value,
    onDateChange,
    style,
    required = true,
    minAge = 13,
    maxAge = 120,
    label = "Birth Date"
}) => {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(() => {
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() - 18);
        return defaultDate;
    });
    const [birthDateObject, setBirthDateObject] = useState(null);

    // Initialize date object from value
    useEffect(() => {
        if (value && !birthDateObject) {
            const parsedDate = parseBirthDate(value);
            if (parsedDate) {
                setBirthDateObject(parsedDate);
                setTempDate(parsedDate);
            }
        }
    }, [value]);

    // Enhanced birthday validation functions
    const validateBirthDateInput = (dateString) => {
        if (!dateString) {
            return { isValid: false, error: 'Please enter a birth date.' };
        }

        // Support multiple formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD (with or without leading zeros)
        const formats = [
            { regex: /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/, format: 'MM/DD/YYYY' },
            { regex: /^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(19|20)\d{2}$/, format: 'DD/MM/YYYY' },
            { regex: /^(19|20)\d{2}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/, format: 'YYYY-MM-DD' }
        ];

        for (const { regex, format } of formats) {
            if (regex.test(dateString)) {
                const date = parseBirthDate(dateString);
                if (date && !isNaN(date.getTime())) {
                    // Check if date is reasonable (not in future, not too old)
                    const today = new Date();
                    const age = calculateAge(date);

                    if (date > today) {
                        return { isValid: false, error: 'Birth date cannot be in the future.' };
                    }
                    if (age > maxAge) {
                        return { isValid: false, error: `Please enter a valid birth date (age cannot exceed ${maxAge}).` };
                    }
                    if (age < minAge) {
                        return { isValid: false, error: `You must be at least ${minAge} years old to use this service.` };
                    }

                    return { isValid: true, date, format, age };
                }
            }
        }

        return {
            isValid: false,
            error: 'Please enter a valid date in MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD format.'
        };
    };

    const parseBirthDate = (dateString) => {
        if (!dateString) return null;

        // Try MM/DD/YYYY format first (most common) - with or without leading zeros
        let match = dateString.match(/^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(19|20)\d{2}$/);
        if (match) {
            const [, month, day, year] = match;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            // Validate the date is actually valid (handles invalid dates like 02/31/2023)
            if (date.getFullYear() == year && date.getMonth() == month - 1 && date.getDate() == day) {
                return date;
            }
        }

        // Try DD/MM/YYYY format - with or without leading zeros
        match = dateString.match(/^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(19|20)\d{2}$/);
        if (match) {
            const [, day, month, year] = match;
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (date.getFullYear() == year && date.getMonth() == month - 1 && date.getDate() == day) {
                return date;
            }
        }

        // Try YYYY-MM-DD format - with or without leading zeros
        match = dateString.match(/^(19|20)\d{2}-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[01])$/);
        if (match) {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }

        return null;
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 0;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const formatBirthDateForDisplay = (date) => {
        if (!date) return '';
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    // Handle date picker
    const handleDatePickerChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (selectedDate) {
            setTempDate(selectedDate);
            const formattedDate = formatBirthDateForDisplay(selectedDate);
            setBirthDateObject(selectedDate);

            // Validate age
            const age = calculateAge(selectedDate);
            if (age < minAge) {
                Alert.alert('Age Requirement', `You must be at least ${minAge} years old to use this service.`);
                return;
            }
            if (age > maxAge) {
                Alert.alert('Invalid Age', 'Please enter a valid birth date.');
                return;
            }

            onDateChange?.(formattedDate, selectedDate);

            if (Platform.OS === 'ios') {
                // iOS will handle closing in the modal
            }
        }
    };

    const openDatePicker = () => {
        // Use existing date or a reasonable default for an 18-year-old
        const defaultDate = new Date();
        defaultDate.setFullYear(defaultDate.getFullYear() - 18);
        const currentDate = birthDateObject || defaultDate;
        setTempDate(currentDate);
        setShowDatePicker(true);

        // Prevent ScrollView from auto-scrolling when modal opens
        // This is handled by the parent component's configuration
    };

    const closeDatePicker = () => {
        setShowDatePicker(false);
    };

    const handleManualInput = () => {
        Alert.alert(
            'Enter Date Manually',
            'You can enter your birth date in these formats:\n• MM/DD/YYYY (e.g. 12/25/1995 or 1/5/2000)\n• DD/MM/YYYY (e.g. 25/12/1995 or 5/1/2000)\n• YYYY-MM-DD (e.g. 1995-12-25 or 2000-01-05)',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Enter Date',
                    onPress: () => {
                        Alert.prompt(
                            'Enter Birth Date',
                            'Enter your birth date:',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                    text: 'Validate',
                                    onPress: (text) => {
                                        const validation = validateBirthDateInput(text);
                                        if (validation.isValid) {
                                            const formattedDate = formatBirthDateForDisplay(validation.date);
                                            setBirthDateObject(validation.date);
                                            onDateChange?.(formattedDate, validation.date);
                                            Alert.alert(
                                                'Date Confirmed',
                                                `Birth date set to: ${formattedDate}\nAge: ${validation.age} years old`
                                            );
                                        } else {
                                            Alert.alert('Invalid Date', validation.error);
                                        }
                                    }
                                }
                            ],
                            'plain-text',
                            value || 'MM/DD/YYYY'
                        );
                    }
                }
            ]
        );
    };

    const currentAge = birthDateObject ? calculateAge(birthDateObject) : null;

    return (
        <View style={[styles.container, style]}>
            <Text style={styles.label}>
                {label} {required && <Text style={styles.required}>*</Text>}
            </Text>

            {/* Date Picker Button */}
            <TouchableOpacity
                style={[styles.datePickerButton, value ? styles.datePickerButtonFilled : null]}
                onPress={openDatePicker}
                activeOpacity={0.8}
            >
                <View style={styles.datePickerContent}>
                    <FontAwesome5
                        name="calendar-alt"
                        size={18}
                        color={value ? "#2D3748" : "#CBD5E0"}
                        style={styles.datePickerIcon}
                    />
                    <Text style={[styles.datePickerText, value ? styles.datePickerTextFilled : null]}>
                        {value || 'Select your birth date'}
                    </Text>
                    {value && currentAge && (
                        <View style={styles.ageContainer}>
                            <Text style={styles.ageDisplay}>
                                Age: {currentAge}
                            </Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {/* Manual Input Option */}
            <TouchableOpacity
                style={styles.manualInputToggle}
                onPress={handleManualInput}
            >
                <FontAwesome5 name="keyboard" size={12} color="#4A5568" />
                <Text style={styles.manualInputText}>Enter manually</Text>
            </TouchableOpacity>

            <Text style={styles.helperText}>
                {required ? 'Required for age verification and legal compliance' : 'Optional field'}
            </Text>

            {/* Date Picker Modal for iOS */}
            {Platform.OS === 'ios' && showDatePicker && (
                <Modal
                    transparent={true}
                    animationType="slide"
                    visible={showDatePicker}
                    onRequestClose={closeDatePicker}
                    statusBarTranslucent={false}
                    supportedOrientations={['portrait']}
                >
                    <View style={styles.datePickerModalOverlay}>
                        <View style={styles.datePickerModalContent}>
                            <View style={styles.datePickerHeader}>
                                <TouchableOpacity onPress={closeDatePicker}>
                                    <Text style={styles.datePickerCancel}>Cancel</Text>
                                </TouchableOpacity>
                                <Text style={styles.datePickerTitle}>Select Birth Date</Text>
                                <TouchableOpacity onPress={() => {
                                    const formattedDate = formatBirthDateForDisplay(tempDate);
                                    setBirthDateObject(tempDate);

                                    // Validate age before confirming
                                    const age = calculateAge(tempDate);
                                    if (age < minAge || age > maxAge) {
                                        Alert.alert('Invalid Age', age < minAge
                                            ? `You must be at least ${minAge} years old.`
                                            : 'Please enter a valid birth date.'
                                        );
                                        return;
                                    }

                                    onDateChange?.(formattedDate, tempDate);
                                    closeDatePicker();
                                }}>
                                    <Text style={styles.datePickerDone}>Done</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.datePickerContainer}>
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={(event, date) => {
                                        if (date) setTempDate(date);
                                    }}
                                    maximumDate={new Date()}
                                    minimumDate={new Date(1900, 0, 1)}
                                    style={{
                                        backgroundColor: '#FFFFFF',
                                        height: 200,
                                        width: '100%'
                                    }}
                                    textColor="#000000"
                                    accentColor="#4299E1"
                                />
                            </View>
                            {/* Age Preview */}
                            <View style={styles.agePreview}>
                                <Text style={styles.agePreviewText}>
                                    Age: {calculateAge(tempDate)} years old
                                </Text>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}

            {/* Date Picker for Android */}
            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="default"
                    onChange={handleDatePickerChange}
                    maximumDate={new Date()}
                    minimumDate={new Date(1900, 0, 1)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#F8F4E3',
        marginBottom: 8,
    },
    required: {
        color: '#E53E3E',
    },
    datePickerButton: {
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 16,
        backgroundColor: '#FFFFFF',
        minHeight: 56,
        justifyContent: 'center',
    },
    datePickerButtonFilled: {
        borderColor: '#4299E1',
        backgroundColor: '#EBF8FF',
    },
    datePickerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    datePickerIcon: {
        marginRight: 12,
    },
    datePickerText: {
        fontSize: 16,
        color: '#CBD5E0',
        flex: 1,
    },
    datePickerTextFilled: {
        color: '#2D3748',
        fontWeight: '500',
    },
    ageContainer: {
        backgroundColor: '#48BB78',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    ageDisplay: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    manualInputToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#F7FAFC',
        borderRadius: 8,
        alignSelf: 'flex-end',
    },
    manualInputText: {
        fontSize: 14,
        color: '#4A5568',
        marginLeft: 6,
        fontWeight: '500',
    },
    helperText: {
        fontSize: 12,
        color: '#718096',
        marginTop: 6,
        lineHeight: 16,
    },
    // Modal styles for iOS
    datePickerModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    datePickerModalContent: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 34, // Safe area
        minHeight: 350, // Ensure enough space for the picker
        paddingHorizontal: 0, // Remove horizontal padding to give picker full width
    },
    datePickerContainer: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 20,
        paddingHorizontal: 16,
        borderRadius: 12,
        overflow: 'hidden',
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    datePickerCancel: {
        fontSize: 16,
        color: '#E53E3E',
        fontWeight: '500',
    },
    datePickerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2D3748',
    },
    datePickerDone: {
        fontSize: 16,
        color: '#4299E1',
        fontWeight: '600',
    },
    agePreview: {
        alignItems: 'center',
        paddingVertical: 12,
        backgroundColor: '#F7FAFC',
    },
    agePreviewText: {
        fontSize: 14,
        color: '#4A5568',
        fontWeight: '500',
    },
});

export default EnhancedBirthdayInput;