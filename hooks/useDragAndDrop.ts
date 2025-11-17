/**
 * useDragAndDrop - Custom hook for drag-and-drop functionality
 *
 * Provides drag-and-drop state management with optimistic updates and API synchronization
 *
 * Features:
 * - Track dragging state
 * - Handle reorder operations
 * - Optimistic UI updates
 * - API synchronization
 * - Rollback on error
 *
 * @param initialData - Initial array of items to manage
 * @returns Drag-and-drop state and handlers
 */

import { useState, useCallback } from 'react';
import logger from '../utils/logger';

interface DragEndParams<T> {
  data: T[];
  from: number;
  to: number;
}

interface UseDragAndDropReturn<T> {
  data: T[];
  isDragging: boolean;
  onDragBegin: () => void;
  onDragEnd: (params: DragEndParams<T>) => void;
  onRelease: () => void;
  setData: (data: T[]) => void;
  revertData: () => void;
}

export function useDragAndDrop<T extends { id: string; position?: number }>(
  initialData: T[]
): UseDragAndDropReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previousData, setPreviousData] = useState<T[]>(initialData);

  /**
   * Called when drag gesture starts
   */
  const onDragBegin = useCallback(() => {
    setIsDragging(true);
    setPreviousData(data); // Store for potential rollback
    logger.info('🎯 Drag started');
  }, [data]);

  /**
   * Called when drag gesture ends
   * Optimistically updates UI and prepares for API sync
   */
  const onDragEnd = useCallback((params: DragEndParams<T>) => {
    const { data: newData, from, to } = params;

    logger.info(`🔄 Item moved from position ${from} to ${to}`);

    // Update data optimistically
    setData(newData);
    setIsDragging(false);
  }, []);

  /**
   * Called when drag is released (after onDragEnd)
   */
  const onRelease = useCallback(() => {
    setIsDragging(false);
    logger.info('✋ Drag released');
  }, []);

  /**
   * Revert to previous data state (for error handling)
   */
  const revertData = useCallback(() => {
    logger.warn('⏪ Reverting drag changes due to error');
    setData(previousData);
  }, [previousData]);

  return {
    data,
    isDragging,
    onDragBegin,
    onDragEnd,
    onRelease,
    setData,
    revertData,
  };
}

export default useDragAndDrop;
