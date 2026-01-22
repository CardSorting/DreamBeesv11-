import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
    Sphere, MeshDistortMaterial, RoundedBox,
    Stars, Sparkles, PerspectiveCamera, ContactShadows,
    Trail, Box
} from '@react-three/drei';
import { Vector3, DoubleSide, MathUtils } from 'three';

// --- Geometry Components ---

const HoneyCell = ({ position, color = "#FFC107", scale = 1, rotation = [0, 0, 0] }) => (
    <mesh position={position} scale={scale} rotation={rotation}>
        <cylinderGeometry args={[1, 1, 0.5, 6]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.2} />
        {/* Inner Wax */}
        <mesh scale={[0.85, 0.85, 1.05]} position={[0, 0, 0.05]}>
            <cylinderGeometry args={[1, 1, 0.5, 6]} />
            <meshStandardMaterial color="#FFF176" roughness={0.3} emissive="#FFB74D" emissiveIntensity={0.2} />
        </mesh>
    </mesh>
);

const CrankHandle = ({ appState }) => {
    const ref = useRef();
    const _handleRef = useRef();
    const isSpinning = appState === 'SPINNING';

    useFrame((state, delta) => {
        if (!ref.current) return;

        // Safety: Clamp delta to avoid physics explosions on lag spikes
        const dt = Math.min(delta, 0.1);

        if (isSpinning) {
            // Spin fast!
            const nextRot = ref.current.rotation.x - 10 * dt;
            if (Number.isFinite(nextRot)) {
                ref.current.rotation.x = nextRot;
            }
        } else {
            // Gentle bob when idle
            const nextRot = Math.sin(state.clock.elapsedTime * 2) * 0.2;
            if (Number.isFinite(nextRot)) {
                ref.current.rotation.x = nextRot;
            }
        }
    });

    return (
        <group position={[2.4, 0, 0]} rotation={[0, 0, 0]}>
            {/* Axle */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[-0.2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.15, 0.6, 16]} />
                <meshStandardMaterial color="#5D4037" />
            </mesh>

            {/* The Arm (Rotates) */}
            <group ref={ref}>
                <mesh position={[0, 0.8, 0]}>
                    <boxGeometry args={[0.2, 1.6, 0.2]} />
                    <meshStandardMaterial color="#FF8F00" />
                </mesh>
                {/* The Knob */}
                <mesh position={[0.4, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.15, 0.15, 0.8, 16]} />
                    <meshStandardMaterial color="#3E2723" />
                </mesh>
            </group>
        </group>
    );
};

const HoneyCapsule = ({ position, color, seed, appState }) => {
    const ref = useRef();
    const [initialPos] = useState(() => new Vector3(...position));
    const isSpinning = appState === 'SPINNING';
    const isPrize = appState === 'PRIZE';

    useFrame((state, delta) => {
        if (!ref.current) return;

        // Safety: Clamp delta
        const dt = Math.min(delta, 0.1);

        if (isSpinning) {
            // VORTEX SWIRL: Smooth spiral motion instead of chaotic bouncing
            const time = state.clock.elapsedTime;

            // Smooth Vortex
            const angle = time * 3 + seed * 1.5;
            const y = Math.sin(time * 2 + seed) * 0.8;
            const x = Math.cos(angle) * 0.8;
            const z = Math.sin(angle) * 0.8;

            if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
                ref.current.position.lerp(new Vector3(
                    initialPos.x * 0.2 + x,
                    y,
                    initialPos.z * 0.2 + z
                ), 0.1);
            }

            const nextRotX = ref.current.rotation.x + 3 * dt;
            const nextRotY = ref.current.rotation.y + 3 * dt;

            if (Number.isFinite(nextRotX)) ref.current.rotation.x = nextRotX;
            if (Number.isFinite(nextRotY)) ref.current.rotation.y = nextRotY;

        } else if (isPrize) {
            // EJECTION: Launch out towards camera z-axis
            const targetPos = new Vector3(
                (seed % 3 - 1) * 2, // Spread X
                (seed % 2 === 0 ? 1 : -1) * 1.5, // Spread Y
                4 // Pop out Z
            );

            // Safer lerp
            ref.current.position.lerp(targetPos, 0.05);

            const nextRotX = ref.current.rotation.x + 0.5 * dt;
            if (Number.isFinite(nextRotX)) ref.current.rotation.x = nextRotX;

        } else {
            // Return to rest
            ref.current.position.lerp(initialPos, 0.1);
            // Gentle idle float
            const nextY = initialPos.y + Math.sin(state.clock.elapsedTime * 2 + seed) * 0.05;
            if (Number.isFinite(nextY)) ref.current.position.y = nextY;
        }
    });

    return (
        <group position={position} ref={ref}>
            <Sphere args={[0.65, 32, 32]}>
                <meshPhysicalMaterial
                    color={color}
                    transmission={0.4}
                    thickness={2}
                    roughness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                    ior={1.5}
                />
            </Sphere>
            {/* Inner Core */}
            <Sphere args={[0.35, 16, 16]}>
                <meshStandardMaterial color="#fff" emissive={color} emissiveIntensity={3} toneMapped={false} />
            </Sphere>
        </group>
    );
};

const FlyingBee = ({ offset = 0, radius = 2.5, speed = 1, appState }) => {
    const ref = useRef();
    const wingLeft = useRef();
    const wingRight = useRef();

    const isSpinning = appState === 'SPINNING';
    // Gentle speed increase, not frantic
    const currentSpeed = isSpinning ? speed * 1.5 : speed;

    useFrame((state, _delta) => {
        if (!ref.current) return;

        // Safety: Clamp delta
        // const dt = Math.min(delta, 0.1); // Not used for orbits directly in this math, but good practice if we needed it

        const time = state.clock.elapsedTime;
        const t = time * currentSpeed + offset;

        // Orbit logic
        const x = Math.sin(t) * radius;
        const z = Math.cos(t) * radius;
        const y = Math.sin(t * 2) * 0.5; // Bobbing

        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
            ref.current.position.set(x, y, z);
            // lookAt triggers matrix updates, ensure safe values
            if (Math.abs(x) > 0.001 || Math.abs(z) > 0.001) {
                ref.current.lookAt(0, y, 0);
            }
        }

        // FLAPPING WINGS
        // Flap speed is crazy high
        const flap = Math.sin(time * 60);
        const flapAngle = flap * 0.5;

        if (wingLeft.current && wingRight.current && Number.isFinite(flapAngle)) {
            wingLeft.current.rotation.z = 0.2 + flapAngle;
            wingRight.current.rotation.z = -0.2 - flapAngle;
        }
    });

    return (
        <group ref={ref}>
            {/* Trail only when fast */}
            {isSpinning && (
                <Trail width={0.4} length={6} color="#FFD700" attenuation={(t) => t * t}>
                    <mesh visible={false}><boxGeometry /></mesh>
                </Trail>
            )}

            {/* Bee Body */}
            <group rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                    <capsuleGeometry args={[0.15, 0.4, 4, 8]} />
                    <meshStandardMaterial color="#FFC107" />
                </mesh>

                {/* Stripes */}
                <mesh position={[0, 0.1, 0]}>
                    <torusGeometry args={[0.16, 0.03, 8, 16]} />
                    <meshBasicMaterial color="black" />
                </mesh>
                <mesh position={[0, -0.1, 0]}>
                    <torusGeometry args={[0.14, 0.03, 8, 16]} />
                    <meshBasicMaterial color="black" />
                </mesh>
            </group>

            {/* Wings */}
            <group position={[0, 0.15, 0]}>
                <mesh ref={wingLeft} position={[0.1, 0, 0]} rotation={[0, 0, 0.2]}>
                    <circleGeometry args={[0.25, 16]} />
                    <meshStandardMaterial color="white" transparent opacity={0.8} side={DoubleSide} />
                </mesh>
                <mesh ref={wingRight} position={[-0.1, 0, 0]} rotation={[0, 0, -0.2]}>
                    <circleGeometry args={[0.25, 16]} />
                    <meshStandardMaterial color="white" transparent opacity={0.8} side={DoubleSide} />
                </mesh>
            </group>
        </group>
    );
};

const BeeHiveMachine = ({ appState }) => {
    const groupRef = useRef();
    const isSpinning = appState === 'SPINNING';

    useFrame((state) => {
        if (!groupRef.current) return;

        // Spin Animation
        if (isSpinning) {
            // Rhythmic Processing Animation (Breathing/Chumming)
            const t = state.clock.elapsedTime;
            // Gentle scale pulse
            const scalePulse = 1 + Math.sin(t * 10) * 0.02;
            groupRef.current.scale.set(scalePulse, scalePulse, scalePulse);

            // Smooth vertical pump (like a piston)
            groupRef.current.position.y = Math.sin(t * 12) * 0.05;

            // Gentle rhythmic wobble (not chaotic)
            groupRef.current.rotation.z = Math.sin(t * 5) * 0.05;
            groupRef.current.rotation.x = Math.cos(t * 3) * 0.05;
        } else {
            // Gentle stabilization
            groupRef.current.scale.lerp(new Vector3(1, 1, 1), 0.1);
            // Gentle stabilization - Ensure we don't propagate NaNs
            if (!Number.isNaN(groupRef.current.rotation.y)) {
                groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, 0, 0.1);
            }
            if (!Number.isNaN(groupRef.current.position.x)) {
                groupRef.current.position.x = MathUtils.lerp(groupRef.current.position.x, 0, 0.1);
            }
            if (!Number.isNaN(groupRef.current.position.y)) {
                groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, 0, 0.1);
            }
            if (!Number.isNaN(groupRef.current.rotation.z)) {
                groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
            }
        }
    });

    return (
        <group>
            {/* The Hive Machine */}
            <group ref={groupRef}>
                {/* Base */}
                <mesh position={[0, -2.2, 0]}>
                    <cylinderGeometry args={[2.2, 2.8, 1.2, 6]} />
                    <meshStandardMaterial color="#FF8F00" metalness={0.3} roughness={0.4} />
                </mesh>

                {/* THE CRANK */}
                <CrankHandle appState={appState} />

                {/* Glass Globe */}
                <mesh position={[0, 0, 0]}>
                    <sphereGeometry args={[2.4, 48, 48]} />
                    <meshPhysicalMaterial
                        color={isSpinning ? "#FFD740" : "#FFF8E1"} // Flash yellow when spinning
                        transparent
                        opacity={0.3}
                        roughness={0}
                        metalness={0.1}
                        transmission={0.95}
                        thickness={1.5}
                        ior={1.2}
                    />
                </mesh>

                {/* Internal Honeycomb Structure */}
                <group scale={0.6}>
                    <HoneyCell position={[0, 0, 0]} color="#FFD54F" />
                    <HoneyCell position={[1.5, 0.8, 0]} rotation={[0, 0, 0.5]} color="#FFCA28" />
                    <HoneyCell position={[-1.5, -0.8, 0]} rotation={[0, 0, -0.5]} color="#FFB74D" />
                </group>

                {/* Capsules - Passing AppState for Popcorn Physics */}
                <HoneyCapsule appState={appState} position={[1.2, 0.5, 0.8]} color="#E91E63" seed={1} />
                <HoneyCapsule appState={appState} position={[-0.8, 1.2, -0.5]} color="#00BCD4" seed={2} />
                <HoneyCapsule appState={appState} position={[0.2, -1.2, 1.1]} color="#9C27B0" seed={3} />
                <HoneyCapsule appState={appState} position={[-1, -0.5, -1]} color="#69F0AE" seed={4} />

                {/* Top Cap / Crown */}
                <mesh position={[0, 2.4, 0]}>
                    <cylinderGeometry args={[0.8, 0.6, 0.6, 6]} />
                    <meshStandardMaterial color="#FF6F00" />
                </mesh>
                <mesh position={[0, 2.8, 0]}>
                    <torusGeometry args={[0.3, 0.08, 16, 32]} />
                    <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.5} />
                </mesh>
            </group>

            {/* Orbiting Bees */}
            <FlyingBee appState={appState} offset={0} radius={3.2} speed={0.8} />
            <FlyingBee appState={appState} offset={2} radius={3.5} speed={1.1} />
            <FlyingBee appState={appState} offset={4} radius={2.8} speed={0.7} />
            <FlyingBee appState={appState} offset={1} radius={4.0} speed={-0.6} />
        </group>
    );
};


const SceneContent = ({ appState }) => {
    const lightRef = useRef();

    useFrame((state, _delta) => {
        if (!lightRef.current) return;

        // Safety: Clamp delta
        // const dt = Math.min(delta, 0.1); 

        if (appState === 'SPINNING') {
            // Warm Amber Pulse (Breathing Light, not Strobe)
            const t = state.clock.elapsedTime * 4;
            // Smooth sine wave for intensity
            const intensity = 2.5 + Math.sin(t) * 1;
            if (Number.isFinite(intensity)) {
                lightRef.current.intensity = intensity;
            }

            // Warm Gold/Orange Shift
            const hue = 0.08 + Math.sin(t * 0.5) * 0.02; // Tight Gold/Orange range
            if (Number.isFinite(hue)) {
                lightRef.current.color.setHSL(hue, 1, 0.6);
            }
        } else {
            // Safe Lerp
            const nextIntensity = MathUtils.lerp(lightRef.current.intensity, 2, 0.1);
            if (Number.isFinite(nextIntensity)) {
                lightRef.current.intensity = nextIntensity;
            }
            lightRef.current.color.set("#FFF3E0");
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 9]} fov={45} />
            <ambientLight intensity={1.2} />

            {/* The Main Light (Disco Ready) - Removed castShadow to prevent self-shadow flashing artifacts */}
            <spotLight ref={lightRef} position={[10, 10, 10]} angle={0.25} penumbra={1} intensity={2} color="#FFF3E0" />

            <pointLight position={[-10, 5, -5]} intensity={1} color="#FFAB00" />

            <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={0.5} />

            {/* Passive particles (Dust/Pollen) */}
            <Sparkles count={80} scale={10} size={2} speed={0.4} opacity={0.5} color="#FFD700" />

            {appState === 'PRIZE' && (
                <Sparkles count={300} scale={12} size={10} speed={4} opacity={1} color="#FFF" noise={2} />
            )}

            {/* Interaction disabled to prevent crashes */}
            <group rotation={[0, 0.3, 0]}>
                <BeeHiveMachine appState={appState} />
            </group>

            {/* Shadow fixes: frames={1} forces continuous update to prevent temporal flickering */}
            <ContactShadows
                frames={1}
                position={[0, -4.5, 0]}
                opacity={0.4}
                scale={30}
                blur={1.5}
                far={20}
                resolution={256}
                color="#E65100"
            />
        </>
    );
};

const BeeCrateScene = ({ appState }) => {
    return (
        <div className="bee-crate-scene-container">
            <Canvas shadows dpr={[1, 2]}>
                <SceneContent appState={appState} />
            </Canvas>
        </div>
    );
};

export default BeeCrateScene;
