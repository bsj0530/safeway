import { useEffect, useState } from "react";

declare global {
  interface Window {
    kakao: any;
  }
}

export default function useKakaoLoader() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const existingScript = document.querySelector(
      'script[data-kakao-map="true"]',
    ) as HTMLScriptElement | null;

    const handleLoad = () => {
      if (!window.kakao || !window.kakao.maps) return;

      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    };

    if (window.kakao && window.kakao.maps) {
      handleLoad();
      return;
    }

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${
        import.meta.env.VITE_KAKAO_MAP_KEY
      }&autoload=false&libraries=services`;
      script.async = true;
      script.dataset.kakaoMap = "true";
      script.onload = handleLoad;
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", handleLoad);
      return () => existingScript.removeEventListener("load", handleLoad);
    }
  }, []);

  return isLoaded;
}
