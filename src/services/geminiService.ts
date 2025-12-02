
export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
}

interface GeminiConfig {
    apiKey: string;
    model: string;
}

const CONFIG: GeminiConfig = {
    apiKey: "AIzaSyA8wRgjYqfLLx5u2OyKf86175D4Za20J5Q",
    model: "gemini-2.5-flash" // Using the requested model
};

const SYSTEM_INSTRUCTION = `
System Role - Assistente de Insights de E-commerce
Você é um Analista Especialista em E-commerce integrado a uma dashboard de análise de vendas. Seu papel é ajudar lojistas a tomar decisões estratégicas baseadas em dados reais de suas lojas WooCommerce.

IDENTIDADE E TOM
Nome: Co-piloto IA
Personalidade: Consultoria profissional, direto ao ponto, orientado a ação
Tom: Amigável mas profissional, confiante mas não arrogante
Linguagem: Clara, sem jargões técnicos desnecessários, use termos de e-commerce que o lojista entenda
Estilo: Respostas concisas (2-4 parágrafos), com dados específicos e ações práticas

CONTEXTO OPERACIONAL
Você tem acesso em tempo real aos seguintes dados da loja do cliente:
Dados Disponíveis: API woocommerce e dashboard.
Sempre que responder, leve em consideração os dados fornecidos no contexto da mensagem do usuário.
`;

export async function sendMessageToGemini(
    message: string,
    history: ChatMessage[],
    contextData: any
): Promise<string> {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.model}:generateContent?key=${CONFIG.apiKey}`;

        // Prepare context string from data
        const contextString = JSON.stringify(contextData, null, 2);

        // Construct the full prompt including context
        // We inject the context as a system-like instruction in the first turn or as part of the user message
        // For simplicity and effectiveness with Flash models, we'll prepend it to the latest user message or use a system instruction if supported by the endpoint structure used.
        // The generateContent endpoint supports 'system_instruction' but it's cleaner to just include it in the prompt for simple REST calls if we aren't using the SDK.
        // However, let's try to use the system_instruction field if we can, or just prepend.
        // Given the "gemini-2.5-flash" might be experimental or follow standard v1beta, let's stick to a safe approach:
        // Prepend system instruction and context to the conversation.

        const contents = [
            {
                role: "user",
                parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nDADOS DA LOJA (CONTEXTO ATUAL):\n${contextString}\n\n----------------\n` }]
            },
            ...history,
            {
                role: "user",
                parts: [{ text: message }]
            }
        ];

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: contents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API Error:", errorData);
            throw new Error(`Erro na API do Gemini: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error("Nenhuma resposta gerada pelo modelo.");
        }

    } catch (error) {
        console.error("Error sending message to Gemini:", error);
        throw error;
    }
}
