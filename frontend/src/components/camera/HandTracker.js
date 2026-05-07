import React, { useEffect, useRef } from "react";
import {
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils
} from "@mediapipe/tasks-vision";
import use67Counter from "../../hooks/use67Counter";

export default function HandTracker({ userId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const landmarkerRef = useRef(null);
  const animationRef = useRef(null);

  const { count, updateWrist } = use67Counter(userId);

  const MIN_VIS = 0.6;

  useEffect(() => {
    let stream;

    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );

      // Pose instead of Hand
      landmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numPoses: 1
      });

      stream = await navigator.mediaDevices.getUserMedia({ video: true });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

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

      if (results.landmarks && results.landmarks[0]) {
        const pose = results.landmarks[0];

        const leftWrist = pose[15];
        if (leftWrist && leftWrist.visibility > MIN_VIS) {
          updateWrist("left", leftWrist.y, false);

          drawingUtils.drawLandmarks([leftWrist], {
            color: "#ff0000",
            radius: 6
          });
        }

        const rightWrist = pose[16];
        if (rightWrist && rightWrist.visibility > MIN_VIS) {
          updateWrist("right", rightWrist.y, true);

          drawingUtils.drawLandmarks([rightWrist], {
            color: "#ff0000",
            radius: 6
          });
        }
      }

      animationRef.current = requestAnimationFrame(loop);
    };

    init();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <video
        ref={videoRef}
        style={{
          width: "100%",
          maxWidth: 600,
          transform: "scaleX(-1)"
        }}
        muted
        playsInline
      />

      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          transform: "scaleX(-1)",
          pointerEvents: "none"
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          fontSize: 28,
          fontWeight: "bold",
          color: "red"
        }}
      >
        67: {count}
      </div>
    </div>
  );
}