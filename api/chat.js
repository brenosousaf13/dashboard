import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, userId, model = 'gpt-4.1-nano' } = req.body;

    if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Messages array is required' });
    }

    const systemPrompt = `
Você é um assistente especialista em e-commerce chamado "Noord AI". Seu objetivo é ajudar lojistas a melhorarem suas lojas online.

VOCÊ PODE AJUDAR COM:
- Descrições de produtos otimizadas para SEO
- Títulos de produtos atraentes
- Copy para anúncios (Facebook, Google, Instagram)
- Estratégias de precificação
- Dicas de fotografia de produtos
- Estratégias de upsell e cross-sell
- Textos para email marketing
- Descrições de categorias
- Meta descriptions para SEO
- Textos para banners e promoções
- Respostas para avaliações de clientes
- Políticas de troca e devolução
- Textos para FAQ
- Estratégias de frete
- Dicas gerais de e-commerce

VOCÊ NÃO DEVE:
- Responder sobre assuntos não relacionados a e-commerce
- Dar conselhos médicos, jurídicos ou financeiros específicos
- Criar conteúdo ofensivo ou inadequado
- Inventar dados ou estatísticas falsas

FORMATO DAS RESPOSTAS:
- Seja direto e prático
- Use bullet points quando apropriado
- Forneça exemplos quando possível
- Responda em português do Brasil
- Se o usuário pedir descrição de produto, peça detalhes como: nome do produto, características, público-alvo, diferenciais

Se o usuário perguntar algo fora do escopo de e-commerce, responda educadamente: "Sou especializado em ajudar com e-commerce. Posso te ajudar com descrições de produtos, copy para anúncios, estratégias de venda, ou algo relacionado à sua loja?"
`;

    try {
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemPrompt },
                ...messages
            ],
            temperature: 0.7,
        });

        const reply = completion.choices[0].message.content;

        res.status(200).json({ message: reply });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
}
