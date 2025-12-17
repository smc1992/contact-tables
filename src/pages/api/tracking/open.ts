import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get tracking parameters
  const { rid, cid } = req.query;
  
  if (!rid || !cid || typeof rid !== 'string' || typeof cid !== 'string') {
    // Return a transparent 1x1 pixel GIF
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
    return;
  }

  try {
    const adminSupabase = createAdminClient();
    
    // Update recipient record with open information
    await adminSupabase
      .from('email_recipients')
      .update({
        opened: true,
        opened_at: new Date().toISOString(),
        open_count: adminSupabase.rpc('increment_open_count', { row_id: rid })
      })
      .eq('id', rid);
    
    // Update campaign stats
    await adminSupabase
      .from('email_campaigns')
      .update({
        open_count: adminSupabase.rpc('increment_campaign_open_count', { campaign_id: cid })
      })
      .eq('id', cid);
  } catch (error) {
    console.error('Error tracking email open:', error);
  }

  // Always return a transparent 1x1 pixel GIF
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
}
