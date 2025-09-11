import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../firebaseConfig';
import { API_BASE_URL } from '../config/api';
import NetInfo from '@react-native-community/netinfo';
import logger from '../utils/logger';


export class StudentProfileService {
    static PROFILE_KEY = 'student_profile_';
    static SYNC_QUEUE_KEY = 'profile_sync_queue';
    
    // Transform frontend profile data to backend format
    static transformProfileForBackend(profileData) {
        const transformed = {
            name: profileData.firstName && profileData.lastName 
                ? `${profileData.firstName} ${profileData.lastName}` 
                : (profileData.fullName || ''),
            education_level: profileData.educationLevel,
            program: profileData.program,
            learning_styles: Array.isArray(profileData.learningStyles) ? profileData.learningStyles : [],
            pain_points: Array.isArray(profileData.painPoints) ? profileData.painPoints : [],
            courses: this.transformCourses(profileData.courses),
            notes: profileData.notes || ""
        };

        // Handle year - convert to integer if string
        if (profileData.year) {
            const yearMatch = profileData.year.toString().match(/\d+/);
            transformed.year = yearMatch ? parseInt(yearMatch[0], 10) : null;
        }

        // Handle semester
        if (profileData.semester) {
            transformed.semester = profileData.semester.toString().toLowerCase();
        }

        // Parse semester into structured fields
        if (transformed.semester) {
            const semesterParts = this.parseSemester(transformed.semester);
            transformed.semester_season = semesterParts.season;
            transformed.semester_year = semesterParts.year;
        }

        // Handle study goals - allow any education-related text
        transformed.study_goals = this.processStudyGoals(profileData.studyGoals);

        logger.info('Transformed profile for backend:', JSON.stringify(transformed, null, 2));
        return transformed;
    }

    // Transform courses array for backend with robust input sanitization
    static transformCourses(courses) {
        if (!Array.isArray(courses)) return [];
        
        return courses.map(course => {
            // Multi-layer course name processing
            let courseName = course.name || course.code || 'Unnamed Course';
            
            // Layer 1: Input sanitization
            courseName = this.sanitizeCourseName(courseName);
            
            // Layer 2: Rule-based normalization
            const ruleNormalized = this.normalizeCourse(courseName);
            
            // Layer 3: AI-powered normalization (fallback for complex cases)
            const finalCourseName = ruleNormalized !== this.titleCase(courseName) 
                ? ruleNormalized  // Rule-based worked, use it
                : this.aiNormalizeCourse(courseName);  // Use AI for complex cases
            
            return {
                id: course.id || Date.now().toString(),
                name: finalCourseName,
                code: this.sanitizeCourseCode(course.code || ''),
                instructor: course.instructor || null,
                credits: course.credits ? parseFloat(course.credits) : null,
                validated: Boolean(course.validated),
                created_at: course.createdAt || course.created_at || new Date().toISOString()
            };
        });
    }

    // Sanitize course name to prevent processing issues
    static sanitizeCourseName(name) {
        if (!name || typeof name !== 'string') return 'Unnamed Course';
        
        return name
            .trim()
            .replace(/[^\w\s\-&().]/g, '') // Remove special chars except common ones
            .replace(/\s+/g, ' ')         // Normalize whitespace
            .slice(0, 200);               // Limit length
    }

    // Sanitize course code
    static sanitizeCourseCode(code) {
        if (!code || typeof code !== 'string') return '';
        
        return code
            .trim()
            .replace(/[^\w\-]/g, '')      // Only alphanumeric and hyphens
            .toUpperCase()                // Standardize to uppercase
            .slice(0, 20);                // Limit length
    }

    // Normalize course name to standard format
    static normalizeCourse(courseName) {
        if (!courseName || typeof courseName !== 'string') return courseName;
        
        const normalized = courseName.trim().toLowerCase();
        
        // Common course name mappings
        const courseMap = {
            // Object-Oriented Programming variations
            'object oriented programming': 'Object Oriented Programming',
            'oop': 'Object Oriented Programming',
            'object-oriented programming': 'Object Oriented Programming',
            'objectoriented programming': 'Object Oriented Programming',
            'object oriented': 'Object Oriented Programming',
            
            // Data Structures variations  
            'data structures': 'Data Structures',
            'datastructures': 'Data Structures',
            'data structure': 'Data Structures',
            
            // Database variations
            'database': 'Database Systems',
            'databases': 'Database Systems', 
            'db systems': 'Database Systems',
            'database management': 'Database Systems',
            
            // Calculus variations
            'calc 1': 'Calculus I',
            'calc i': 'Calculus I',
            'calculus 1': 'Calculus I',
            'calculus one': 'Calculus I',
            'calc 2': 'Calculus II',
            'calc ii': 'Calculus II',
            'calculus 2': 'Calculus II',
            
            // Programming language courses
            'java': 'Java Programming',
            'python': 'Python Programming',
            'javascript': 'JavaScript Programming',
            'js': 'JavaScript Programming',
            'c++': 'C++ Programming',
            'c programming': 'C Programming',
            
            // Web development variations
            'web dev': 'Web Development',
            'web development': 'Web Development',
            'web programming': 'Web Development',
            
            // AI/ML variations
            'ai': 'Artificial Intelligence',
            'artificial intelligence': 'Artificial Intelligence',
            'ml': 'Machine Learning',
            'machine learning': 'Machine Learning',
            
            // Other common variations
            'comp sci': 'Computer Science',
            'computer science': 'Computer Science',
            'cs': 'Computer Science',
            'software eng': 'Software Engineering',
            'software engineering': 'Software Engineering'
        };
        
        return courseMap[normalized] || this.titleCase(courseName);
    }

    // Convert string to title case
    static titleCase(str) {
        if (!str) return str;
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    }

    // AI-powered course normalization for complex cases
    static aiNormalizeCourse(courseName) {
        if (!courseName || typeof courseName !== 'string') return courseName;
        
        const input = courseName.trim().toLowerCase();
        
        // Step 1: Subject area detection
        const subjectArea = this.detectSubjectArea(input);
        
        // Step 2: Course level detection
        const level = this.detectCourseLevel(input);
        
        // Step 3: Intelligent pattern matching
        const normalized = this.intelligentPatternMatch(input, subjectArea, level);
        
        return normalized || this.titleCase(courseName);
    }

    // Detect subject area using AI-like pattern matching
    static detectSubjectArea(input) {
        const patterns = {
            computer_science: [
                'comput', 'program', 'software', 'algorithm', 'data struct', 
                'oop', 'object', 'web', 'mobile', 'app', 'coding', 'dev',
                'javascript', 'python', 'java', 'c++', 'html', 'css',
                'database', 'sql', 'api', 'framework', 'frontend', 'backend'
            ],
            mathematics: [
                'math', 'calc', 'algebra', 'geometry', 'trig', 'stat',
                'discrete', 'linear', 'differential', 'integral', 'matrix',
                'number theory', 'logic', 'proof'
            ],
            science: [
                'bio', 'chem', 'phys', 'science', 'lab', 'experiment',
                'molecular', 'organic', 'quantum', 'mechanics', 'genetics'
            ],
            business: [
                'business', 'management', 'marketing', 'finance', 'accounting',
                'economics', 'entrepreneurship', 'strategy', 'operations'
            ],
            engineering: [
                'engineer', 'design', 'mechanical', 'electrical', 'civil',
                'chemical', 'systems', 'circuit', 'structural'
            ],
            liberal_arts: [
                'english', 'literature', 'writing', 'history', 'philosophy',
                'art', 'music', 'language', 'culture', 'sociology', 'psychology'
            ],
            health_sciences: [
                'anatomy', 'physiology', 'medical', 'health', 'nursing', 
                'medicine', 'biology', 'biochemistry', 'pharmacology'
            ],
            education: [
                'education', 'teaching', 'pedagogy', 'curriculum', 'learning theory',
                'child development', 'educational psychology'
            ],
            middle_school: [
                '6th grade', '7th grade', '8th grade', 'middle school',
                'junior high', 'grade 6', 'grade 7', 'grade 8'
            ],
            high_school: [
                '9th grade', '10th grade', '11th grade', '12th grade',
                'freshman', 'sophomore', 'junior', 'senior', 'high school',
                'grade 9', 'grade 10', 'grade 11', 'grade 12'
            ]
        };

        for (const [area, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => input.includes(keyword))) {
                return area;
            }
        }

        return 'general';
    }

    // Detect course level across all education levels
    static detectCourseLevel(input) {
        // Graduate/Masters level
        if (input.match(/graduate|masters|mba|phd|doctorate|advanced|700|800|900/i)) {
            return 'graduate';
        }
        
        // High School level  
        if (input.match(/high school|9th grade|10th grade|11th grade|12th grade|freshman|sophomore|junior|senior|ap\s/i)) {
            return 'high_school';
        }
        
        // Middle School level
        if (input.match(/middle school|6th grade|7th grade|8th grade|grade [678]|junior high/i)) {
            return 'middle_school';
        }
        
        // College/University levels
        if (input.match(/advanced|senior|400|500/i)) {
            return 'advanced';
        }
        if (input.match(/intro|introduction|fundamentals|basics|101|100/i)) {
            return 'intro';
        }
        if (input.match(/intermediate|200|300/i)) {
            return 'intermediate';
        }
        
        // Level indicators by Roman numerals and numbers
        if (input.match(/\bi{1,3}\b|\bii\b|\biii\b|\biv\b|one|two|three|four/i)) {
            return 'intermediate';
        }
        
        return 'general';
    }

    // Intelligent pattern matching based on subject area and level
    static intelligentPatternMatch(input, subjectArea, level) {
        const patterns = {
            computer_science: {
                intro: {
                    'intro.*comput|comput.*intro|cs.*101|comput.*science.*intro': 'Introduction to Computer Science',
                    'intro.*program|program.*intro|program.*fund': 'Programming Fundamentals',
                    'web.*intro|intro.*web|web.*basics': 'Introduction to Web Development'
                },
                intermediate: {
                    'object.*orient|oop|object.*program': 'Object Oriented Programming',
                    'data.*struct|struct.*data': 'Data Structures and Algorithms',
                    'database|db.*system|data.*manage': 'Database Management Systems',
                    'web.*dev|web.*program': 'Web Development',
                    'mobile.*dev|app.*dev': 'Mobile Application Development'
                },
                advanced: {
                    'machine.*learn|ml|artificial.*intel|ai': 'Machine Learning',
                    'software.*eng|software.*design': 'Software Engineering',
                    'computer.*network|network.*program': 'Computer Networks',
                    'cyber.*security|info.*security': 'Cybersecurity'
                }
            },
            mathematics: {
                intro: {
                    'college.*algebra|algebra.*college': 'College Algebra',
                    'precalc|pre.*calc': 'Precalculus',
                    'intro.*math|math.*intro': 'Introduction to Mathematics'
                },
                intermediate: {
                    'calc.*1|calculus.*i|calculus.*one': 'Calculus I',
                    'calc.*2|calculus.*ii|calculus.*two': 'Calculus II',
                    'calc.*3|calculus.*iii|calculus.*three': 'Calculus III',
                    'linear.*algebra|matrix.*algebra': 'Linear Algebra',
                    'discrete.*math|discrete.*mathematics': 'Discrete Mathematics',
                    'statistics|stats|statistical': 'Statistics'
                },
                advanced: {
                    'differential.*equations|diff.*eq': 'Differential Equations',
                    'real.*analysis|mathematical.*analysis': 'Real Analysis',
                    'abstract.*algebra': 'Abstract Algebra'
                }
            },
            business: {
                intro: {
                    'intro.*business|business.*intro': 'Introduction to Business',
                    'business.*admin|admin.*business': 'Business Administration',
                    'intro.*economics|econ.*intro': 'Introduction to Economics'
                },
                intermediate: {
                    'microecon|micro.*economics': 'Microeconomics',
                    'macroecon|macro.*economics': 'Macroeconomics',
                    'marketing|market.*strategy': 'Marketing',
                    'finance|financial.*management': 'Finance',
                    'accounting|financial.*accounting': 'Accounting'
                }
            },
            health_sciences: {
                intro: {
                    'anatomy.*intro|intro.*anatomy': 'Introduction to Anatomy',
                    'health.*science|health.*intro': 'Introduction to Health Sciences',
                    'medical.*terminology': 'Medical Terminology'
                },
                intermediate: {
                    'anatomy.*physiology|a&p': 'Anatomy and Physiology',
                    'microbiology|micro.*biology': 'Microbiology',
                    'pharmacology|drug.*therapy': 'Pharmacology'
                },
                advanced: {
                    'pathophysiology|disease.*process': 'Pathophysiology',
                    'clinical.*practice': 'Clinical Practice'
                }
            },
            education: {
                graduate: {
                    'educational.*psychology': 'Educational Psychology',
                    'curriculum.*development|curriculum.*design': 'Curriculum Development',
                    'research.*methods.*education': 'Educational Research Methods'
                }
            },
            liberal_arts: {
                intro: {
                    'intro.*psychology|psych.*101|general.*psychology': 'General Psychology',
                    'intro.*sociology|sociology.*101': 'Introduction to Sociology',
                    'world.*history|global.*history': 'World History'
                },
                intermediate: {
                    'american.*literature|us.*literature': 'American Literature',
                    'developmental.*psychology': 'Developmental Psychology',
                    'abnormal.*psychology': 'Abnormal Psychology',
                    'social.*psychology': 'Social Psychology',
                    'american.*history|us.*history': 'U.S. History'
                },
                high_school: {
                    'english.*9|9th.*english|freshman.*english': 'English 9',
                    'english.*10|10th.*english|sophomore.*english': 'English 10',
                    'english.*11|11th.*english|junior.*english': 'English 11',
                    'english.*12|12th.*english|senior.*english': 'English 12',
                    'ap.*english.*language|ap.*lang': 'AP English Language',
                    'ap.*english.*literature|ap.*lit': 'AP English Literature',
                    'world.*history|global.*history': 'World History',
                    'us.*history|american.*history': 'U.S. History',
                    'government|civics|gov': 'Government/Civics',
                    'ap.*us.*history|apush': 'AP U.S. History'
                },
                middle_school: {
                    '6th.*english|english.*6|grade.*6.*english': '6th Grade English',
                    '7th.*english|english.*7|grade.*7.*english': '7th Grade English', 
                    '8th.*english|english.*8|grade.*8.*english': '8th Grade English',
                    '6th.*social|social.*6|grade.*6.*social': '6th Grade Social Studies',
                    '7th.*social|social.*7|grade.*7.*social': '7th Grade Social Studies',
                    '8th.*social|social.*8|grade.*8.*social': '8th Grade Social Studies'
                }
            },
            science: {
                high_school: {
                    'earth.*science|geology': 'Earth Science',
                    'biology|bio|life.*science': 'Biology',
                    'chemistry|chem': 'Chemistry',
                    'physics|physical.*science': 'Physics',
                    'ap.*biology|ap.*bio': 'AP Biology',
                    'ap.*chemistry|ap.*chem': 'AP Chemistry',
                    'ap.*physics': 'AP Physics 1'
                },
                middle_school: {
                    '6th.*science|science.*6|grade.*6.*science': '6th Grade Science',
                    '7th.*science|science.*7|grade.*7.*science': '7th Grade Science',
                    '8th.*science|science.*8|grade.*8.*science': '8th Grade Science'
                }
            },
            mathematics: {
                high_school: {
                    'pre.*algebra|prealgebra': 'Pre-Algebra',
                    'algebra.*2|algebra.*ii': 'Algebra II',
                    'geometry|shapes': 'Geometry',
                    'trigonometry|trig': 'Trigonometry',
                    'ap.*calculus|ap.*calc': 'AP Calculus AB',
                    'ap.*statistics|ap.*stats': 'AP Statistics'
                },
                middle_school: {
                    '6th.*math|math.*6|grade.*6.*math': '6th Grade Math',
                    '7th.*math|math.*7|grade.*7.*math': '7th Grade Math',
                    '8th.*math|math.*8|grade.*8.*math': '8th Grade Math'
                },
                graduate: {
                    'advanced.*linear.*algebra': 'Advanced Linear Algebra',
                    'mathematical.*statistics': 'Mathematical Statistics'
                }
            },
            computer_science: {
                graduate: {
                    'advanced.*algorithms': 'Advanced Algorithms',
                    'computer.*vision': 'Computer Vision',
                    'natural.*language.*processing|nlp': 'Natural Language Processing',
                    'distributed.*systems': 'Distributed Systems'
                },
                high_school: {
                    'computer.*science.*principles|csp': 'Computer Science Principles',
                    'ap.*computer.*science|apcsa': 'AP Computer Science A',
                    'web.*design': 'Web Design'
                }
            },
            foreign_languages: {
                high_school: {
                    'spanish.*1|spanish.*i': 'Spanish I',
                    'spanish.*2|spanish.*ii': 'Spanish II',
                    'french.*1|french.*i': 'French I'
                }
            }
        };

        if (patterns[subjectArea] && patterns[subjectArea][level]) {
            const levelPatterns = patterns[subjectArea][level];
            for (const [pattern, courseName] of Object.entries(levelPatterns)) {
                if (new RegExp(pattern, 'i').test(input)) {
                    return courseName;
                }
            }
        }

        return null;
    }

    // Parse semester string into season and year
    static parseSemester(semesterString) {
        if (!semesterString) return { season: null, year: null };
        
        const str = semesterString.toLowerCase();
        let season = null;
        let year = null;

        // Extract season
        if (str.includes('fall') || str.includes('autumn')) season = 'fall';
        else if (str.includes('spring')) season = 'spring';
        else if (str.includes('summer')) season = 'summer';
        else if (str.includes('winter')) season = 'winter';

        // Extract year
        const yearMatch = str.match(/20\d{2}/);
        if (yearMatch) {
            year = yearMatch[0];
        }

        return { season, year };
    }

    // Process study goals to handle free-form text while providing enum fallbacks
    static processStudyGoals(studyGoals) {
        if (!studyGoals) return [];

        // If it's already an array of enum values, return as is
        if (Array.isArray(studyGoals) && studyGoals.every(goal => 
            ['pass_exam', 'improve_grades', 'deepen_understanding', 'prepare_career', 'personal_interest'].includes(goal)
        )) {
            return studyGoals;
        }

        // Convert string to appropriate enum values based on content
        const goalText = Array.isArray(studyGoals) ? studyGoals.join(' ') : studyGoals.toString();
        const goals = [];
        const lowerText = goalText.toLowerCase();

        // Map common phrases to enums, but be flexible
        if (lowerText.includes('pass') || lowerText.includes('exam') || lowerText.includes('test')) {
            goals.push('pass_exam');
        }
        if (lowerText.includes('grade') || lowerText.includes('gpa') || lowerText.includes('a\'s') || lowerText.includes('as')) {
            goals.push('improve_grades');
        }
        if (lowerText.includes('understand') || lowerText.includes('learn') || lowerText.includes('master') || lowerText.includes('comprehension')) {
            goals.push('deepen_understanding');
        }
        if (lowerText.includes('career') || lowerText.includes('job') || lowerText.includes('professional') || lowerText.includes('work')) {
            goals.push('prepare_career');
        }
        if (lowerText.includes('interest') || lowerText.includes('hobby') || lowerText.includes('curiosity') || lowerText.includes('passion')) {
            goals.push('personal_interest');
        }

        // If no specific matches, default to improve_grades as it's most common
        if (goals.length === 0) {
            goals.push('improve_grades');
        }

        // Remove duplicates
        return [...new Set(goals)];
    }

    // Transform backend profile data to frontend format
    static transformBackendToFrontend(backendProfile) {
        if (!backendProfile) return null;
        
        return {
            ...backendProfile,
            // Map snake_case to camelCase with fallbacks
            fullName: backendProfile.fullName || backendProfile.name || '',
            firstName: backendProfile.firstName || 
                      (backendProfile.name ? backendProfile.name.split(' ')[0] : '') ||
                      (backendProfile.fullName ? backendProfile.fullName.split(' ')[0] : ''),
            lastName: backendProfile.lastName || 
                     (backendProfile.name ? backendProfile.name.split(' ').slice(1).join(' ') : '') ||
                     (backendProfile.fullName ? backendProfile.fullName.split(' ').slice(1).join(' ') : ''),
            educationLevel: backendProfile.educationLevel || backendProfile.education_level || '',
            learningStyles: backendProfile.learningStyles || backendProfile.learning_styles || [],
            painPoints: backendProfile.painPoints || backendProfile.pain_points || [],
            studyGoals: backendProfile.studyGoals || 
                       backendProfile.originalStudyGoals || 
                       backendProfile.original_study_goals ||
                       (Array.isArray(backendProfile.study_goals) ? backendProfile.study_goals.join(', ') : backendProfile.study_goals) || '',
            semesterSeason: backendProfile.semesterSeason || backendProfile.semester_season || '',
            semesterYear: backendProfile.semesterYear || backendProfile.semester_year || '',
            originalStudyGoals: backendProfile.originalStudyGoals || backendProfile.original_study_goals || '',
            createdAt: backendProfile.createdAt || backendProfile.created_at || '',
            updatedAt: backendProfile.updatedAt || backendProfile.updated_at || '',
            
            // Keep original fields for backward compatibility
            name: backendProfile.name || backendProfile.fullName || '',
            education_level: backendProfile.education_level || backendProfile.educationLevel || '',
            learning_styles: backendProfile.learning_styles || backendProfile.learningStyles || [],
            pain_points: backendProfile.pain_points || backendProfile.painPoints || [],
            study_goals: backendProfile.study_goals || backendProfile.studyGoals || [],
            semester_season: backendProfile.semester_season || backendProfile.semesterSeason || '',
            semester_year: backendProfile.semester_year || backendProfile.semesterYear || '',
            original_study_goals: backendProfile.original_study_goals || backendProfile.originalStudyGoals || '',
            created_at: backendProfile.created_at || backendProfile.createdAt || '',
            updated_at: backendProfile.updated_at || backendProfile.updatedAt || '',
        };
    }

    // Check network connectivity
    static async isConnected() {
        try {
            const netInfo = await NetInfo.fetch();
            return netInfo.isConnected && netInfo.isInternetReachable;
        } catch (error) {
            logger.warn('Network check failed:', error);
            return false;
        }
    }

    // Enhanced API request with better error handling and retry logic
    static async makeApiRequest(url, options = {}, retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

        try {
            const response = await fetch(`${API_BASE_URL}${url}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                timeout: 10000, // 10 second timeout
                ...options,
            });

            // Handle different HTTP status codes
            if (!response.ok) {
                const errorBody = await response.text();
                let errorDetail = response.statusText;
                
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorDetail = errorJson.detail || errorJson.message || errorDetail;
                } catch (e) {
                    // Error body is not JSON
                }

                const error = new Error(`HTTP ${response.status}: ${errorDetail}`);
                error.status = response.status;
                error.body = errorBody;
                
                // Don't log 404s for profile endpoints as errors
                if (response.status === 404 && (url.includes('/profile/') || url.includes('/profile?'))) {
                    logger.info(`Profile API returned 404 for ${url} - user likely doesn't have profile yet`);
                } else if (response.status === 422) {
                    logger.error('Validation error (422):', errorDetail);
                    logger.error('Request body:', options.body);
                } else {
                    logger.error('API request failed:', error.message);
                }
                
                throw error;
            }

            return await response.json();
        } catch (networkError) {
            // Retry on network errors (but not validation errors)
            if (retryCount < maxRetries && !networkError.status && !networkError.message?.includes('422')) {
                logger.warn(`API request failed, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries + 1})`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return this.makeApiRequest(url, options, retryCount + 1);
            }

            // Log appropriately based on error type
            if (url.includes('/profile/') && networkError.message?.includes('404')) {
                logger.warn('Profile API request failed (expected for new users):', networkError.message);
            } else {
                logger.error('API request failed after retries:', networkError.message);
            }
            
            throw networkError;
        }
    }

    // Enhanced local storage with compression and validation
    static async saveProfileLocally(userId, profileData) {
        logger.info('Saving profile locally for user:', userId);
        
        const profileWithMetadata = {
            ...profileData,
            userId,
            originalStudyGoals: profileData.originalStudyGoals || profileData.studyGoals, // Preserve original text
            createdAt: profileData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: '2.0',
            synced: false,
            lastSyncAttempt: null,
            syncErrors: []
        };

        const storageKey = `${this.PROFILE_KEY}${userId}`;
        
        try {
            // Validate profile data before saving
            if (!this.validateProfileData(profileWithMetadata)) {
                throw new Error('Invalid profile data structure');
            }

            await AsyncStorage.setItem(storageKey, JSON.stringify(profileWithMetadata));
            logger.info('Profile successfully saved to AsyncStorage');
            
            // Verify save
            const saved = await AsyncStorage.getItem(storageKey);
            if (!saved) {
                throw new Error('Profile not found after save attempt');
            }
            
            return true;
        } catch (error) {
            logger.error('AsyncStorage save error:', error);
            throw error;
        }
    }

    // Validate profile data structure
    static validateProfileData(profile) {
        if (!profile || typeof profile !== 'object') return false;
        
        const requiredFields = ['userId'];
        for (const field of requiredFields) {
            if (!profile[field]) {
                logger.error(`Missing required field: ${field}`);
                return false;
            }
        }
        
        return true;
    }

    // Enhanced profile saving with sync queue
    static async saveProfile(userId, profileData) {
        try {
            // Always save locally first for immediate user experience
            await this.saveProfileLocally(userId, profileData);
            
            const isConnected = await this.isConnected();
            
            if (isConnected) {
                try {
                    // Check if profile already exists
                    const profileStatus = await this.checkProfileStatus(userId);
                    
                    // Transform and send to backend
                    const backendProfile = this.transformProfileForBackend(profileData);
                    
                    let response;
                    if (profileStatus.exists) {
                        // Update existing profile
                        logger.info('Updating existing profile for user:', userId);
                        response = await this.makeApiRequest(`/api/profile/${userId}`, {
                            method: 'PUT',
                            body: JSON.stringify(backendProfile)
                        });
                    } else {
                        // Create new profile
                        logger.info('Creating new profile for user:', userId);
                        const requestBody = {
                            user_id: userId,
                            ...backendProfile
                        };
                        response = await this.makeApiRequest('/api/profile/', {
                            method: 'POST',
                            body: JSON.stringify(requestBody)
                        });
                    }

                    // Mark as synced in local storage
                    const localProfile = await this.getProfile(userId);
                    if (localProfile) {
                        localProfile.synced = true;
                        localProfile.lastSyncAttempt = new Date().toISOString();
                        localProfile.syncErrors = []; // Reset sync errors on successful sync
                        await this.saveProfileLocally(userId, localProfile);
                    }

                    logger.info('Student profile saved to backend and local storage');
                    return response;
                } catch (apiError) {
                    logger.error('Backend save failed:', apiError.message);
                    
                    // Add to sync queue for later retry
                    await this.addToSyncQueue(userId, profileData, apiError.message);
                    
                    // Update local profile with sync error info
                    const localProfile = await this.getProfile(userId);
                    if (localProfile) {
                        localProfile.synced = false;
                        localProfile.lastSyncAttempt = new Date().toISOString();
                        
                        // Initialize syncErrors array if it doesn't exist
                        if (!localProfile.syncErrors) {
                            localProfile.syncErrors = [];
                        }
                        
                        localProfile.syncErrors.push({
                            error: apiError.message,
                            timestamp: new Date().toISOString()
                        });
                        await this.saveProfileLocally(userId, localProfile);
                    }
                    
                    // Still return success since local save worked
                    logger.info('Profile saved locally, will sync when connection improves');
                    return { success: true, synced: false };
                }
            } else {
                // Offline - add to sync queue
                await this.addToSyncQueue(userId, profileData, 'Offline');
                logger.info('Profile saved locally (offline mode)');
                return { success: true, synced: false };
            }
        } catch (error) {
            logger.error('Error saving student profile:', error);
            throw error;
        }
    }

    // Add profile to sync queue for later processing
    static async addToSyncQueue(userId, profileData, reason) {
        try {
            const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
            const queue = queueData ? JSON.parse(queueData) : [];
            
            // Remove any existing entry for this user
            const filteredQueue = queue.filter(item => item.userId !== userId);
            
            // Add new entry
            filteredQueue.push({
                userId,
                profileData,
                reason,
                timestamp: new Date().toISOString(),
                attempts: 0
            });
            
            await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
            logger.info(`Added profile to sync queue for user ${userId}: ${reason}`);
        } catch (error) {
            logger.error('Error adding to sync queue:', error);
        }
    }

    // Enhanced profile status checking
    static async checkProfileStatus(userId) {
        logger.info('Checking profile status for user:', userId);
        
        try {
            const isConnected = await this.isConnected();
            
            // Always check local storage first for faster UX
            const storageKey = `${this.PROFILE_KEY}${userId}`;
            const localProfileData = await AsyncStorage.getItem(storageKey);
            const hasLocalProfile = localProfileData !== null;
            
            if (!isConnected) {
                // Offline - can only rely on local storage
                return {
                    exists: hasLocalProfile,
                    source: 'local',
                    synced: false,
                    offline: true
                };
            }
            
            // Online - check backend but use local as fallback
            try {
                logger.info('Checking backend profile status...');
                const response = await this.makeApiRequest(`/api/profile/status/${userId}`);
                
                const result = {
                    exists: response.exists,
                    source: 'backend',
                    synced: response.exists,
                    completion_percentage: response.completion_percentage,
                    hasLocalProfile
                };
                
                // If backend says no profile but we have local, profile needs sync
                if (!response.exists && hasLocalProfile) {
                    result.needsSync = true;
                    result.source = 'local_pending_sync';
                }
                
                return result;
            } catch (backendError) {
                logger.info('Backend status check failed, using local storage');
                
                return {
                    exists: hasLocalProfile,
                    source: hasLocalProfile ? 'local' : 'none',
                    synced: false,
                    needsSync: hasLocalProfile,
                    backendError: backendError.message
                };
            }
        } catch (error) {
            logger.error('Error checking profile status:', error);
            // Fallback to basic local check
            const profileData = await AsyncStorage.getItem(`${this.PROFILE_KEY}${userId}`);
            return {
                exists: profileData !== null,
                source: 'local',
                synced: false,
                error: error.message
            };
        }
    }

    // Enhanced profile retrieval with better error handling
    static async getProfile(userId) {
        logger.info('Loading profile for user:', userId);
        
        try {
            const isConnected = await this.isConnected();
            
            if (isConnected) {
                // Try backend first
                try {
                    logger.info('Fetching profile from backend...');
                    const rawProfile = await this.makeApiRequest(`/api/profile/?user_id=${userId}`);
                    
                    // Transform backend response to frontend format
                    const profile = this.transformBackendToFrontend(rawProfile);
                    
                    // Cache in local storage with sync flag
                    const profileWithMeta = {
                        ...profile,
                        synced: true,
                        lastFetchedAt: new Date().toISOString()
                    };
                    await this.saveProfileLocally(userId, profileWithMeta);
                    
                    logger.info('Profile loaded from backend');
                    return profile;
                } catch (apiError) {
                    if (!apiError.message?.includes('404')) {
                        logger.warn('Backend fetch failed, using local storage:', apiError.message);
                    }
                }
            }
            
            // Fallback to local storage
            logger.info('Loading profile from local storage...');
            const storageKey = `${this.PROFILE_KEY}${userId}`;
            const profileData = await AsyncStorage.getItem(storageKey);
            
            if (profileData) {
                const rawProfile = JSON.parse(profileData);
                logger.info('Profile loaded from local storage');
                
                // Transform to ensure consistent format
                const profile = this.transformBackendToFrontend(rawProfile);
                
                return profile;
            }
            
            logger.info('No profile found');
            return null;
        } catch (error) {
            logger.error('Error loading profile:', error);
            return null;
        }
    }

    // Enhanced profile updating
    static async updateProfile(userId, updates) {
        try {
            // Get existing profile
            const existingProfile = await this.getProfile(userId);
            if (!existingProfile) {
                throw new Error('Profile not found for update');
            }

            // Merge updates with existing data
            const updatedProfile = {
                ...existingProfile,
                ...updates,
                updatedAt: new Date().toISOString(),
                synced: false
            };

            // Save locally first
            await this.saveProfileLocally(userId, updatedProfile);

            const isConnected = await this.isConnected();
            
            if (isConnected) {
                try {
                    // Send to backend
                    const backendUpdates = this.transformProfileForBackend(updates);
                    const response = await this.makeApiRequest(`/api/profile/${userId}`, {
                        method: 'PUT',
                        body: JSON.stringify(backendUpdates)
                    });
                    
                    // Mark as synced
                    updatedProfile.synced = true;
                    await this.saveProfileLocally(userId, updatedProfile);
                    
                    logger.info('Profile updated on backend');
                    return response;
                } catch (apiError) {
                    logger.warn('Backend update failed, saved locally:', apiError.message);
                    await this.addToSyncQueue(userId, updatedProfile, apiError.message);
                }
            } else {
                await this.addToSyncQueue(userId, updatedProfile, 'Offline');
            }
            
            return { success: true, synced: updatedProfile.synced };
        } catch (error) {
            logger.error('Error updating profile:', error);
            throw error;
        }
    }

    // Enhanced course validation with offline support
    static async validateCourse(courseName) {
        if (!courseName || courseName.trim().length < 2) {
            return {
                valid: false,
                message: 'Course name must be at least 2 characters',
                suggestions: []
            };
        }

        try {
            const isConnected = await this.isConnected();
            
            if (isConnected) {
                const response = await this.makeApiRequest('/api/profile/courses/validate', {
                    method: 'POST',
                    body: JSON.stringify({ course_name: courseName.trim() })
                });
                
                return {
                    valid: response.is_valid,
                    suggestions: response.suggestions || [],
                    courseInfo: response.course_info,
                    message: response.is_valid ? 'Course validated' : 'Course validation failed'
                };
            }
            
            // Offline validation - accept reasonable course names
            const trimmedName = courseName.trim();
            const valid = trimmedName.length >= 2 && /^[a-zA-Z0-9\s\-&()]+$/.test(trimmedName);
            
            return {
                valid,
                suggestions: [],
                message: valid ? 'Course accepted (offline validation)' : 'Invalid course name format'
            };
        } catch (error) {
            logger.error('Course validation error:', error);
            // Fallback to accepting reasonable names
            const trimmedName = courseName.trim();
            const valid = trimmedName.length >= 2;
            
            return {
                valid,
                suggestions: [],
                message: valid ? 'Course accepted (validation unavailable)' : 'Course name too short'
            };
        }
    }

    // Enhanced course suggestions
    static async getCourseSuggestions(partialName, educationLevel = null) {
        if (!partialName || partialName.length < 2) {
            return [];
        }

        try {
            const isConnected = await this.isConnected();
            
            if (isConnected) {
                const requestBody = { partial_name: partialName.trim() };
                if (educationLevel) {
                    requestBody.education_level = educationLevel;
                }
                
                const response = await this.makeApiRequest('/api/profile/courses/suggest', {
                    method: 'POST',
                    body: JSON.stringify(requestBody)
                });
                
                return response.suggestions || [];
            }
            
            // Offline fallback with common course suggestions
            return this.getOfflineCourseSuggestions(partialName);
        } catch (error) {
            logger.error('Error getting course suggestions:', error);
            return this.getOfflineCourseSuggestions(partialName);
        }
    }

    // Offline course suggestions
    static getOfflineCourseSuggestions(partialName) {
        const partial = partialName.toLowerCase();
        const suggestions = [];

        const commonCourses = {
            'math': ['Mathematics', 'Calculus I', 'Calculus II', 'Calculus III', 'Statistics', 'Algebra', 'Linear Algebra', 'Discrete Mathematics'],
            'calc': ['Calculus I', 'Calculus II', 'Calculus III', 'Vector Calculus'],
            'data': ['Data Structures', 'Database Systems', 'Data Analysis', 'Data Science', 'Big Data', 'Data Mining', 'Database Design'],
            'computer': ['Computer Science', 'Computer Programming', 'Computer Networks', 'Computer Architecture', 'Computer Graphics', 'Computer Systems'],
            'programming': ['Programming Fundamentals', 'Advanced Programming', 'Web Programming', 'Mobile Programming', 'Game Programming'],
            'object': ['Object Oriented Programming', 'OOP Concepts', 'Object Oriented Design', 'Advanced OOP'],
            'oriented': ['Object Oriented Programming', 'Object Oriented Design', 'Object Oriented Analysis'],
            'oop': ['Object Oriented Programming', 'OOP Fundamentals', 'Advanced OOP'],
            'java': ['Java Programming', 'Advanced Java', 'Java Development', 'Java Enterprise'],
            'python': ['Python Programming', 'Advanced Python', 'Python Development', 'Python Data Science'],
            'javascript': ['JavaScript Programming', 'Advanced JavaScript', 'JavaScript Development', 'Web JavaScript'],
            'web': ['Web Development', 'Web Programming', 'Web Design', 'Advanced Web Development'],
            'software': ['Software Engineering', 'Software Development', 'Software Design', 'Software Architecture'],
            'algorithm': ['Algorithms', 'Data Structures and Algorithms', 'Algorithm Design', 'Advanced Algorithms'],
            'machine': ['Machine Learning', 'Machine Learning Fundamentals', 'Advanced Machine Learning'],
            'artificial': ['Artificial Intelligence', 'AI Fundamentals', 'Advanced AI'],
            'network': ['Computer Networks', 'Network Security', 'Network Administration', 'Network Design'],
            'security': ['Cybersecurity', 'Network Security', 'Information Security', 'Computer Security'],
            'bio': ['Biology', 'Microbiology', 'Molecular Biology', 'Biochemistry', 'Cell Biology'],
            'chem': ['Chemistry', 'Organic Chemistry', 'Physical Chemistry', 'General Chemistry'],
            'phys': ['Physics', 'Physics I', 'Physics II', 'Modern Physics', 'Quantum Physics'],
            'psych': ['Psychology', 'Developmental Psychology', 'Social Psychology', 'Cognitive Psychology'],
            'english': ['English Literature', 'English Composition', 'Advanced English', 'Creative Writing'],
            'history': ['World History', 'American History', 'European History', 'Modern History'],
            'business': ['Business Administration', 'Business Management', 'International Business', 'Business Strategy'],
            'economics': ['Economics', 'Microeconomics', 'Macroeconomics', 'Economic Theory'],
            'accounting': ['Accounting', 'Financial Accounting', 'Managerial Accounting', 'Cost Accounting'],
            
            // Health Sciences
            'anatomy': ['Anatomy and Physiology I', 'Anatomy and Physiology II', 'Human Anatomy', 'Medical Anatomy'],
            'physiology': ['Anatomy and Physiology I', 'Anatomy and Physiology II', 'Human Physiology'],
            'medical': ['Medical Terminology', 'Medical Ethics', 'Medical Sciences', 'Clinical Medicine'],
            'health': ['Health Sciences', 'Public Health', 'Health Education', 'Health Psychology'],
            'nursing': ['Nursing Fundamentals', 'Medical-Surgical Nursing', 'Pediatric Nursing'],
            
            // Education
            'education': ['Educational Psychology', 'Curriculum Development', 'Teaching Methods', 'Special Education'],
            'teaching': ['Teaching Methods', 'Classroom Management', 'Educational Technology'],
            'curriculum': ['Curriculum Development', 'Curriculum Design', 'Instructional Design'],
            
            // Foreign Languages
            'spanish': ['Spanish I', 'Spanish II', 'Spanish III', 'Advanced Spanish'],
            'french': ['French I', 'French II', 'French III', 'Advanced French'],
            'language': ['World Languages', 'Foreign Language', 'Language Arts'],
            
            // Middle School Courses
            'grade': ['6th Grade Math', '7th Grade Math', '8th Grade Math', '6th Grade Science', '7th Grade Science', '8th Grade Science'],
            'middle': ['Middle School Math', 'Middle School Science', 'Middle School English'],
            '6th': ['6th Grade Math', '6th Grade Science', '6th Grade English', '6th Grade Social Studies'],
            '7th': ['7th Grade Math', '7th Grade Science', '7th Grade English', '7th Grade Social Studies'],
            '8th': ['8th Grade Math', '8th Grade Science', '8th Grade English', '8th Grade Social Studies'],
            
            // High School Courses
            'freshman': ['English 9', 'Algebra I', 'Biology', 'World Geography'],
            'sophomore': ['English 10', 'Geometry', 'Chemistry', 'World History'],
            'junior': ['English 11', 'Algebra II', 'U.S. History', 'Physics'],
            'senior': ['English 12', 'Calculus', 'Government/Civics', 'Economics'],
            'ap': ['AP Biology', 'AP Chemistry', 'AP Physics', 'AP Calculus AB', 'AP Statistics', 'AP English Language', 'AP English Literature', 'AP U.S. History', 'AP Computer Science A'],
            
            // Graduate Courses
            'graduate': ['Advanced Algorithms', 'Machine Learning', 'Strategic Management', 'Research Methods'],
            'masters': ['Advanced Statistics', 'Computer Vision', 'Financial Management', 'Clinical Psychology'],
            'mba': ['Strategic Management', 'Financial Management', 'Marketing Strategy', 'Operations Research'],
            
            // Fine Arts & Electives
            'art': ['Art I', 'Visual Arts', 'Drawing', 'Painting', 'Digital Art'],
            'music': ['Music Theory', 'Band', 'Choir', 'Music Appreciation'],
            'pe': ['Physical Education', 'Health', 'Sports', 'Fitness']
        };

        for (const [key, courses] of Object.entries(commonCourses)) {
            if (partial.includes(key)) {
                courses.forEach(course => {
                    if (course.toLowerCase().includes(partial)) {
                        suggestions.push({
                            name: course,
                            code: '',
                            department: '',
                            credits: '3',
                            description: ''
                        });
                    }
                });
                break;
            }
        }

        return suggestions.slice(0, 5);
    }

    // Enhanced sync functionality
    static async syncOfflineProfiles() {
        try {
            const isConnected = await this.isConnected();
            if (!isConnected) {
                logger.info('No connection available for sync');
                return { synced: 0, failed: 0 };
            }

            // Process sync queue
            const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
            const queue = queueData ? JSON.parse(queueData) : [];
            
            if (queue.length === 0) {
                logger.info('No profiles in sync queue');
                return { synced: 0, failed: 0 };
            }

            let syncedCount = 0;
            let failedCount = 0;
            const remainingQueue = [];

            for (const queueItem of queue) {
                try {
                    queueItem.attempts = (queueItem.attempts || 0) + 1;
                    
                    const backendProfile = this.transformProfileForBackend(queueItem.profileData);
                    await this.makeApiRequest('/api/profile/', {
                        method: 'POST',
                        body: JSON.stringify({
                            user_id: queueItem.userId,
                            ...backendProfile
                        })
                    });
                    
                    // Mark local profile as synced
                    const localProfile = await this.getProfile(queueItem.userId);
                    if (localProfile) {
                        localProfile.synced = true;
                        localProfile.lastSyncAttempt = new Date().toISOString();
                        localProfile.syncErrors = [];
                        await this.saveProfileLocally(queueItem.userId, localProfile);
                    }
                    
                    syncedCount++;
                    logger.info(`Synced profile for user ${queueItem.userId}`);
                } catch (syncError) {
                    logger.warn(`Failed to sync profile for user ${queueItem.userId}:`, syncError.message);
                    failedCount++;
                    
                    // Keep in queue if under max attempts
                    if (queueItem.attempts < 5) {
                        remainingQueue.push(queueItem);
                    }
                }
            }

            // Update sync queue
            await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(remainingQueue));
            
            logger.info(`Sync complete: ${syncedCount} synced, ${failedCount} failed`);
            return { synced: syncedCount, failed: failedCount };
        } catch (error) {
            logger.error('Error syncing offline profiles:', error);
            return { synced: 0, failed: 0, error: error.message };
        }
    }

    // Get comprehensive sync status
    static async getProfileSyncStatus(userId) {
        try {
            const profileData = await AsyncStorage.getItem(`${this.PROFILE_KEY}${userId}`);
            const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
            
            if (!profileData) {
                return { exists: false, synced: false, needsSync: false };
            }

            const profile = JSON.parse(profileData);
            const queue = queueData ? JSON.parse(queueData) : [];
            const inQueue = queue.some(item => item.userId === userId);

            return {
                exists: true,
                synced: profile.synced || false,
                lastUpdated: profile.updatedAt,
                lastSyncAttempt: profile.lastSyncAttempt,
                needsSync: !profile.synced || inQueue,
                inSyncQueue: inQueue,
                syncErrors: profile.syncErrors || [],
                hasConnection: await this.isConnected()
            };
        } catch (error) {
            logger.error('Error checking sync status:', error);
            return { exists: false, synced: false, needsSync: false, error: error.message };
        }
    }

    // Enhanced profile completion calculation
    static getProfileCompletionPercentage(profile) {
        if (!profile) return 0;

        const weights = {
            critical: { weight: 40, fields: ['fullName', 'educationLevel', 'program'] },
            important: { weight: 35, fields: ['studyGoals', 'courses'] },
            helpful: { weight: 25, fields: ['year', 'semester', 'learningStyles', 'painPoints', 'notes'] }
        };

        let totalScore = 0;

        for (const [category, config] of Object.entries(weights)) {
            const filledFields = config.fields.filter(field => {
                const value = profile[field];
                if (Array.isArray(value)) return value.length > 0;
                if (typeof value === 'string') return value.trim().length > 0;
                return value !== null && value !== undefined;
            }).length;

            const categoryScore = (filledFields / config.fields.length) * config.weight;
            totalScore += categoryScore;
        }

        return Math.round(totalScore);
    }

    // Generate personalized recommendations
    static async getStudyRecommendations(userId, profile = null) {
        try {
            const isConnected = await this.isConnected();
            
            if (isConnected) {
                try {
                    const response = await this.makeApiRequest(`/api/profile/${userId}/recommendations`);
                    return response.recommendations || [];
                } catch (apiError) {
                    logger.warn('Backend recommendations failed, using fallback:', apiError.message);
                }
            }
            
            return this.generateFallbackRecommendations(profile || await this.getProfile(userId));
        } catch (error) {
            logger.error('Error getting recommendations:', error);
            return this.generateFallbackRecommendations(profile);
        }
    }

    // Generate recommendations when backend is unavailable
    static generateFallbackRecommendations(profile) {
        const recommendations = [];

        if (!profile) return recommendations;

        // Study goals based recommendations
        if (profile.studyGoals || profile.originalStudyGoals) {
            const goals = (profile.originalStudyGoals || profile.studyGoals || '').toLowerCase();
            
            if (goals.includes('grade') || goals.includes('gpa')) {
                recommendations.push({
                    type: 'study_strategy',
                    title: 'Grade Improvement Plan',
                    description: 'Focus on consistent practice and review sessions',
                    priority: 1
                });
            }
            
            if (goals.includes('exam') || goals.includes('test') || goals.includes('pass')) {
                recommendations.push({
                    type: 'exam_prep',
                    title: 'Exam Preparation Strategy',
                    description: 'Create a structured study schedule leading up to exams',
                    priority: 1
                });
            }
        }

        // Learning style recommendations
        if (profile.learningStyles && profile.learningStyles.length > 0) {
            if (profile.learningStyles.includes('visual')) {
                recommendations.push({
                    type: 'study_method',
                    title: 'Visual Learning Tools',
                    description: 'Use mind maps, diagrams, and visual aids for better retention',
                    priority: 2
                });
            }
            
            if (profile.learningStyles.includes('problem_solving')) {
                recommendations.push({
                    type: 'practice',
                    title: 'Problem-Solving Practice',
                    description: 'Regular practice with challenging problems to build skills',
                    priority: 2
                });
            }
        }

        // Pain point solutions
        if (profile.painPoints && profile.painPoints.length > 0) {
            if (profile.painPoints.includes('time_management')) {
                recommendations.push({
                    type: 'technique',
                    title: 'Time Management System',
                    description: 'Implement the Pomodoro Technique and create daily study schedules',
                    priority: 1
                });
            }
            
            if (profile.painPoints.includes('test_anxiety')) {
                recommendations.push({
                    type: 'wellness',
                    title: 'Test Anxiety Management',
                    description: 'Practice relaxation techniques and mock exams to build confidence',
                    priority: 2
                });
            }
            
            if (profile.painPoints.includes('focus')) {
                recommendations.push({
                    type: 'environment',
                    title: 'Focus Enhancement',
                    description: 'Create a distraction-free study environment and use focus apps',
                    priority: 2
                });
            }
        }

        // Course-based recommendations
        if (profile.courses && profile.courses.length > 0) {
            const courseCount = profile.courses.length;
            if (courseCount > 5) {
                recommendations.push({
                    type: 'organization',
                    title: 'Course Load Management',
                    description: 'Prioritize courses and create a balanced study schedule',
                    priority: 1
                });
            }
        }

        // Sort by priority and return top 5
        return recommendations
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 5)
            .map(rec => ({ ...rec, based_on: this.getRecommendationBasis(rec, profile) }));
    }

    // Get what recommendation is based on
    static getRecommendationBasis(recommendation, profile) {
        const basis = [];
        
        if (recommendation.type === 'study_strategy' && profile.studyGoals) {
            basis.push('study goals');
        }
        if (recommendation.type === 'study_method' && profile.learningStyles) {
            basis.push('learning preferences');
        }
        if (recommendation.type === 'technique' && profile.painPoints) {
            basis.push('identified challenges');
        }
        if (recommendation.type === 'organization' && profile.courses) {
            basis.push('course load');
        }
        
        return basis.length > 0 ? basis : ['general best practices'];
    }

    // Enhanced quiz settings suggestions
    static async getSuggestedQuizSettings(userId, profile = null) {
        try {
            const isConnected = await this.isConnected();
            
            if (isConnected) {
                try {
                    const response = await this.makeApiRequest(`/api/profile/${userId}/quiz-suggestions`);
                    return response;
                } catch (apiError) {
                    logger.warn('Backend quiz suggestions failed, using fallback:', apiError.message);
                }
            }
            
            return this.generateFallbackQuizSettings(profile || await this.getProfile(userId));
        } catch (error) {
            logger.error('Error getting quiz suggestions:', error);
            return this.generateFallbackQuizSettings(profile);
        }
    }

    // Generate quiz settings when backend unavailable
    static generateFallbackQuizSettings(profile) {
        const defaultSettings = {
            quiz_types: ['multiple_choice'],
            difficulty: 'medium',
            session_length: 10,
            explanation_detail: 'medium'
        };

        if (!profile || !profile.learningStyles) {
            return defaultSettings;
        }

        const settings = { ...defaultSettings };

        // Map learning styles to quiz types
        const styleToTypeMap = {
            multiple_choice: 'multiple_choice',
            essays: 'open_ended',
            problem_solving: 'multiple_choice',
            case_studies: 'open_ended',
            visual: 'multiple_choice'
        };

        const quizTypes = profile.learningStyles
            .map(style => styleToTypeMap[style])
            .filter(type => type && type !== settings.quiz_types[0]);

        if (quizTypes.length > 0) {
            settings.quiz_types = [settings.quiz_types[0], ...quizTypes];
        }

        // Adjust difficulty based on education level
        const difficultyMap = {
            high_school: 'easy',
            undergrad: 'medium',
            masters: 'hard',
            phd: 'hard',
            professional: 'hard'
        };

        settings.difficulty = difficultyMap[profile.educationLevel] || 'medium';

        // Adjust session length based on pain points
        if (profile.painPoints && profile.painPoints.includes('focus')) {
            settings.session_length = 5; // Shorter sessions for focus issues
        } else if (profile.painPoints && profile.painPoints.includes('time_management')) {
            settings.session_length = 7; // Slightly shorter for time management
        }

        // Adjust explanation detail based on learning style
        if (profile.learningStyles.includes('visual')) {
            settings.explanation_detail = 'detailed';
        }

        return settings;
    }

    // Check if profile is complete enough for personalization
    static isProfileComplete(profile) {
        if (!profile) return false;

        const requiredFields = ['fullName', 'educationLevel', 'program'];
        const hasRequiredFields = requiredFields.every(field => {
            const value = profile[field];
            return value && value.toString().trim().length > 0;
        });

        const hasStudyGoals = (profile.studyGoals || profile.originalStudyGoals) && 
                             (profile.studyGoals || profile.originalStudyGoals).toString().trim().length > 0;
        const hasCourses = profile.courses && profile.courses.length > 0;
        
        return hasRequiredFields && hasStudyGoals && hasCourses;
    }

    // Generate personalized welcome message
    static getWelcomeMessage(profile) {
        if (!profile || !profile.fullName) {
            return 'Welcome to Alexandria! Let\'s get started with your personalized learning journey.';
        }

        const firstName = profile.fullName.split(' ')[0];
        const program = profile.program || 'your studies';
        const goals = profile.originalStudyGoals || profile.studyGoals || '';

        const messages = [
            `Welcome back, ${firstName}! Ready to work toward your goal of ${goals.toLowerCase()}?`,
            `Hi ${firstName}! Let's continue making progress in ${program}.`,
            `Hey ${firstName}! Alexandria is here to help you succeed in ${program}.`
        ];

        // Pick message based on available data
        if (goals && goals.length > 0) {
            return messages[0];
        } else if (program !== 'your studies') {
            return messages[1];
        } else {
            return messages[2];
        }
    }

    // Get difficulty level suggestion
    static getDifficultyLevel(educationLevel) {
        const difficultyMap = {
            high_school: 'easy',
            undergrad: 'medium',
            masters: 'hard',
            phd: 'hard',
            professional: 'hard'
        };
        return difficultyMap[educationLevel] || 'medium';
    }

    // Course management methods
    static async addCourse(userId, courseData) {
        try {
            const profile = await this.getProfile(userId);
            if (!profile) {
                throw new Error('Profile not found');
            }

            const newCourse = {
                id: Date.now().toString(),
                name: courseData.name || courseData.code || 'New Course',
                code: courseData.code || '',
                instructor: courseData.instructor || null,
                credits: courseData.credits || null,
                validated: Boolean(courseData.validated),
                createdAt: new Date().toISOString()
            };
            
            const updatedCourses = [...(profile.courses || []), newCourse];
            await this.updateProfile(userId, { courses: updatedCourses });
            
            return newCourse;
        } catch (error) {
            logger.error('Error adding course:', error);
            throw error;
        }
    }

    static async removeCourse(userId, courseId) {
        try {
            const profile = await this.getProfile(userId);
            if (!profile || !profile.courses) {
                return false;
            }

            const updatedCourses = profile.courses.filter(course => course.id !== courseId);
            await this.updateProfile(userId, { courses: updatedCourses });
            
            return true;
        } catch (error) {
            logger.error('Error removing course:', error);
            throw error;
        }
    }

    static async updateCourse(userId, courseId, updates) {
        try {
            const profile = await this.getProfile(userId);
            if (!profile || !profile.courses) {
                return false;
            }

            const courseIndex = profile.courses.findIndex(course => course.id === courseId);
            if (courseIndex === -1) {
                return false;
            }

            const updatedCourses = [...profile.courses];
            updatedCourses[courseIndex] = {
                ...updatedCourses[courseIndex],
                ...updates,
                updatedAt: new Date().toISOString()
            };

            await this.updateProfile(userId, { courses: updatedCourses });
            return true;
        } catch (error) {
            logger.error('Error updating course:', error);
            throw error;
        }
    }

    // Clear profile data (for testing/reset)
    static async clearProfile(userId) {
        try {
            await AsyncStorage.removeItem(`${this.PROFILE_KEY}${userId}`);
            
            // Remove from sync queue
            const queueData = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
            if (queueData) {
                const queue = JSON.parse(queueData);
                const filteredQueue = queue.filter(item => item.userId !== userId);
                await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
            }
            
            logger.info('Student profile cleared successfully');
            return true;
        } catch (error) {
            logger.error('Error clearing profile:', error);
            throw error;
        }
    }

    // Get all local profiles (for debugging)
    static async getAllLocalProfiles() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const profileKeys = keys.filter(key => key.startsWith(this.PROFILE_KEY));
            
            const profiles = [];
            for (const key of profileKeys) {
                try {
                    const data = await AsyncStorage.getItem(key);
                    if (data) {
                        const profile = JSON.parse(data);
                        profiles.push({
                            userId: key.replace(this.PROFILE_KEY, ''),
                            profile,
                            synced: profile.synced || false
                        });
                    }
                } catch (parseError) {
                    logger.warn('Error parsing profile for key:', key, parseError);
                }
            }
            
            return profiles;
        } catch (error) {
            logger.error('Error getting all local profiles:', error);
            return [];
        }
    }

    // Clear all local data (for complete reset)
    static async clearAllLocalData() {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const profileKeys = keys.filter(key => 
                key.startsWith(this.PROFILE_KEY) || key === this.SYNC_QUEUE_KEY
            );
            
            await AsyncStorage.multiRemove(profileKeys);
            logger.info('All local profile data cleared');
            return true;
        } catch (error) {
            logger.error('Error clearing all local data:', error);
            throw error;
        }
    }

    // Export profile data (for backup)
    static async exportProfileData(userId) {
        try {
            const profile = await this.getProfile(userId);
            const syncStatus = await this.getProfileSyncStatus(userId);
            
            return {
                profile,
                syncStatus,
                exportedAt: new Date().toISOString(),
                version: '2.0'
            };
        } catch (error) {
            logger.error('Error exporting profile data:', error);
            throw error;
        }
    }

    // Import profile data (for restore)
    static async importProfileData(userId, exportedData) {
        try {
            if (!exportedData || !exportedData.profile) {
                throw new Error('Invalid export data format');
            }

            const profileToImport = {
                ...exportedData.profile,
                userId,
                importedAt: new Date().toISOString(),
                synced: false // Mark as needing sync
            };

            await this.saveProfileLocally(userId, profileToImport);
            
            // Add to sync queue
            await this.addToSyncQueue(userId, profileToImport, 'Imported profile');
            
            logger.info('Profile data imported successfully');
            return true;
        } catch (error) {
            logger.error('Error importing profile data:', error);
            throw error;
        }
    }
}