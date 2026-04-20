import React, { useRef, useEffect } from "react";
import useHandTracker from "./HandTracker";

export default function CameraFeed() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useHandTracker(videoRef, canvasRef);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <canvas ref={canvasRef} />
    </div>
  );
}