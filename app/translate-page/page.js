"use client";

import { useState, useEffect, useRef } from "react";
import { FaMicrophoneAlt, FaMicrophoneAltSlash } from "react-icons/fa";

export default function TranslatePage() {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURI, setAudioURI] = useState(null);
    const [transcription, setTranscription] = useState([
        { text: "Hello World", translated: false },
    ]);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null);

    const [translatedText, setTranslatedText] = useState([]);

    const [selectedIncomingLanguage, setSelectedIncomingLanguage] = useState("en-US");

    const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState("JA");

    const deeplLanguages = require("../deepl-languages.json");

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
    }, [selectedIncomingLanguage]);

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

    const appendTranscription = (newData) => {
        setTranscription((prevTranscription) => [
            ...prevTranscription,
            { text: newData, translated: false } // Store as an object with a translated flag
        ]);
    };

    const appendTranslation = (newData) => {
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
                appendTranscription(data);

            } else {
                console.error("Failed to transcribe audio");
            }
        }
        catch (error) {
            console.error("Error sending audio:", error);
        }

        // let translationText = transcription.filter((item) => item.translated === false).map((item) => item.text).join(" ");

        let translationText = "Hello World";

        try {
            const response = await fetch(`/api/deepl-translate?text=${translationText}&targetLanguage=${selectedTranslationLanguage}`, {
                method: "POST",
                body: transcription,
            })

            if (response.ok) {
                const data = await response.json();

                appendTranslation(data.text);
            }
        }
        catch (error) {
            console.error("Error sending audio:", error);
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
                    <option value="en-US">English</option>
                    <option value="es-ES">Spanish</option>
                    <option value="fr-FR">French</option>
                    <option value="de-DE">German</option>
                    <option value="it-IT">Italian</option>
                    <option value="pt-BR">Portuguese</option>
                    <option value="ru-RU">Russian</option>
                    <option value="zh-CN">Chinese</option>
                    <option value="ja-JP">Japanese</option>
                    <option value="ko-KR">Korean</option>
                    <option value="ar-AR">Arabic</option>
                    <option value="hi-IN">Hindi</option>
                    <option value="bn-BD">Bengali</option>
                    <option value="ta-IN">Tamil</option>
                    <option value="te-IN">Telugu</option>
                    <option value="ur-PK">Urdu</option>
                </select>
            </section>

            <section>
                <p>To</p>
            </section>

            <section>
                <select value={selectedTranslationLanguage} onChange={(e) => selectedTranslationLanguage(e.target.value)} className="bg-slate-900 w-1/6 h-10 text-center border-white border rounded-lg">

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
