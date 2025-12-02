
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
        console.log('FB Service: Fetching Ad Accounts...');
        const response = await fetch(`https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/me/adaccounts?fields=name,id&access_token=${accessToken}`);
        const data = await response.json();
        console.log('FB Service: Ad Accounts Response:', data);
        return data.data;
    },

    getCampaigns: async (adAccountId: string, accessToken: string, startDate?: Date, endDate?: Date): Promise<CampaignData[]> => {
        try {
            console.log(`FB Service: Fetching campaigns for account ${adAccountId}...`);

            // Define fields including nested insights
            const fields = [
                'id',
                'name',
                'status',
                'objective',
                'insights{spend,impressions,clicks,ctr,conversions,cost_per_conversion,cpm,actions}'
            ].join(',');

            // Date range logic
            let timeRange;
            if (startDate && endDate) {
                timeRange = {
                    since: startDate.toISOString().split('T')[0],
                    until: endDate.toISOString().split('T')[0]
                };
            } else {
                // Default to last 30 days
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);
                timeRange = {
                    since: thirtyDaysAgo.toISOString().split('T')[0],
                    until: today.toISOString().split('T')[0]
                };
            }

            const url = `https://graph.facebook.com/${FACEBOOK_GRAPH_API_VERSION}/${adAccountId}/campaigns?fields=${fields}&time_range=${JSON.stringify(timeRange)}&access_token=${accessToken}`;

            const response = await fetch(url);
            const data = await response.json();

            console.log(`FB Service: Campaigns Response for ${adAccountId}:`, data);

            if (!data.data) {
                if (data.error) {
                    console.error(`FB Service: Error for account ${adAccountId}:`, data.error);
                }
                return [];
            }

            return data.data.map((campaign: any) => {
                const insights = campaign.insights?.data?.[0] || {};

                // Parse conversions (can be complex in FB API)
                // 'conversions' field usually returns a list of actions. 
                // For simplicity, we'll try to use the 'conversions' metric if available directly, 
                // or sum up 'actions' that are 'purchase' or 'omni_purchase'.
                let conversions = 0;
                if (insights.conversions) {
                    // If it's a number/string
                    conversions = parseFloat(insights.conversions) || 0;
                } else if (insights.actions) {
                    const purchaseAction = insights.actions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'omni_purchase');
                    conversions = purchaseAction ? parseFloat(purchaseAction.value) : 0;
                }

                const spend = parseFloat(insights.spend) || 0;
                const salesValue = conversions * 150; // Mock ticket
                const roas = spend > 0 ? salesValue / spend : 0;

                return {
                    id: campaign.id,
                    name: campaign.name,
                    status: campaign.status.toLowerCase() === 'active' ? 'active' : 'paused',
                    spend: spend,
                    sales: conversions,
                    roas: parseFloat(roas.toFixed(2)),
                    cpa: parseFloat(insights.cost_per_conversion) || 0,
                    ctr: parseFloat(insights.ctr) || 0
                };
            });
        } catch (error) {
            console.error(`Error fetching campaigns for account ${adAccountId}:`, error);
            return [];
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
