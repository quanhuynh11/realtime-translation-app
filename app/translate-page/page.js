"use client";

import { useState, useEffect, useRef } from "react";
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from "react-icons/fa";

export default function TranslatePage() {

    // Keep track of the recording status 
    const [isRecording, setIsRecording] = useState(false);

    // Keep track of the audio URI
    const [audioURI, setAudioURI] = useState(null);

    // Keep track of the transcription, which is an array of objects with text and translated flags
    const [transcription, setTranscription] = useState([]);

    // mediaRecorderRef and audioChunksRef are used to record audio
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // streamRef is used to store the audio stream
    const streamRef = useRef(null);

    // Keep track of the translated text
    const [translatedText, setTranslatedText] = useState([]);

    // Keep track of the selected language for speech-to-text
    const [selectedIncomingLanguage, setSelectedIncomingLanguage] = useState("en-US");

    // Keep track of the selected translation language
    const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState("JA");

    // deeplLanguages is the list of languages supported by DeepL
    const deeplLanguages = require("../deepl-languages.json");

    const googleLanguages = require("../google-languages.json");

    /**
     * Start recording audio,
     * stop recording audio,
     * and send the recorded audio to the backend for transcription and translation.
     */
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
    }, [selectedIncomingLanguage, selectedTranslationLanguage]);

    useEffect(() => {
        if (transcription.length > 0) {
            handleTranslation(transcription);
        }
    }, [transcription]);
    

    const toggleRecording = () => {
        // setTranscription(null); // Clear previous transcriptions

        if (isRecording) {
            mediaRecorderRef.current.stop();
        } else {
            setAudioURI(null);
            mediaRecorderRef.current.start();
        }
        setIsRecording((prev) => !prev);
    };

    const appendTranscription = async (newData) => {

        if(newData === "" || newData === undefined) return;

        setTranscription((prevTranscription) => [
            ...prevTranscription,
            { text: newData, translated: false }
        ]);
    };
    


    const appendTranslation = async (newData, unTranslatedText) => {

        setTranscription((prevTranscription) => {
            return prevTranscription.map((entry) =>
                entry.text === unTranslatedText ? { ...entry, translated: true } : entry
            );
        });

        setTranslatedText((prevTranscription) => [
            ...prevTranscription,
            { text: newData, translated: true } // Store as an object with a translated flag
        ]);
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
            const response = await fetch(`/api/speech-to-text?filename=${filePath}&encoding=LINEAR16&sampleRateHertz=16000&languageCode=${selectedIncomingLanguage}`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                await appendTranscription(data);

            } else {
                console.error("Failed to transcribe audio");
            }
        }
        catch (error) {
            console.error("Error sending audio:", error);
        }
    };

    const handleTranslation = async (updatedTranscription) => {
        let translationText = updatedTranscription
            .filter((item) => item.translated === false)
            .map((item) => item.text)
            .join(" ");
    
        if (!translationText) return;
    
        try {
            const response = await fetch(`/api/deepl-translate?text=${translationText}&targetLanguage=${selectedTranslationLanguage}`, {
                method: "POST",
                body: JSON.stringify(updatedTranscription),
            });
    
            if (response.ok) {
                const data = await response.json();
                await appendTranslation(data.text, translationText);
            }
        } catch (error) {
            console.error("Error translating audio:", error);
        }
    };
    


    return (
        <section className="w-screen h-screen bg-slate-900 p-5 text-center text-white overflow-auto">
            <h1 className="text-4xl font-bold">Translate</h1>

            <section className="flex mt-5 justify-center items-center mb-5">
                {isRecording ? (
                    <FaMicrophoneAlt className="text-6xl text-white cursor-pointer" onClick={toggleRecording} />
                ) : (
                    <FaMicrophoneAltSlash className="text-6xl text-red-600 cursor-pointer" onClick={toggleRecording} />
                )}
            </section>

            {isRecording && (
                <p className="text-2xl">Listening...</p>
            )}

            <section className="mb-5">
                <select value={selectedIncomingLanguage} onChange={(e) => setSelectedIncomingLanguage(e.target.value)} className="bg-slate-900 w-1/6 h-10 text-center border-white border rounded-lg">
                    {googleLanguages.languages.map((item, index) => (
                        <option key={index} value={item.code}>{item.name}</option>
                    ))}
                </select>
            </section>

            <section className="my-5">
                <p>To</p>
            </section>

            <section className="mb-10">
                <select value={selectedTranslationLanguage} onChange={(e) => setSelectedTranslationLanguage(e.target.value)} className="bg-slate-900 w-1/6 h-10 text-center border-white border rounded-lg">
                    {deeplLanguages.languages.map((item, index) => (
                        <option key={index} value={item.code}>{item.name}</option>
                    ))}
                </select>
            </section>

            {/* {audioURI && (
                <div className="flex flex-col items-center">
                    <h3>Recorded Audio</h3>
                    <audio controls>
                        <source src={audioURI} type="audio/wav" />
                        Your browser does not support the audio element.
                    </audio>
                    <a href={audioURI} download="recorded-audio.wav" className="text-blue-400">Download Audio</a>
                </div>
            )} */}

            <button onClick={() => { setTranscription([]); setTranslatedText([]); }} className="bg-red-600 text-white py-2 px-4 rounded-lg text-2xl hover:cursor-pointer hover:bg-red-800">Clear Transcription</button>
            {transcription && (
                <div className="mt-5 p-4 bg-gray-800 rounded-md h-3/4">
                    <h3 className="text-lg font-semibold">Transcription:</h3>
                    <section className="flex justify-around items-center">
                        <section>
                            {transcription.map((item, index) => (
                                <p className="text-2xl" key={index}>{item.text}</p>
                            ))}
                        </section>
                        <section>
                            <p className="">Translates To:</p>
                        </section>
                        <section>
                            {translatedText.map((item, index) => (
                                <p className="text-2xl" key={index}>{item.text}</p>
                            ))}
                        </section>
                    </section>
                </div>
            )}

        </section>
    );
}
