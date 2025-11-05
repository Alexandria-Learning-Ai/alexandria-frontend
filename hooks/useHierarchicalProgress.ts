import { useState, useEffect } from 'react';
import { auth } from '../firebaseConfig';
import { SubjectProgressService } from '../services/SubjectProgressService';
import HierarchicalSubjectService from '../services/HierarchicalSubjectService';
import logger from '../utils/logger';

interface SubjectInfo {
  name: string;
  score: number;
  courses?: number;
  color: string;
  icon: string;
}

interface CourseInfo {
  name: string;
  subject: string;
  score: number;
  lastStudied: string;
  color: string;
}

interface ImprovingSubjectInfo {
  name: string;
  improvement: number;
  score: number;
  color: string;
  icon: string;
}

interface HierarchicalInsights {
  topSubject: SubjectInfo | null;
  recentCourse: CourseInfo | null;
  improvingSubject: ImprovingSubjectInfo | null;
  needsAttentionSubject: SubjectInfo | null;
  totalSubjects: number;
  totalCourses: number;
}

export const useHierarchicalProgress = () => {
  const [hierarchicalInsights, setHierarchicalInsights] = useState<HierarchicalInsights>({
    topSubject: null,
    recentCourse: null,
    improvingSubject: null,
    needsAttentionSubject: null,
    totalSubjects: 0,
    totalCourses: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadHierarchicalInsights();
  }, []);

  const loadHierarchicalInsights = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Get hierarchical progress data
      const hierarchicalProgress = await SubjectProgressService.getHierarchicalProgress(user.uid);

      if (Object.keys(hierarchicalProgress).length === 0) {
        // No hierarchical data yet
        setHierarchicalInsights({
          topSubject: null,
          recentCourse: null,
          improvingSubject: null,
          needsAttentionSubject: null,
          totalSubjects: 0,
          totalCourses: 0,
        });
        setIsLoading(false);
        return;
      }

      // Analyze the hierarchical data for insights
      const subjects = Object.entries(hierarchicalProgress);
      let totalCourses = 0;
      let topSubject: SubjectInfo | null = null;
      let topSubjectScore = 0;
      let improvingSubject: ImprovingSubjectInfo | null = null;
      let maxImprovement = 0;
      let needsAttentionSubject: SubjectInfo | null = null;
      let lowestScore = 100;
      let recentCourse: CourseInfo | null = null;
      let mostRecentTime = 0;

      subjects.forEach(([subjectName, subjectData]: [string, any]) => {
        const subjectScore = subjectData.averageScore || 0;
        const courses = Object.keys(subjectData.courses || {});
        totalCourses += courses.length;

        // Find top-performing subject
        if (subjectScore > topSubjectScore) {
          topSubjectScore = subjectScore;
          topSubject = {
            name: subjectName,
            score: subjectScore,
            courses: courses.length,
            color: HierarchicalSubjectService.getSubjectColor(subjectName),
            icon: HierarchicalSubjectService.getSubjectIcon(subjectName),
          };
        }

        // Find subject that needs attention (lowest score)
        if (subjectScore > 0 && subjectScore < lowestScore) {
          lowestScore = subjectScore;
          needsAttentionSubject = {
            name: subjectName,
            score: subjectScore,
            color: HierarchicalSubjectService.getSubjectColor(subjectName),
            icon: HierarchicalSubjectService.getSubjectIcon(subjectName),
          };
        }

        // Find most recently studied course
        Object.entries(subjectData.courses || {}).forEach(([courseName, courseData]: [string, any]) => {
          if (courseData.lastStudied) {
            const courseTime = new Date(courseData.lastStudied).getTime();
            if (courseTime > mostRecentTime) {
              mostRecentTime = courseTime;
              recentCourse = {
                name: courseName,
                subject: subjectName,
                score: courseData.averageScore || 0,
                lastStudied: courseData.lastStudied,
                color: HierarchicalSubjectService.getSubjectColor(subjectName),
              };
            }
          }
        });

        // Calculate improvement trend (simplified)
        if (subjectData.improvementTrend && subjectData.improvementTrend > maxImprovement) {
          maxImprovement = subjectData.improvementTrend;
          improvingSubject = {
            name: subjectName,
            improvement: subjectData.improvementTrend,
            score: subjectScore,
            color: HierarchicalSubjectService.getSubjectColor(subjectName),
            icon: HierarchicalSubjectService.getSubjectIcon(subjectName),
          };
        }
      });

      setHierarchicalInsights({
        topSubject,
        recentCourse,
        improvingSubject,
        needsAttentionSubject,
        totalSubjects: subjects.length,
        totalCourses,
      });

      logger.info('📊 Hierarchical insights loaded:', {
        totalSubjects: subjects.length,
        totalCourses,
        topSubject: topSubject?.name,
        recentCourse: recentCourse?.name,
      });
    } catch (error) {
      logger.error('❌ Error loading hierarchical insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshInsights = () => {
    loadHierarchicalInsights();
  };

  return {
    hierarchicalInsights,
    isLoading,
    refreshInsights,
  };
};
