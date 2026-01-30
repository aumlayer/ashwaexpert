"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function WaterPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#0a4d8c") },
      uColor2: { value: new THREE.Color("#1e88e5") },
      uColor3: { value: new THREE.Color("#4fc3f7") },
    }),
    []
  );

  const vertexShader = `
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      vUv = uv;
      vec3 pos = position;
      
      float wave1 = sin(pos.x * 2.0 + uTime * 0.5) * 0.15;
      float wave2 = sin(pos.y * 3.0 + uTime * 0.7) * 0.1;
      float wave3 = sin((pos.x + pos.y) * 1.5 + uTime * 0.3) * 0.12;
      float wave4 = cos(pos.x * 4.0 - uTime * 0.4) * 0.08;
      
      pos.z = wave1 + wave2 + wave3 + wave4;
      vElevation = pos.z;
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform float uTime;
    varying vec2 vUv;
    varying float vElevation;
    
    void main() {
      float mixStrength = (vElevation + 0.3) * 1.5;
      vec3 color = mix(uColor1, uColor2, mixStrength);
      color = mix(color, uColor3, smoothstep(0.2, 0.5, mixStrength));
      
      // Add shimmer effect
      float shimmer = sin(vUv.x * 20.0 + uTime) * sin(vUv.y * 20.0 + uTime * 0.5) * 0.1;
      color += shimmer;
      
      // Add foam-like highlights
      float foam = smoothstep(0.3, 0.35, vElevation) * 0.3;
      color += foam;
      
      gl_FragColor = vec4(color, 0.9);
    }
  `;

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, -1, 0]}>
      <planeGeometry args={[15, 15, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function FloatingDroplets() {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const { positions, scales } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 10;
      pos[i * 3 + 1] = Math.random() * 5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
      scl[i] = 0.02 + Math.random() * 0.05;
    }
    return { positions: pos, scales: scl };
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime;
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      dummy.position.set(
        positions[i * 3] + Math.sin(time * 0.5 + i) * 0.3,
        ((positions[i * 3 + 1] + time * 0.2 + i * 0.1) % 5),
        positions[i * 3 + 2] + Math.cos(time * 0.3 + i) * 0.3
      );
      dummy.scale.setScalar(scales[i] * (1 + Math.sin(time + i) * 0.3));
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshStandardMaterial
        color="#4fc3f7"
        transparent
        opacity={0.6}
        emissive="#1e88e5"
        emissiveIntensity={0.3}
      />
    </instancedMesh>
  );
}

export function WaterBackground() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-5, 3, -5]} intensity={0.5} color="#4fc3f7" />
        <WaterPlane />
        <FloatingDroplets />
        <fog attach="fog" args={["#0a4d8c", 5, 15]} />
      </Canvas>
      {/* Gradient overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90" />
    </div>
  );
}
