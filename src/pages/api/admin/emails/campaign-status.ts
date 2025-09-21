import type { NextApiRequest, NextApiResponse } from 'next';
import { createAdminClient } from '@/utils/supabase/server';

interface CampaignStatusResponse {
  ok: boolean;
  message: string;
  campaign?: {
    id: string;
    status: string;
    sent_count: number;
    failed_count: number;
    total_recipients: number;
    created_at: string;
  };
  batches?: Array<{
    id: string;
    status: string;
    sent_count: number;
    failed_count: number;
    scheduled_time: string;
    completed_at?: string;
  }>;
}

/**
 * API-Route für den Status einer E-Mail-Kampagne
 * Gibt Informationen über die Kampagne und deren Batches zurück
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<CampaignStatusResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, message: 'Method not allowed' });
  }

  const { campaignId } = req.query;

  if (!campaignId || typeof campaignId !== 'string') {
    return res.status(400).json({ ok: false, message: 'Campaign ID required' });
  }

  try {
    const adminSupabase = createAdminClient();

    // Hole Kampagnen-Informationen
    const { data: campaign, error: campaignError } = await adminSupabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) {
      console.error('Campaign error:', campaignError);
      return res.status(404).json({ ok: false, message: 'Campaign not found' });
    }

    // Hole alle Batches für diese Kampagne
    const { data: batches, error: batchesError } = await adminSupabase
      .from('email_batches')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('scheduled_time', { ascending: true });

    if (batchesError) {
      console.error('Batches error:', batchesError);
    }

    // Berechne Gesamt-Empfängerzahl
    const totalRecipients = batches?.reduce((sum, batch) => sum + (batch.recipient_count || 0), 0) || 0;

    return res.status(200).json({
      ok: true,
      message: 'Campaign status retrieved',
      campaign: {
        id: campaign.id,
        status: campaign.status,
        sent_count: campaign.sent_count || 0,
        failed_count: campaign.failed_count || 0,
        total_recipients: totalRecipients,
        created_at: campaign.created_at
      },
      batches: batches || []
    });

  } catch (error) {
    console.error('Campaign status error:', error);
    return res.status(500).json({
      ok: false,
      message: `Error retrieving campaign status: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
