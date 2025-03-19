import * as deepl from 'deepl-node';

export async function POST(req) {
    
    const { searchParams } = new URL(req.url);

    const text = searchParams.get('text');
    const targetLanguage = searchParams.get('targetLanguage');

    if (!text || !targetLanguage) {
        return new Response('Missing required parameters', { status: 400 });
    }
    
    try {
        const translator = new deepl.Translator(process.env.DEEPL_API_KEY);
    
        const result = await translator.translateText(text, null, targetLanguage);
        
        return new Response(JSON.stringify(result), { status: 200 });
    }
    catch (error) {
        return new Response(error.message, { status: 500 });
    }
}