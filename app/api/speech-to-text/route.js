import { SpeechClient } from '@google-cloud/speech';
import path from 'path';
import process from 'process';
import fs from 'fs';

// Set credentials before initializing SpeechClient
const credentialsPath = path.resolve('./config/google-key.json');
if (fs.existsSync(credentialsPath)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

const client = new SpeechClient();

export async function POST(req) {

    const { searchParams } = new URL(req.url);

    const voiceURI = searchParams.get('voiceURI');

    const languageCode = searchParams.get('languageCode');

    // const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';

    try {
        const audio = { uri: voiceURI };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: languageCode,
        };
        const request = { audio, config };

        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        return new Response(JSON.stringify(transcription), { status: 200 });
    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
