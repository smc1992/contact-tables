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

        // Fetch email campaigns with count - vereinfachte Abfrage ohne verschachtelte Selektionen
        const { data, error, count } = await adminSupabase
          .from('email_campaigns')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (error) throw error;
        
        // Hole die Empfänger für jede Kampagne separat
        const processedData = await Promise.all(data?.map(async (campaign) => {
          // Hole die Empfänger für diese Kampagne
          const { data: recipientsData } = await adminSupabase
            .from('email_recipients')
            .select('status')
            .eq('campaign_id', campaign.id);
            
          const recipients = recipientsData || [];
          const sent = recipients.filter((r: { status: string }) => r.status === 'sent').length;
          const failed = recipients.filter((r: { status: string }) => r.status === 'failed').length;
          const pending = recipients.filter((r: { status: string }) => r.status === 'pending').length;
          const opened = recipients.filter((r: { status: string }) => r.status === 'opened').length;
          const total = recipients.length;
          
          // Hole Sender-Informationen, falls vorhanden
          let sender = { email: 'Unknown', name: 'Unknown' };
          if (campaign.sent_by) {
            const { data: senderData } = await adminSupabase
              .from('profiles')
              .select('email')
              .eq('id', campaign.sent_by)
              .single();
              
            if (senderData) {
              sender = {
                email: senderData.email || 'Unknown',
                name: 'Admin'
              };
            }
          }
          
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
              openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0
            }
          };
        }) || []);
        
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
