/**
 * [LAYER: CORE]
 * Coordinates domain logic between UI and infrastructure adapters.
 */

import { GenerationDetail } from '../domain/models/GenerationDetail';
import { GenerationRepository, PermissionError } from '../infrastructure/GenerationRepository';
import { formatParameters } from '../domain/services/GenerationMetadataFormatter';

export class GenerationOrchestrator {
  constructor(private repository: GenerationRepository) {}

  /**
   * Main entry point: fetches full generation details for display.
   */
  async fetchFullGeneration(generationId: string): Promise<GenerationDetail> {
    try {
      const raw = await this.repository.getById(generationId);
      
      // Enrich raw data with formatting logic
      const enriched = this.enrichWithMetadata(raw);
      
      return enriched;
    } catch (error) {
      if (error instanceof PermissionError) {
        throw new PermissionError(`Access denied: ${error.message}`);
      }
      throw new Error(`Failed to load generation: ${generationId}`);
    }
  }

  /**
   * Fetches N most recent generations for the user.
   */
  async fetchRecentGenerations(limit: number = 20): Promise<GenerationDetail[]> {
    try {
      const rawGenerations = await this.repository.getAllGenerations();
      
      // Sort by createdAt (newest first)
      const sorted = [...rawGenerations].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      
      // Limit results
      return sorted.slice(0, limit);
    } catch (error) {
      throw new Error('Failed to load recent generations');
    }
  }

  /**
   * Formats raw generation data into enriched domain model.
   * Applies formatting services from domain layer.
   */
  private enrichWithMetadata(raw: any): GenerationDetail {
    return {
      id: raw.id,
      userId: raw.userId,
      createdAt: raw.createdAt || Date.now(),
      imageUrl: raw.imageUrl,
      previewUrl: raw.previewUrl,
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
}