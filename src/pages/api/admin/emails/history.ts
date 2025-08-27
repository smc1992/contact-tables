import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient, createClient } from '@/utils/supabase/server';

interface ApiResponse {
  ok: boolean;
  message: string;
  data?: any;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  // Auth check: only admins may access email history
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

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      try {
        // Get query parameters for pagination
        const page = parseInt(req.query.page as string) || 1;
        const pageSize = parseInt(req.query.pageSize as string) || 10;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // Fetch email campaigns with count
        const { data, error, count } = await adminSupabase
          .from('email_campaigns')
          .select(`
            id, 
            subject, 
            created_at, 
            sent_by,
            template_id,
            status,
            profiles!email_campaigns_sent_by_fkey (email, user_metadata),
            email_recipients (id, status)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) throw error;
        
        // Process the data to calculate stats
        const processedData = data?.map(campaign => {
          const recipients = campaign.email_recipients || [];
          const sent = recipients.filter(r => r.status === 'sent').length;
          const failed = recipients.filter(r => r.status === 'failed').length;
          const pending = recipients.filter(r => r.status === 'pending').length;
          const total = recipients.length;
          
          // Format sender info
          const sender = campaign.profiles && Array.isArray(campaign.profiles) && campaign.profiles.length > 0 ? {
            email: campaign.profiles[0].email,
            name: campaign.profiles[0].user_metadata?.first_name 
              ? `${campaign.profiles[0].user_metadata.first_name} ${campaign.profiles[0].user_metadata.last_name || ''}`
              : 'Admin'
          } : { email: 'Unknown', name: 'Unknown' };
          
          return {
            id: campaign.id,
            subject: campaign.subject,
            created_at: campaign.created_at,
            template_id: campaign.template_id,
            status: campaign.status,
            sender,
            stats: {
              total,
              sent,
              failed,
              pending,
              openRate: sent > 0 ? Math.round((recipients.filter(r => r.status === 'opened').length / sent) * 100) : 0
            }
          };
        });
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Email history retrieved successfully', 
          data: {
            campaigns: processedData,
            pagination: {
              total: count || 0,
              page,
              pageSize,
              totalPages: Math.ceil((count || 0) / pageSize)
            }
          }
        });
      } catch (error) {
        console.error('Error fetching email history:', error);
        return res.status(500).json({ 
          ok: false, 
          message: `Error fetching email history: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
    case 'DELETE':
      try {
        const { id } = req.query;
        
        if (!id) {
          return res.status(400).json({ 
            ok: false, 
            message: 'Missing campaign ID' 
          });
        }
        
        // First delete recipients
        const { error: recipientsError } = await adminSupabase
          .from('email_recipients')
          .delete()
          .eq('campaign_id', id);
        
        if (recipientsError) throw recipientsError;
        
        // Then delete the campaign
        const { error: campaignError } = await adminSupabase
          .from('email_campaigns')
          .delete()
          .eq('id', id);
        
        if (campaignError) throw campaignError;
        
        return res.status(200).json({ 
          ok: true, 
          message: 'Email campaign deleted successfully' 
        });
      } catch (error) {
        console.error('Error deleting email campaign:', error);
        return res.status(500).json({ 
          ok: false, 
          message: `Error deleting campaign: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
      
    default:
      return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }
}
