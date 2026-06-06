import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import styles from "./hero-particle-waves.module.css";

export function HeroParticleWaves() {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Sprite[]>([]);
  const materialRef = useRef<THREE.SpriteMaterial | null>(null);
  const animationRef = useRef<number>(0);
  const countRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const windowHalfRef = useRef({ x: 0, y: 0 });

  const DENSITY = 50;
  const SPEED = 0.08;
  const AMPLITUDE = 50;
  const SEPARATION = 100;
  const PARTICLE_COLOR = "#ffffff";
  const BG_COLOR = "#000000";

  const createParticleMaterial = useCallback((color: string): THREE.SpriteMaterial => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext("2d");
    if (!context) return new THREE.SpriteMaterial();

    context.clearRect(0, 0, 32, 32);
    context.fillStyle = color;
    context.beginPath();
    context.arc(16, 16, 12, 0, Math.PI * 2, true);
    context.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
    });
  }, []);

  const recreateParticles = useCallback(() => {
    if (!sceneRef.current || !materialRef.current) return;

    particlesRef.current.forEach((particle) => sceneRef.current?.remove(particle));
    particlesRef.current = [];

    for (let ix = 0; ix < DENSITY; ix++) {
      for (let iy = 0; iy < DENSITY; iy++) {
        const particle = new THREE.Sprite(materialRef.current.clone());
        particle.position.x = ix * SEPARATION - (DENSITY * SEPARATION) / 2;
        particle.position.z = iy * SEPARATION - (DENSITY * SEPARATION) / 2;
        particle.position.y = -400;
        particle.scale.setScalar(10);

        particlesRef.current.push(particle);
        sceneRef.current.add(particle);
      }
    }
  }, []);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    mouseRef.current.x = event.clientX - windowHalfRef.current.x;
    mouseRef.current.y = event.clientY - windowHalfRef.current.y;
  }, []);

  const handleResize = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current) return;

    windowHalfRef.current.x = window.innerWidth / 2;
    windowHalfRef.current.y = window.innerHeight / 2;
    cameraRef.current.aspect = window.innerWidth / window.innerHeight;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
  }, []);

  const animate = useCallback(() => {
    if (!cameraRef.current || !rendererRef.current || !sceneRef.current) return;

    animationRef.current = requestAnimationFrame(animate);

    cameraRef.current.position.x +=
      (mouseRef.current.x - cameraRef.current.position.x) * 0.05;
    cameraRef.current.position.y +=
      (-mouseRef.current.y * 0.5 - cameraRef.current.position.y) * 0.05;
    cameraRef.current.position.y = Math.min(Math.max(cameraRef.current.position.y, 400), 1200);
    cameraRef.current.lookAt(sceneRef.current.position);

    let i = 0;
    for (let ix = 0; ix < DENSITY; ix++) {
      for (let iy = 0; iy < DENSITY; iy++) {
        if (i < particlesRef.current.length) {
          const particle = particlesRef.current[i++];

          particle.position.y =
            -400 +
            Math.sin((ix + countRef.current) * 0.3) * AMPLITUDE +
            Math.sin((iy + countRef.current) * 0.5) * AMPLITUDE;

          const scale =
            (Math.sin((ix + countRef.current) * 0.3) + 1) * 2 +
            (Math.sin((iy + countRef.current) * 0.5) + 1) * 2;
          particle.scale.setScalar(scale * 2);
        }
      }
    }

    rendererRef.current.render(sceneRef.current, cameraRef.current);
    countRef.current += SPEED;
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof window === "undefined") return;

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1000;
    camera.position.y = 800;
    cameraRef.current = camera;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = styles.canvas;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    materialRef.current = createParticleMaterial(PARTICLE_COLOR);
    recreateParticles();

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);

      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }

      particlesRef.current.forEach((p) => {
        if (p.material instanceof THREE.Material) p.material.dispose();
      });
      renderer.dispose();
    };
  }, [createParticleMaterial, recreateParticles, handleMouseMove, handleResize, animate]);

  return <div ref={containerRef} className={styles.container} aria-hidden="true" />;
}
