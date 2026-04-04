import request from 'supertest';

// Set env vars before creating the app so middleware picks them up at request time
process.env.API_KEY = 'test-key';

import { createApp } from '../src/index';

const app = createApp();

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('nexus-ultra-backend');
    expect(typeof res.body.timestamp).toBe('string');
  });
});

describe('POST /events', () => {
  it('saves a valid event and returns 201', async () => {
    const res = await request(app)
      .post('/events')
      .send({ type: 'page_view', payload: { page: '/home' } });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('page_view');
    expect(typeof res.body.id).toBe('string');
    expect(typeof res.body.timestamp).toBe('string');
  });

  it('returns 400 when type is missing', async () => {
    const res = await request(app)
      .post('/events')
      .send({ payload: { page: '/home' } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/type/i);
  });

  it('returns 400 when payload is not an object', async () => {
    const res = await request(app)
      .post('/events')
      .send({ type: 'click', payload: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/payload/i);
  });
});

describe('POST /feedback', () => {
  it('saves valid feedback and returns 201', async () => {
    const res = await request(app)
      .post('/feedback')
      .send({ message: 'Love the app!', rating: 5 });
    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Love the app!');
    expect(res.body.rating).toBe(5);
  });

  it('returns 400 when message is missing', async () => {
    const res = await request(app).post('/feedback').send({ rating: 3 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when rating is out of range', async () => {
    const res = await request(app)
      .post('/feedback')
      .send({ message: 'ok', rating: 10 });
    expect(res.status).toBe(400);
  });
});

describe('POST /agent/run', () => {
  it('returns 401 without API key', async () => {
    const res = await request(app)
      .post('/agent/run')
      .send({ agent: 'FeatureSuggestionAgent', input: {} });
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong API key', async () => {
    const res = await request(app)
      .post('/agent/run')
      .set('X-API-Key', 'wrong-key')
      .send({ agent: 'FeatureSuggestionAgent', input: {} });
    expect(res.status).toBe(401);
  });

  it('runs FeatureSuggestionAgent with valid key', async () => {
    const res = await request(app)
      .post('/agent/run')
      .set('X-API-Key', 'test-key')
      .send({
        agent: 'FeatureSuggestionAgent',
        input: { feedback: ['Users want dark mode'] },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.suggestions)).toBe(true);
  });

  it('returns 400 for unknown agent', async () => {
    const res = await request(app)
      .post('/agent/run')
      .set('X-API-Key', 'test-key')
      .send({ agent: 'NonExistentAgent', input: {} });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown-route');
    expect(res.status).toBe(404);
  });
});
