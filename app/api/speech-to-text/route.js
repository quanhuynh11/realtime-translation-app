import { SpeechClient } from '@google-cloud/speech';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';

// Resolve the path to the credentials file
const credentialsPath = path.resolve('./config/google-key.json');

let client;

if (fs.existsSync(credentialsPath)) {
    // Read the JSON credentials file
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

    // Initialize SpeechClient with the parsed credentials
    client = new SpeechClient({
        credentials: credentials
    });

    console.log('Google Cloud Speech-to-Text client initialized successfully');
} else {
    console.error('Credentials file not found');
}

export async function POST(req) {
    const { searchParams } = new URL(req.url);

    const filename = searchParams.get('filename');
    const encoding = searchParams.get('encoding');
    const sampleRateHertz = searchParams.get('sampleRateHertz') || 16000;
    const languageCode = searchParams.get('languageCode');

    try {
        // Convert the audio file to WAV (if it's not already in that format)
        const wavFile = await convertToWav(filename);

        // Read the converted WAV file as base64
        const audio = {
            content: fs.readFileSync(wavFile).toString('base64'),
        };

        // Prepare the configuration for the speech recognition
        const config = {
            encoding: 'LINEAR16', // This should be LINEAR16 after conversion
            sampleRateHertz: sampleRateHertz,
            languageCode: languageCode,
        };

        const request = {
            config: config,
            audio: audio,
        };

        // Detect speech in the converted audio file
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');
        console.log('Transcription: ', transcription);

        // Clean up the temporary WAV file
        fs.unlinkSync(wavFile);

        return new Response(JSON.stringify(transcription), { status: 200 });
    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}

// Specify the path to ffmpeg binary if it's not in the PATH
ffmpeg.setFfmpegPath('./ffmpeg/bin/ffmpeg.exe'); // For example: 'C:/ffmpeg/bin/ffmpeg.exe' on Windows or '/usr/local/bin/ffmpeg' on macOS/Linux

async function convertToWav(inputFile) {
    return new Promise((resolve, reject) => {
        const outputFile = path.resolve('./temp/converted_audio.wav');

        ffmpeg(inputFile)
            .audioCodec('pcm_s16le') // LINEAR16 encoding
            .audioChannels(1) // Mono
            .audioFrequency(16000) // 16kHz sample rate
            .toFormat('wav')
            .on('end', () => {
                resolve(outputFile);
            })
            .on('error', (err) => {
                reject(new Error(`Error converting audio: ${err.message}`));
            })
            .save(outputFile);
    });
}
