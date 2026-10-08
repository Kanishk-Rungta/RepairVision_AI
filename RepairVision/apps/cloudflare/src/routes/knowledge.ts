import type { App } from '../lib/router.js';
import { knowledgeRetrieveSchema } from '@circularity/shared';
import { retrieveEvidence } from '../services/knowledge/retrieve.js';

export async function knowledgeRoutes(app: App): Promise<void> {
  app.addHook('preHandler', app.requireRole('super_admin', 'admin', 'repairer'));

  // Sources that back up each suggested fault: our own knowledge base, past
  // completed repairs, and links to iFixit guides.
  app.post('/api/knowledge/retrieve', async (request, reply) => {
    const parsed = knowledgeRetrieveSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.code(400).send({ error: 'Invalid request', code: 'knowledge/invalid' });
      return;
    }
    const { hypotheses, symptom, guideLinks } = parsed.data;
    return { evidence: await retrieveEvidence(hypotheses, symptom, { guideLinks }) };
  });
}
