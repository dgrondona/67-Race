import React, { useEffect, useRef } from "react";
import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";

export default function HandTracker() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const landmarkerRef = useRef(null);
  const animationRef = useRef(null);
  const runningRef = useRef(false);

  useEffect(() => {
    let stream;

    const init = async () => {
      // Load MediaPipe
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );

      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 2
      });

      // Camera
      stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      runningRef.current = true;
      loop();
    };

    const loop = () => {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !landmarkerRef.current
      ) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const results = landmarkerRef.current.detectForVideo(
        video,
        performance.now()
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const drawingUtils = new DrawingUtils(ctx);

      if (results.landmarks) {
        for (const landmarks of results.landmarks) {
          // 🔴 red dots
          drawingUtils.drawLandmarks(landmarks, {
            color: "#ff0000",
            radius: 4
          });

          // optional: hand connections (comment out if you want lighter CPU)
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            { color: "#00ff00", lineWidth: 2 }
          );
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    init();

    return () => {
      runningRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        style={{ width: "100%", maxWidth: 600 }}
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0
        }}
      />
    </div>
  );
}