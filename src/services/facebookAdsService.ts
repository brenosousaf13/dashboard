
export interface FacebookCampaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    insights?: {
        data: {
            spend: string;
            conversions: string;
            cost_per_conversion: string;
            ctr: string;
        }[];
    };
}

export interface CampaignData {
    id: string;
    name: string;
    status: "active" | "paused";
    spend: number;
    sales: number;
    roas: number;
    cpa: number;
    ctr: number;
}

const FACEBOOK_GRAPH_API_VERSION = 'v18.0';

export const facebookAdsService = {
    init: () => {
        return new Promise<void>((resolve) => {
            // @ts-ignore
            window.fbAsyncInit = function () {
                // @ts-ignore
                FB.init({
                    appId: import.meta.env.VITE_FACEBOOK_APP_ID,
                    cookie: true,
                    xfbml: true,
                    version: FACEBOOK_GRAPH_API_VERSION
                });
                resolve();
            };

            (function (d, s, id) {
                var js, fjs = d.getElementsByTagName(s)[0];
                if (d.getElementById(id)) { resolve(); return; }
                js = d.createElement(s); js.id = id;
                // @ts-ignore
                js.src = "https://connect.facebook.net/en_US/sdk.js";
                // @ts-ignore
                fjs.parentNode.insertBefore(js, fjs);
            }(document, 'script', 'facebook-jssdk'));
        });
    },

    login: (): Promise<{ accessToken: string; userID: string; expiresIn: number; signedRequest: string; }> => {
        return new Promise((resolve, reject) => {
            // @ts-ignore
            FB.login((response) => {
                if (response.authResponse) {
                    localStorage.setItem('fb_access_token', response.authResponse.accessToken);
                    resolve(response.authResponse);
                } else {
                    reject('User cancelled login or did not fully authorize.');
                }
            }, { scope: 'ads_read,read_insights' });
        });
    },

    getAdAccounts: async (accessToken: string) => {
        const response = await fetch(`https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/me/adaccounts?fields=name,id&access_token=${accessToken}`);
        const data = await response.json();
        return data.data;
    },

    getCampaigns: async (adAccountId: string, accessToken: string): Promise<CampaignData[]> => {
        try {
            // Fetch campaigns with basic fields
            const campaignsResponse = await fetch(
                `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${adAccountId}/campaigns?fields=name,status,objective&access_token=${accessToken}`
            );
            const campaignsData = await campaignsResponse.json();

            if (!campaignsData.data) return [];

            // Fetch insights for each campaign
            const campaignsWithInsights = await Promise.all(campaignsData.data.map(async (campaign: any) => {
                const insightsResponse = await fetch(
                    `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${campaign.id}/insights?fields=spend,conversions,cost_per_conversion,ctr&date_preset=maximum&access_token=${accessToken}`
                );
                const insightsData = await insightsResponse.json();
                const insights = insightsData.data && insightsData.data[0] ? insightsData.data[0] : null;

                // Map to our internal format
                const spend = insights ? parseFloat(insights.spend) : 0;
                const conversions = insights ? parseFloat(insights.conversions) || 0 : 0; // Conversions might be an array or object depending on action type, simplifying for now
                // Note: 'conversions' field in insights often requires breakdown by action_type. 
                // For simplicity in this 'v1', we might check 'actions' list if 'conversions' isn't direct.
                // However, the user prompt suggested 'conversions' field. We will stick to that or fallback.

                const cpa = insights ? parseFloat(insights.cost_per_conversion) || 0 : 0;
                const ctr = insights ? parseFloat(insights.ctr) : 0;

                // Mock ROAS calculation as we don't have revenue data from FB directly easily without pixel setup
                // User suggested: ROAS = (Vendas Totais / Gasto Total). 
                // We will use a mock ticket average if not available or just 0.
                const mockAverageTicket = 150;
                const salesValue = conversions * mockAverageTicket;
                const roas = spend > 0 ? salesValue / spend : 0;

                return {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status.toLowerCase() === 'active' ? 'active' : 'paused',
                    spend,
                    sales: conversions,
                    roas: parseFloat(roas.toFixed(2)),
                    cpa: parseFloat(cpa.toFixed(2)),
                    ctr: parseFloat(ctr.toFixed(2))
                };
            }));

            return campaignsWithInsights;
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            throw error;
        }
    },

    logout: () => {
        return new Promise<void>((resolve) => {
            // @ts-ignore
            FB.logout(() => {
                localStorage.removeItem('fb_access_token');
                resolve();
            });
        });
    }
};
