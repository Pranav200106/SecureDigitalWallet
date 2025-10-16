import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';

/**
 * 3D Wallet Card Component
 * Represents a digital wallet with animated elements
 */
function WalletCard() {
  const walletRef = useRef();
  const chipRef = useRef();
  const shieldRef = useRef();

  // Animate the wallet with subtle rotation
  useFrame((state) => {
    try {
      const time = state.clock.elapsedTime;
      
      if (walletRef.current) {
        walletRef.current.rotation.y = Math.sin(time * 0.3) * 0.2;
        walletRef.current.rotation.x = Math.sin(time * 0.2) * 0.1;
      }
      
      if (chipRef.current) {
        chipRef.current.rotation.y += 0.01;
        const scale = 1 + Math.sin(time * 2) * 0.05;
        chipRef.current.scale.set(scale, scale, scale);
      }

      if (shieldRef.current) {
        shieldRef.current.rotation.z = Math.sin(time * 0.5) * 0.1;
      }
    } catch (error) {
      console.error('Animation error:', error);
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group ref={walletRef}>
        {/* Main Card Body */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial
            color="#1e293b"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Card Gradient Overlay */}
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[2.9, 1.9]} />
          <meshStandardMaterial
            color="#0ea5e9"
            transparent
            opacity={0.3}
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Chip */}
        <group ref={chipRef} position={[-0.8, 0.4, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.4, 0.05]} />
            <meshStandardMaterial
              color="#f59e0b"
              metalness={0.9}
              roughness={0.1}
              emissive="#f59e0b"
              emissiveIntensity={0.3}
            />
          </mesh>
          
          {/* Chip lines */}
          <mesh position={[0, 0, 0.03]}>
            <boxGeometry args={[0.3, 0.02, 0.01]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0.1, 0.03]}>
            <boxGeometry args={[0.3, 0.02, 0.01]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, -0.1, 0.03]}>
            <boxGeometry args={[0.3, 0.02, 0.01]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>

        {/* Security Shield Icon */}
        <group ref={shieldRef} position={[0.8, 0, 0.1]}>
          {/* Shield outline */}
          <mesh>
            <cylinderGeometry args={[0.4, 0.3, 0.05, 6]} />
            <meshStandardMaterial
              color="#10b981"
              metalness={0.8}
              roughness={0.2}
              emissive="#10b981"
              emissiveIntensity={0.2}
            />
          </mesh>
          
          {/* Shield center */}
          <mesh position={[0, 0, 0.03]}>
            <cylinderGeometry args={[0.25, 0.2, 0.02, 6]} />
            <meshStandardMaterial
              color="#22c55e"
              metalness={0.5}
              roughness={0.3}
            />
          </mesh>
        </group>

        {/* Card magnetic stripe */}
        <mesh position={[0, -0.5, 0.06]}>
          <boxGeometry args={[3, 0.3, 0.01]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* Decorative spheres */}
        <mesh position={[-1, -0.3, 0.15]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#0ea5e9"
            transparent
            opacity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
        
        <mesh position={[0.3, -0.4, 0.15]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshStandardMaterial
            color="#10b981"
            transparent
            opacity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}

/**
 * Scene with lighting
 */
function Scene() {
  return (
    <>
      <WalletCard />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#0ea5e9" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#10b981" />
      <spotLight
        position={[0, 5, 5]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
        color="#ffffff"
      />
    </>
  );
}

/**
 * Loading fallback component
 */
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#0ea5e9" wireframe />
      <ambientLight intensity={0.5} />
    </mesh>
  );
}

/**
 * Main 3D Wallet Model Component
 * Wrapper for the Canvas and 3D scene
 */
export default function WalletModel3D({ style }) {
  return (
    <div style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: "high-performance"
        }}
        style={{ background: 'transparent' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#000000', 0);
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          <Scene />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}