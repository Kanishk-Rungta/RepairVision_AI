// =============================================================================
//  RepairVision AI Diagnosis: calls to the Worker
//  ---------------------------------------------------------------------------
//  The browser never talks to Google. It sends the case to our own API, which
//  holds the Gemini key, and gets a checked diagnosis back.
// =============================================================================
import { api, type ApiError } from '$lib/api';
import { prepareImage } from '$lib/imagePrep';
import {
  REPAIRVISION_LIMITS,
  type DeviceContext,
  type DiagnosisResponse,
  type DiagnosisStatus,
  type FollowupRequest,
  type Likelihood,
} from '@circularity/shared';

export interface RepairVisionStatus {
  configured: boolean;
  model: string;
  maxRounds: number;
  maxImageBytes: number;
}

export function getStatus(): Promise<RepairVisionStatus> {
  return api<RepairVisionStatus>('/api/repairvision/status');
}

export function analyze(context: DeviceContext, image: Blob | null): Promise<DiagnosisResponse> {
  const form = new FormData();
  form.append('deviceName', context.deviceName);
  if (context.manufacturer) form.append('manufacturer', context.manufacturer);
  if (context.model) form.append('model', context.model);
  form.append('problem', context.problem);
  if (image) form.append('image', image, image.type === 'image/png' ? 'photo.png' : 'photo.jpg');
  return api<DiagnosisResponse>('/api/repairvision/analyze', { method: 'POST', formData: form });
}

export function followup(request: FollowupRequest): Promise<DiagnosisResponse> {
  return api<DiagnosisResponse>('/api/repairvision/followup', { method: 'POST', json: request });
}

/**
 * A chosen or captured photo, shrunk to the size Gemma needs and re-encoded,
 * which also drops camera metadata. Throws a readable message if it cannot
 * be used.
 */
export async function preparePhoto(file: Blob): Promise<Blob> {
  const accepted: readonly string[] = REPAIRVISION_LIMITS.imageMimeTypes;
  if (!accepted.includes(file.type)) {
    throw new Error('Use a JPEG, PNG or WebP photo. iPhone HEIC photos need converting first.');
  }
  const asFile = file instanceof File ? file : new File([file], 'photo', { type: file.type });
  const blob = await prepareImage(asFile, { maxLongestEdge: REPAIRVISION_LIMITS.imageLongestEdge, quality: 0.85 });
  if (blob.size > REPAIRVISION_LIMITS.maxImageBytes) {
    throw new Error('That photo is still too large after shrinking. Try a smaller one.');
  }
  return blob;
}

/** A message for a failed call, in words a volunteer can act on. */
export function errorMessage(err: unknown): string {
  const e = err as Partial<ApiError> | null;
  switch (e?.code) {
    case 'ai/not_configured':
      return 'AI diagnosis is not set up on this hub yet. An admin needs to add the GEMINI_API_KEY secret.';
    case 'ai/user_rate_limited':
      return 'You have used this hour’s AI diagnoses. Try again a little later.';
    case 'ai/rate_limited':
      return 'Gemma is busy (the API rate limit was reached). Wait a minute and try again.';
    case 'ai/timeout':
      return 'Gemma took too long to answer. Try again.';
    case 'validation/failed':
      return 'Some details are missing or too long. Check the form and try again.';
  }
  if (e?.status === 413) return 'That photo is too large. Try a smaller one.';
  if (e?.status === 0 || e?.message === 'Failed to fetch') return 'Could not reach the hub. Check your connection.';
  return e?.message || 'Something went wrong. Try again.';
}

export const LIKELIHOOD_LABEL: Record<Likelihood, string> = {
  high: 'High likelihood',
  medium: 'Medium likelihood',
  low: 'Low likelihood',
};

export const LIKELIHOOD_TONE: Record<Likelihood, string> = {
  high: 'bg-brand-100 text-brand-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-700',
};

export const STATUS_LABEL: Record<DiagnosisStatus, string> = {
  needs_more_information: 'More information needed',
  likely_cause_identified: 'Likely cause identified (not yet verified)',
  refer_to_professional: 'Refer to a qualified technician',
};

export const STATUS_TONE: Record<DiagnosisStatus, string> = {
  needs_more_information: 'bg-blue-100 text-blue-800',
  likely_cause_identified: 'bg-emerald-100 text-emerald-800',
  refer_to_professional: 'bg-rose-100 text-rose-800',
};
