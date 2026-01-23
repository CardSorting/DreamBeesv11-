
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GalmixClient } from './GalmixClient';

describe('GalmixClient', () => {
    const baseUrl = 'http://localhost:8000';
    let client;

    beforeEach(() => {
        client = new GalmixClient(baseUrl);
        vi.stubGlobal('fetch', vi.fn());
    });

    it('should submit a job correctly', async () => {
        const mockSubmitResponse = {
            status: 202,
            json: async () => ({ job_id: 'test-job-id', status: 'pending' }),
        };
        const mockPollResponse = {
            status: 200,
            json: async () => ({ status: 'COMPLETED', result: 'base64data' }),
        };

        fetch.mockResolvedValueOnce(mockSubmitResponse)
            .mockResolvedValueOnce(mockPollResponse);

        const result = await client.generateImage('test prompt');

        expect(fetch).toHaveBeenCalledWith(`${baseUrl}/v1/generations`, expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
                prompt: 'test prompt',
                negative_prompt: '',
                steps: 30,
                guidance_scale: 7.5
            })
        }));

        expect(result.result).toBe('base64data');
    });

    it('should poll until completion', async () => {
        const mockSubmitResponse = {
            status: 202,
            json: async () => ({ job_id: 'test-job-id', status: 'pending' }),
        };
        const mockPendingResponse = {
            status: 200,
            json: async () => ({ status: 'PENDING' }),
        };
        const mockCompletedResponse = {
            status: 200,
            json: async () => ({ status: 'COMPLETED', result: 'done' }),
        };

        fetch.mockResolvedValueOnce(mockSubmitResponse)
            .mockResolvedValueOnce(mockPendingResponse)
            .mockResolvedValueOnce(mockCompletedResponse);

        const result = await client.generateImage('test prompt', { poll_interval: 10 });

        expect(fetch).toHaveBeenCalledTimes(3);
        expect(result.result).toBe('done');
    });

    it('should handle submission errors', async () => {
        fetch.mockResolvedValueOnce({
            status: 422,
            text: async () => 'Validation Error'
        });

        await expect(client.generateImage('test')).rejects.toThrow('Submission failed (422): Validation Error');
    });

    it('should handle job failure', async () => {
        fetch.mockResolvedValueOnce({
            status: 202,
            json: async () => ({ job_id: 'fail-job' })
        }).mockResolvedValueOnce({
            status: 200,
            json: async () => ({ status: 'FAILED', error: 'Something went wrong' })
        });

        await expect(client.generateImage('test')).rejects.toThrow('Job failed: Something went wrong');
    });
});
