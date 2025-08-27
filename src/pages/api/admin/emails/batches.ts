import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';

interface BatchesResponse {
  ok: boolean;
  message: string;
  data?: {
    batches: any[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BatchesResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  try {
    // Auth check: only admins may access email batches
    const supabase = createClient({ req, res });
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user;
    if (!currentUser) {
      return res.status(401).json({ ok: false, message: 'Unauthorized' });
    }
    const role = (currentUser.user_metadata as any)?.role;
    if (role !== 'admin' && role !== 'ADMIN') {
      return res.status(403).json({ ok: false, message: 'Forbidden' });
    }

    const adminSupabase = createAdminClient();
    
    // Get query parameters
    const campaignId = req.query.campaignId as string;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    
    if (!campaignId) {
      return res.status(400).json({ ok: false, message: 'Campaign ID is required' });
    }

    // Calculate offset
    const offset = (page - 1) * pageSize;
    
    // Get batches for the campaign
    const { data: batches, error, count } = await adminSupabase
      .from('email_batches')
      .select('*', { count: 'exact' })
      .eq('campaign_id', campaignId)
      .order('scheduled_time', { ascending: true })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      console.error('Error fetching email batches:', error);
      return res.status(500).json({ ok: false, message: `Failed to fetch email batches: ${error.message}` });
    }
    
    // Calculate total pages
    const totalPages = count ? Math.ceil(count / pageSize) : 0;
    
    // Return batches with pagination info
    return res.status(200).json({
      ok: true,
      message: 'Email batches fetched successfully',
      data: {
        batches: batches || [],
        pagination: {
          total: count || 0,
          page,
          pageSize,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error in batches API:', error);
    return res.status(500).json({ 
      ok: false, 
      message: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    });
  }
}
