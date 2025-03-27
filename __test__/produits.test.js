const request = require('supertest');
const express = require('express');
const routeModule = require('../endpoints');
const db = require('../db.test');

const app = express();
app.use(express.json());
app.use('/api', routeModule);

describe('Endpoints pour les produits', () => {
    test('GET /api/produits devrait retourner tous les produits', async () => {
        const response = await request(app).get('/api/produits');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
    });
})