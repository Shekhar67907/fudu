// src/hooks/useAutoSave.ts
import { useEffect, useRef, useCallback } from 'react';
import { PrescriptionData } from '../types';
import { prescriptionService } from '../Services/supabaseService';

interface UseAutoSaveOptions {
  delay?: number; // Delay in milliseconds before auto-saving
  enabled?: boolean; // Whether auto-save is enabled
  onSaveSuccess?: (data: any) => void;
  onSaveError?: (error: string) => void;
}

interface ServiceResponse {
  success: boolean;
  data?: {
    id: string;
    [key: string]: any;
  };
  error?: string;
}

export const useAutoSave = (
  prescriptionData: PrescriptionData,
  options: UseAutoSaveOptions = {}
) => {
  const {
    delay = 2000, // 2 seconds default delay
    enabled = true,
    onSaveSuccess,
    onSaveError
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prescriptionIdRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);

  // Check if prescription has required fields for saving
  const hasRequiredFields = useCallback((data: PrescriptionData): boolean => {
    return !!(data.prescribedBy && data.name);
  }, []);

  // Perform the auto-save
  const performAutoSave = useCallback(async (data: PrescriptionData) => {
    if (isSavingRef.current || !hasRequiredFields(data)) {
      return;
    }

    isSavingRef.current = true;

    try {
      const result = await prescriptionService.autoSavePrescription(
        data, 
        prescriptionIdRef.current || undefined
      ) as ServiceResponse;

      if (result.success) {
        // Store the prescription ID for future updates
        if (result.data?.id) {
          prescriptionIdRef.current = result.data.id;
        }
        onSaveSuccess?.(result.data);
        console.log('Auto-save successful');
      } else {
        onSaveError?.(result.error || 'Auto-save failed');
        console.error('Auto-save failed:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Auto-save error';
      onSaveError?.(errorMessage);
      console.error('Auto-save error:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [hasRequiredFields, onSaveSuccess, onSaveError]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      performAutoSave(prescriptionData);
    }, delay);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [prescriptionData, delay, enabled, performAutoSave]);

  // Manual save function
  const manualSave = useCallback(async () => {
    console.log('useAutoSave: manualSave triggered');
    return await performAutoSave(prescriptionData);
  }, [prescriptionData, performAutoSave]);

  // Reset prescription ID (for new prescriptions)
  const resetPrescriptionId = useCallback(() => {
    prescriptionIdRef.current = null;
  }, []);

  return {
    manualSave,
    resetPrescriptionId,
    isSaving: isSavingRef.current,
    prescriptionId: prescriptionIdRef.current
  };
};