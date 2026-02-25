"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/common/Button";

interface AudioRecorderProps {
  onRecord?: (audioBlob: Blob) => void;
  onTranscript?: (text: string) => void;
}

export const AudioRecorder = ({
  onRecord,
  onTranscript: _onTranscript,
}: AudioRecorderProps) => {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((time) => time + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        onRecord?.(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError("");
    } catch (_err) {
      setError("マイクへのアクセスが拒否されました");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {isRecording && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="animate-pulse text-2xl">🔴</span>
              <span className="text-red-900 font-semibold">録音中</span>
            </div>
            <span className="text-red-700 font-mono">
              {formatTime(recordingTime)}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-lg p-4 border border-red-200">
          <p className="text-red-900 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!isRecording ? (
          <Button onClick={startRecording} className="flex-1">
            🎤 録音開始
          </Button>
        ) : (
          <Button onClick={stopRecording} variant="danger" className="flex-1">
            ⏹️ 停止
          </Button>
        )}
      </div>
    </div>
  );
};
