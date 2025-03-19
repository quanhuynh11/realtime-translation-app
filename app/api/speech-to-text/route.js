const speech = require('@google-cloud/speech');

const client = new speech.SpeechClient();

export async function POST(req) {
    // const data = await req.json();

    const gcsUri = 'gs://cloud-samples-data/speech/brooklyn_bridge.raw';

    try {
        // The audio file's encoding, sample rate in hertz, and BCP-47 language code
        const audio = {
            uri: gcsUri,
        };
        const config = {
            encoding: 'LINEAR16',
            sampleRateHertz: 16000,
            languageCode: 'en-US',
        };
        const request = {
            audio: audio,
            config: config,
        };

        // Detects speech in the audio file
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        return new Response(transcription, { status: 200 });
    }
    catch (error) {
        return new Response(error.message, { status: 500 });
    }
}

