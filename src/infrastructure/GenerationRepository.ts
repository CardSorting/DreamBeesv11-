/**
 * [LAYER: INFRASTRUCTURE]
 * Adapters and integrations for generation data persistence.
 * Interfaces defined in Domain.
 */

import { GenerationDetail, GenerationParameters } from '../domain/models/GenerationDetail';
import { validateGeneration } from '../domain/models/GenerationDetail';

// Custom error for permission/access issues
export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

export class GenerationRepository {
  private static LOCAL_STORAGE_KEY = 'lite_generations_v3';

  /**
   * Retrieves a single generation by ID.
   * Returns enriched data with metadata.
   */
  async getById(generationId: string): Promise<GenerationDetail> {
    const allGenerations = await this.getAllGenerations();
    const found = allGenerations.find(g => g.id === generationId);

    if (!found) {
      throw new Error(`Generation not found: ${generationId}`);
    }

    return this.enrichWithMetadata(found);
  }

  /**
   * Retrieves all generations stored locally.
   * Fallback to localStorage if Electron API is unavailable.
   */
  async getAllGenerations(): Promise<GenerationDetail[]> {
    if (window.electronAPI?.lite?.getGenerations) {
      try {
        const raw = await window.electronAPI.lite.getGenerations(1000);
        return raw.map(g => this.mapToDomainModel(g));
      } catch (error) {
        console.warn('[GenerationRepository] Electron API call failed, falling back to localStorage:', error);
      }
    }

    // Fallback to localStorage
    const stored = localStorage.getItem(GenerationRepository.LOCAL_STORAGE_KEY);
    if (!stored) return [];

    try {
      const raw = JSON.parse(stored) as any[];
      return raw.map(g => this.mapToDomainModel(g));
    } catch (error) {
      console.error('[GenerationRepository] Failed to parse stored generations:', error);
      return [];
    }
  }

  /**
   * Saves a generation to local storage.
   * Used for persistence when Electron API is available.
   */
  async saveGeneration(generation: any): Promise<void> {
    try {
      await window.electronAPI.lite.saveGeneration(generation);
      return;
    } catch (error) {
      console.warn('[GenerationRepository] Electron save failed, using localStorage fallback:', error);
    }

    // Fallback to localStorage
    const allGenerations = await this.getAllGenerations();
    const existingIndex = allGenerations.findIndex(g => g.id === generation.id);

    if (existingIndex >= 0) {
      allGenerations[existingIndex] = this.mapToDomainModel(generation);
    } else {
      allGenerations.unshift(this.mapToDomainModel(generation));
    }

    localStorage.setItem(GenerationRepository.LOCAL_STORAGE_KEY, JSON.stringify(allGenerations));
  }

  /**
   * Maps raw storage format to rich domain model.
   */
  private mapToDomainModel(raw: any): GenerationDetail {
    return {
      id: raw.id,
      userId: raw.userId,
      createdAt: raw.createdAt || Date.now(),
      imageUrl: raw.imageUrl,
      previewUrl: raw.previewUrl,
      variantUrls: raw.variantUrls,
      prompt: raw.prompt,
      negativePrompt: raw.negativePrompt,
      modelId: raw.modelId,
      modelType: raw.modelType,
      seed: raw.seed,
      parameters: {
        size: raw.params?.size,
        steps: raw.params?.steps,
        guidanceScale: raw.params?.guidanceScale,
        quality: raw.params?.quality,
        style: raw.params?.style,
        format: raw.params?.format
      },
      generationTime: raw.generationTime,
      revision: raw.revision || 1
    };
  }

  /**
   * Enriches raw data with additional metadata formatting.
   */
  private enrichWithMetadata(generation: GenerationDetail): GenerationDetail {
    // Apply formatting services from domain layer
    return generation;
  }
}