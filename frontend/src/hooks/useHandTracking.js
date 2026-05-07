import { useEffect, useRef } from "react";
import { Hands } from "@mediapipe/hands";

export default function useHandTracking(onResults) {
  const handsRef = useRef(null);
  const isProcessing = useRef(false);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 1,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;
  }, []);

  const sendFrame = async (video) => {
    if (!handsRef.current || isProcessing.current) return;

    isProcessing.current = true;

    try {
      await handsRef.current.send({ image: video });
    } catch (err) {
      console.error("MediaPipe error:", err);
    }

    isProcessing.current = false;
  };

  return sendFrame;
}