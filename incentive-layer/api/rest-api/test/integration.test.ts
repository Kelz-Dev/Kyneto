/**
 * Kyneto REST API Integration Tests
 * ==================================
 * Tests authenticated endpoints with EIP-191 signature verification.
 * Uses in-memory mock for PostgreSQL to avoid external dependencies.
 */

import request from 'supertest';
import { ethers } from 'ethers';

// Mock pg before importing server
const mockQuery = jest.fn();
const mockPool = jest.fn().mockImplementation(() => ({
    query: mockQuery,
    on: jest.fn(),
    totalCount: 0,
    idleCount: 0,
}));

jest.mock('pg', () => ({
    Pool: mockPool,
}));

// Import after mock
import { app } from '../src/server';

describe('Kyneto REST API — Authenticated Endpoints', () => {
    const testWallet = ethers.Wallet.createRandom();
    const API_URL = process.env.API_URL || 'http://localhost:3000';

    beforeEach(() => {
        mockQuery.mockReset();
    });

    describe('POST /api/heartbeat', () => {
        it('should reject heartbeat without signature', async () => {
            const res = await request(app)
                .post('/api/heartbeat')
                .send({ provider_address: testWallet.address });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/signature required/i);
        });

        it('should reject heartbeat with invalid signature', async () => {
            const res = await request(app)
                .post('/api/heartbeat')
                .send({
                    provider_address: testWallet.address,
                    signature: '0xinvalid'
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/invalid signature/i);
        });

        it('should accept heartbeat with valid EIP-191 signature', async () => {
            const message = 'Kyneto Provider Heartbeat';
            const signature = await testWallet.signMessage(message);

            mockQuery.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post('/api/heartbeat')
                .send({
                    provider_address: testWallet.address,
                    signature: signature,
                    storage: { pledged_capacity_gb: 100, used_gb: 50 }
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(mockQuery).toHaveBeenCalled();
        });
    });

    describe('DELETE /api/deals/:id', () => {
        const dealId = 'D-1234567890-abc123';

        it('should reject cancellation without signature', async () => {
            mockQuery.mockResolvedValueOnce({
                rows: [{
                    deal_id: dealId,
                    status: 'active',
                    client_address: testWallet.address.toLowerCase()
                }]
            });

            const res = await request(app)
                .delete(`/api/deals/${dealId}`)
                .send({ client_address: testWallet.address });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/signature required/i);
        });

        it('should reject cancellation with wrong signer', async () => {
            const wrongWallet = ethers.Wallet.createRandom();
            const message = `cancel-deal-${dealId}`;
            const signature = await wrongWallet.signMessage(message);

            mockQuery.mockResolvedValueOnce({
                rows: [{
                    deal_id: dealId,
                    status: 'active',
                    client_address: testWallet.address.toLowerCase()
                }]
            });

            const res = await request(app)
                .delete(`/api/deals/${dealId}`)
                .send({
                    client_address: testWallet.address,
                    signature: signature
                });

            expect(res.status).toBe(401);
            expect(res.body.error).toMatch(/invalid signature/i);
        });

        it('should allow cancellation with valid owner signature', async () => {
            const message = `cancel-deal-${dealId}`;
            const signature = await testWallet.signMessage(message);

            mockQuery
                .mockResolvedValueOnce({
                    rows: [{
                        deal_id: dealId,
                        status: 'active',
                        client_address: testWallet.address.toLowerCase()
                    }]
                })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] })
                .mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .delete(`/api/deals/${dealId}`)
                .send({
                    client_address: testWallet.address,
                    signature: signature
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('POST /api/deals/:dealId/key', () => {
        const dealId = 'D-1234567890-abc123';

        it('should reject key storage without signature', async () => {
            const res = await request(app)
                .post(`/api/deals/${dealId}/key`)
                .send({
                    encrypted_key: '0xdeadbeef',
                    encryption_iv: '0x12345678',
                    encryption_auth_tag: '0xabcdef',
                    client_address: testWallet.address
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toMatch(/signature required/i);
        });

        it('should store key with valid owner signature', async () => {
            const message = `store-key-${dealId}`;
            const signature = await testWallet.signMessage(message);

            mockQuery.mockResolvedValueOnce({ rows: [] });

            const res = await request(app)
                .post(`/api/deals/${dealId}/key`)
                .send({
                    encrypted_key: '0xdeadbeef',
                    encryption_iv: '0x12345678',
                    encryption_auth_tag: '0xabcdef',
                    client_address: testWallet.address,
                    signature: signature
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toMatch(/stored/i);
        });
    });

    describe('GET /health', () => {
        it('should return healthy status', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('healthy');
        });
    });

    describe('GET /metrics', () => {
        it('should return Prometheus metrics', async () => {
            const res = await request(app).get('/metrics');
            expect(res.status).toBe(200);
            expect(res.text).toContain('http_requests_total');
        });
    });
});
