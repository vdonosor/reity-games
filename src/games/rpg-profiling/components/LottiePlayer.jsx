import React, { memo, useEffect, useRef } from "react";
import lottie from "lottie-web";

function LottiePlayer({
  animationData,
  loop = true,
  autoplay = true,
  className = "",
  speed = 1,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // Basic validation: Lottie expects an object with 'v' and 'layers'
    if (
      !animationData ||
      typeof animationData !== "object" ||
      !animationData.v ||
      !Array.isArray(animationData.layers)
    ) {
      return;
    }
    let instance;
    try {
      instance = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay,
        animationData,
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
      instance.setSpeed(speed);
    } catch (e) {
      // Silently fail to avoid crashing the app on invalid Lottie JSON
      console.warn("Lottie failed to load animation", e);
    }
    return () => {
      try {
        instance && instance.destroy();
      } catch {
        /* ignore */
      }
    };
  }, [animationData, loop, autoplay, speed]);

  return <div ref={containerRef} className={className} />;
}

export default memo(LottiePlayer);
