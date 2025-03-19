"use client";

import { useState, useEffect, useRef } from "react";
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from "react-icons/fa";

export default function TranslatePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURI, setAudioURI] = useState(null);
    const [transcription, setTranscription] = useState(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    const [currentAudio, setCurrentAudio] = useState(null);

    useEffect(() => {
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            alert("Your browser does not support audio recording.");
            return;
        }

        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                streamRef.current = stream;
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder;

                recorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                recorder.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setAudioURI(audioUrl);
                    audioChunksRef.current = [];
                    console.log(audioUrl);
                    // Send the recorded audio to the backend for transcription
                    await uploadAudio(audioBlob);
                };
            })
            .catch((err) => {
                console.error("Error accessing audio stream:", err);
            });

        return () => {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const toggleRecording = () => {
        setTranscription(null); // Clear previous transcriptions

        if (isRecording) {
            mediaRecorderRef.current.stop();
        } else {
            setAudioURI(null);
            mediaRecorderRef.current.start();
        }
        setIsRecording((prev) => !prev);
    };

    const uploadAudio = async (audioBlob) => {

        let filePath;

        const fileExtension = audioBlob.type.split("/")[1]; // Extract extension from MIME type (e.g., "wav")
        let newFilename = `${Math.floor(Math.random() * 10000)}_audio.${fileExtension}`;

        const formData = new FormData();
        formData.append("file", audioBlob);
        formData.append("newFilename", newFilename);

        try {
            const response = await fetch("/api/upload-audio", {
                method: "POST",
                body: formData,
            });
            if (!response.ok) {
                throw new Error(`Failed to upload file: ${response.statusText}`);
            }

            const data = await response.json();
            filePath = data.filePath;

        } catch (error) {
            console.error(error);
        }

        try {
            const response = await fetch(`/api/speech-to-text?filename=${filePath}&encoding=LINEAR16&sampleRateHertz=16000&languageCode=en-US`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                setTranscription(data);
            } else {
                console.error("Failed to transcribe audio");
            }
        }
        catch (error) {
            console.error("Error sending audio:", error);
        }
    };

    return (
        <section className="w-screen h-screen bg-slate-900 p-5 text-center text-white">
            <h1 className="text-4xl font-bold">Translate</h1>

            <section className="flex mt-5 justify-center items-center mb-5">
                {isRecording ? (
                    <FaMicrophoneAlt className="text-6xl text-white cursor-pointer" onClick={toggleRecording} />
                ) : (
                    <FaMicrophoneAltSlash className="text-6xl text-red-600 cursor-pointer" onClick={toggleRecording} />
                )}
            </section>

            {audioURI && (
                <div className="flex flex-col items-center">
                    <h3>Recorded Audio</h3>
                    <audio controls>
                        <source src={audioURI} type="audio/wav" />
                        Your browser does not support the audio element.
                    </audio>
                    <a href={audioURI} download="recorded-audio.wav" className="text-blue-400">Download Audio</a>
                </div>
            )}

            {transcription && (
                <div className="mt-5 p-4 bg-gray-800 rounded-md">
                    <h3 className="text-lg font-semibold">Transcription:</h3>
                    <p className="text-gray-300">{transcription}</p>
                </div>
            )}
        </section>
    );
}
