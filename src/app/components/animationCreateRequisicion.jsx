"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFolder } from "@fortawesome/free-solid-svg-icons";

export default function SaveAnimation({ autoPlay = false, onFinish }) {
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  const folderLidRef = useRef(null);
  const textRef = useRef(null);

  const handleSave = () => {
    const tl = gsap.timeline();

    tl.to(fileRef.current, {
      y: -100,
      duration: 0.6,
      ease: "power2.out",
    })
      .to(
        folderLidRef.current,
        {
          rotateX: 60,
          transformOrigin: "bottom center",
          duration: 0.3,
          ease: "power2.inOut",
        },
        "-=0.2"
      )
      .to(fileRef.current, {
        y: 30,
        scale: 0.6,
        opacity: 0,
        duration: 0.7,
        ease: "power2.in",
      })
      .to(
        folderLidRef.current,
        {
          rotateX: 0,
          duration: 0.3,
          ease: "back.inOut(1.2)",
        },
        "-=0.2"
      )
      .to(folderRef.current, {
        scale: 1.2,
        duration: 0.15,
        yoyo: true,
        repeat: 1,
        ease: "back.inOut(2)",
      })
      .fromTo(
        textRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );

    // llamar onFinish cuando termine la timeline
    tl.call(() => {
      if (typeof onFinish === "function") onFinish();
    }, null, ">");
  };

  useEffect(() => {
    if (autoPlay) {
      // dar un pequeño delay para que todo pinte y la animación se vea bien
      const id = setTimeout(() => handleSave(), 150);
      return () => clearTimeout(id);
    }
  }, [autoPlay]);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "25px",
        backgroundColor: "#ffffff7a",
        overflow: "hidden",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 9999,
      }}
    >
      {/* Contenedor principal animación */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "240px",
          width: "240px",
        }}
      >
        {/* Archivo: envolver en div con ref */}
        <div
          ref={fileRef}
          style={{
            position: "absolute",
            bottom: "90px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FontAwesomeIcon icon={faFileExcel} size="5x" color="#1d6f42" />
        </div>

        {/* Folder */}
        <div
          style={{
            position: "relative",
            width: "100px",
            height: "80px",
            perspective: "400px",
          }}
        >
          {/* Parte trasera (wrapper con ref) */}
          <div
            ref={folderRef}
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
            }}
          >
            <FontAwesomeIcon icon={faFolder} size="5x" color="#f7c948" />
          </div>

          {/* Tapa */}
          <div
            ref={folderLidRef}
            style={{
              position: "absolute",
              bottom: "40px",
              left: "8px",
              width: "85px",
              height: "28px",
              backgroundColor: "#f7c948",
              borderRadius: "4px",
              transformOrigin: "bottom center",
              transformStyle: "preserve-3d",
              zIndex: 2,
            }}
          />
        </div>
      </div>

      {!autoPlay && (
        <button
          onClick={handleSave}
          style={{
            marginTop: "20px",
            padding: "10px 24px",
            borderRadius: "8px",
            background: "#1d6f42",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "15px",
            transition: "all 0.3s ease",
          }}
        >
          Guardar documento
        </button>
      )}
    </div>
  );
}