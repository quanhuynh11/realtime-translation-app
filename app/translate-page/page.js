"use client";

import { useState, useEffect, useRef } from "react";
import { FaMicrophoneAlt } from "react-icons/fa";
import { FaMicrophoneAltSlash } from "react-icons/fa";

export default function TranslatePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURI, setAudioURI] = useState(null);
    const mediaRecorderRef = useRef(null); // Using ref to store mediaRecorder
    const audioChunksRef = useRef([]); // Using ref to store audio chunks

    useEffect(() => {
        // Check if MediaRecorder is supported
        if (!navigator.mediaDevices || !window.MediaRecorder) {
            alert("Your browser does not support audio recording.");
            return;
        }

        // Request audio stream from the microphone
        navigator.mediaDevices
            .getUserMedia({ audio: true })
            .then((stream) => {
                const recorder = new MediaRecorder(stream);
                mediaRecorderRef.current = recorder; // Store recorder in the ref

                recorder.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data); // Store audio chunks in the ref
                };

                recorder.onstop = () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
                    const audioUrl = URL.createObjectURL(audioBlob);
                    setAudioURI(audioUrl); // Save the audio as URI
                    audioChunksRef.current = []; // Reset the audio chunks
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

    // Start or stop recording
    const toggleRecording = () => {
        if(audioURI) {
            setAudioURI(null);
        }

        if (isRecording) {
            mediaRecorderRef.current.stop();
        } else {
            mediaRecorderRef.current.start();
        }
        setIsRecording((prev) => !prev);
    };

    return (
        <section className="w-screen h-screen bg-slate-900 p-5 text-center">
            <h1 className="text-4xl font-bold">Translate</h1>

            <section className="flex mt-5 justify-center items-center mb-5">
                {isRecording ? (
                    <FaMicrophoneAlt className="text-6xl text-white" onClick={toggleRecording} />
                ) : (
                    <FaMicrophoneAltSlash className="text-6xl text-red-600" onClick={toggleRecording} />
                )}
            </section>

            {audioURI && (
                <div className="flex flex-col items-center">
                    <h3>Recorded Audio</h3>
                    <audio controls>
                        <source src={audioURI} type="audio/wav" />
                        Your browser does not support the audio element.
                    </audio>
                    <a href={audioURI} download="recorded-audio.wav">
                        Download Audio
                    </a>
                </div>
            )}
        </section>
    );
}
