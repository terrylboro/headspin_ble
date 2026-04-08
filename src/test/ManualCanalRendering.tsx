import { useEffect, useRef, useState } from "react"
import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { getAlignment, getCanalAlignment, meshPartsLength } from "../utils/alignment";
import { BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, BACKGR_COLOUR, GREEN_COLOUR, RED_COLOUR} from "../utils/config";
import { changeQuaternionBase } from "../utils/changeBase";
import {applyYawOffset} from "../utils/applyYawOffset"
import { useTreatment } from "../context/TreatmentProvider";

import { Slider, Stack, Text, Group, Button } from '@mantine/core';
import { TreatmentStage } from "../types/treatmentTypes";

import { createThickArrow } from "../custom/thickArrow";


const ManualCanalRendering = () => {

    // const { matrixRef, offsetMatrixRef, affectedEar } = useTreatment();

    const { state, dispatch, affectedCanal } = useTreatment();

    const [active, setActive] = useState(true)
        const handleChange = () => {
            setActive(!active)
        }
    
    // Using TreatmentProvider context to get the necessary variables for rendering and alignment
    // const {affectedEar, affectedCanal, matrixRef, offsetMatrixRef, currentStage, alignmentRef, alignedRef} = useTreatment();
    const matrixRef = useRef(new THREE.Matrix4())
    const offsetMatrixRef = useRef(new THREE.Matrix4())
    const affectedEar = "left"
    // const affectedCanal: CanalType = "posterior";
    const currentStage = 0
    const alignmentRef = useRef<number>(0)
    const alignedRef = useRef<boolean>(false)

    const camera = useRef<THREE.Camera>()
    const scene = useRef<THREE.Scene>()
    const renderer = useRef<THREE.WebGLRenderer>()
    const meshParts = useRef<THREE.Mesh[]>([])

    const canalColours = {"posterior": BLUE_COLOUR, "anterior": ORANGE_COLOUR, "lateral": BROWN_COLOUR, "all": 0, "unselected": 0x333333}
    const coloursAll = [BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, 0x333333, 0x666666]

    const [yaw, setYaw] = useState(0)
    const [pitch, setPitch] = useState(0)
    const [roll, setRoll] = useState(0)

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const canalGroup = useRef<THREE.Group>(new THREE.Group());

    const stage1ArrowRef = useRef<THREE.ArrowHelper | null>(null);
    const stage1Direction = new THREE.Vector3(1, -1, -0.2).normalize(); // test direction
    const stage1Origin = new THREE.Vector3(-1.3, 2, -2.3);

    const stage2ArrowRef = useRef<THREE.ArrowHelper | null>(null);
    const stage2Direction = new THREE.Vector3(0, 0, -1).normalize(); // test direction
    const stage2Origin = new THREE.Vector3(-1.6, 2.2, 3);

    const stage3ArrowRef = useRef<THREE.ArrowHelper | null>(null);
    const stage3Direction = new THREE.Vector3(0.7, -1, 0.2).normalize(); // test direction
    const stage3Origin = new THREE.Vector3(-2.3, 2.2, 2.5);

    const stage4ArrowRef = useRef<THREE.Group | null>(null);

    // Encode the canal directions in the local frame (i.e. relative to whole mesh) by segment and canal
    const canalDirections = {
        "posterior": {
            "directions": [
                new THREE.Vector3(1, -1, -0.2).normalize(), // stage 1 direction
                new THREE.Vector3(0, 0, -1).normalize(), // stage 2 direction
                // new THREE.Vector3(0.7, -1, 0.2).normalize() // stage 3 direction
                new THREE.Vector3(-0.7, +1, -0.2).normalize(), // stage 3 direction
                new THREE.Vector3(-0.9, 0.15, 1).normalize() // stage 4 direction
            ],
            "origins": [
                new THREE.Vector3(-1.3, 2, -2.3), // stage 1 origin
                new THREE.Vector3(-1.6, 2.2, 3), // stage 2 origin
                // new THREE.Vector3(-2.3, 2.2, 2.5) // stage 3 origin (reverse)
                // new THREE.Vector3(0, -1, 3) // stage 3 origin
                new THREE.Vector3(1.9, -4, 3.5), // stage 3 origin
                new THREE.Vector3(3, -2.4, 0.2) // stage 4 origin
            ],  
        },
        "anterior": {
            // TODO: update with actual directions and origins
            "directions": [
                new THREE.Vector3(0, 0, -1).normalize(), // stage 1 direction
            ],
            "origins": [
                new THREE.Vector3(-1.6, 2.2, 3), // stage 1 origin
            ]
        },
        "lateral": {
            // TODO: update with actual directions and origins
            "directions": [
                new THREE.Vector3(0, 0, -1).normalize(), // stage 1 direction
            ],
            "origins": [
                new THREE.Vector3(-1.6, 2.2, 3), // stage 1 origin
            ]
        },
    }

    // Function to clear the scene and reset variables when canal changes
    function clearCanalGroup() {
        canalGroup.current.children.forEach((child) => {
        if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
        }

        if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material;
        if (Array.isArray(mat)) {
            mat.forEach(m => m.dispose());
        } else {
            mat.dispose();
        }
        }
    });

    canalGroup.current.clear();
    }


    useEffect(() => {

        // Renderer initialisation
        // const canvas = document.getElementById("manualCanalCanvas" + state.affectedCanal) as HTMLCanvasElement
        if (!canvasRef.current) return;
        renderer.current = new THREE.WebGLRenderer({canvas: canvasRef.current, antialias: true})
        const size = active ? document.documentElement.clientWidth * 0.207 : 0
        renderer.current.setSize(size, size)

        // Clear previous canal from scene
        clearCanalGroup()
        meshParts.current = [] // flush any previous meshes from memory


        // Scene initialisation
        scene.current = new THREE.Scene()
        scene.current.background = new THREE.Color(BACKGR_COLOUR)

        // Camera initialisation
        camera.current = new THREE.PerspectiveCamera(15, 1)
        camera.current.position.set(40, 0, 0) 
        camera.current.lookAt(0, 0, 0)
        camera.current.rotation.z = Math.PI / 2;


        // Add lights
        const sectionHighlight = new THREE.AmbientLight(0xffffff, 0.8)
        scene.current.add(sectionHighlight)

        const pointLight1 = new THREE.PointLight(0xffffff, 200)
        pointLight1.castShadow = true
        pointLight1.position.set(0, 0, 35)
        scene.current.add(pointLight1)

        const pointLight2 = new THREE.PointLight(0xffffff, 1300)
        pointLight2.castShadow = true
        pointLight2.position.set(0, 15, 8)
        scene.current.add(pointLight2)

        const pointLight3 = new THREE.PointLight(0xffffff, 200)
        pointLight3.castShadow = true
        pointLight3.position.set(0, -20, 0)
        scene.current.add(pointLight3)

        // Add canalGroup which allows arrows to be grouped with mesh
        scene.current!.add(canalGroup.current);

        // Add helper arrows
        stage1ArrowRef.current = new THREE.ArrowHelper(
            canalDirections["posterior"].directions[0],
            canalDirections["posterior"].origins[0],
            10,
            ORANGE_COLOUR
        );
        canalGroup.current.add(stage1ArrowRef.current);

        stage2ArrowRef.current = new THREE.ArrowHelper(
            canalDirections["posterior"].directions[1],
            canalDirections["posterior"].origins[1],
            10,
            ORANGE_COLOUR
        );
        canalGroup.current.add(stage2ArrowRef.current);

        stage3ArrowRef.current = new THREE.ArrowHelper(
            canalDirections["posterior"].directions[2],
            canalDirections["posterior"].origins[2],
            10,
            ORANGE_COLOUR
        );
        canalGroup.current.add(stage3ArrowRef.current);

        stage4ArrowRef.current = createThickArrow(
            canalDirections["posterior"].directions[3],
            canalDirections["posterior"].origins[3],
            7,
            (alignedRef.current) ? GREEN_COLOUR : ORANGE_COLOUR,
            alignmentRef.current,
        );
        canalGroup.current.add(stage4ArrowRef.current);

        const clock = new THREE.Clock();

        // Load Canal Mesh
        const loader = new PLYLoader()
        let color = 0
        for (let i = 0; i < meshPartsLength[state.affectedCanal ? state.affectedCanal : 5]; i++) {
            const meshPath = "rh_meshes/" + state.affectedCanal + "_" + i.toString() + ".ply"
            loader.load(meshPath, (geometry) => {


                // if ((i+1 === currentStage && affectedCanal === "lateral") || 
                //                 (i === currentStage && affectedCanal !== "lateral")) color = RED_COLOUR
                // else color = canalColours[affectedCanal ? affectedCanal : "unselected"]

                // if (i-1 === state.stage && i !== 0) color = RED_COLOUR
                // else color = canalColours[state.affectedCanal ? state.affectedCanal : "unselected"]

                // // color = i === 1 ? RED_COLOUR : BLUE_COLOUR;
                color = canalColours["unselected"] //coloursAll[i] // 

                const material = new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide, flatShading: true})
                const loadedMesh = new THREE.Mesh(geometry, material)
                
                loadedMesh.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1))
                // scene.current!.add(loadedMesh)
                canalGroup.current.add(loadedMesh)
                meshParts.current.push(loadedMesh)
            })
        }

        let loop: number = requestAnimationFrame(animate)
        function animate() {

            // Clock for pulsing effects
            const t = clock.getElapsedTime();
            const opacity = 0.95 + 0.3 * Math.sin(t * 4);

            // console.log(meshParts.current[meshPartsLength[state.affectedCanal ? state.affectedCanal : 5] ])

            if (meshParts.current[meshPartsLength[state.affectedCanal ? state.affectedCanal : 5] -1]) {

            // Rotate the group
            const qB = new THREE.Quaternion();
            changeQuaternionBase(matrixRef.current.clone(), qB);
            canalGroup.current.setRotationFromQuaternion(qB);

            const segmentID = (state.stage===TreatmentStage.COMPLETE) ? 3 : ((state.affectedCanal !== "lateral") ? state.stage + 1 : state.stage + 1);

            // update alignment variable for the affected canal
            // alignmentRef!.current = getAlignment(state.affectedCanal!, state.stage, meshParts.current[segmentID])
            
            const canalAlignRes =  getCanalAlignment(
                canalDirections["posterior"].directions[segmentID!-1], // the target direction for the current stage and canal
                // canalDirections["posterior"].directions[segmentID!],
                canalGroup.current,  //.children[segmentID] as THREE.Object3D, // the current segment mesh
                new THREE.Vector3(0, 0, 1), // target world direction (upwards)
                15 // threshold in degrees
            )

            alignmentRef!.current = canalAlignRes.score
            alignedRef!.current = canalAlignRes.isAligned

            if (alignedRef!.current && !state.isAligned) {
                // Handle the case where the canal becomes aligned
                // dispatch({ type: 'TOGGLE_ALIGNED' })
                dispatch({ type: 'ALIGNMENT_ENTER' })
            }

            if (state.stage === TreatmentStage.COMPLETE) {
                const material = new THREE.MeshStandardMaterial({color: GREEN_COLOUR, side: THREE.DoubleSide, flatShading: true})
                meshParts.current.forEach((mesh) => {
                    mesh.material = material
                })
                renderer.current!.render(scene.current!, camera.current!)
            } 
            
            else {
                    if (state.isAligned) {
                    const material = new THREE.MeshStandardMaterial({color: GREEN_COLOUR, side: THREE.DoubleSide, flatShading: true})
                    meshParts.current[segmentID!].material = material
                } 
                else {
                    const material = new THREE.MeshStandardMaterial({color: RED_COLOUR, side: THREE.DoubleSide, flatShading: true})
                    meshParts.current[segmentID!].material = material
                }

            // Make the arrow pulse
            const arrowMesh = stage4ArrowRef.current;
            arrowMesh?.traverse((child) => {
                if ((child as THREE.Mesh).material) {
                    const mat = (child as THREE.Mesh).material as THREE.Material & { opacity?: number };
                    if ('opacity' in mat) {
                        mat.opacity = opacity;
                    }
                }
            });
            }

            

        renderer.current!.render(scene.current!, camera.current!)
            }
        loop = requestAnimationFrame(animate)
        }

        return () => {
            cancelAnimationFrame(loop) 
            scene.current!.clear()
            meshParts.current = [] // flush any previous loadings
        }
    }, [state.stage, state.affectedCanal, state.isAligned])


    useEffect(() => {
        const euler = new THREE.Euler(
            roll * Math.PI / 180,
            pitch * Math.PI / 180,
            yaw * Math.PI / 180,
            "ZYX"
        );
        matrixRef.current.makeRotationFromEuler(euler);
    }, [yaw, pitch, roll]);

    function resetAlignment() {
        setYaw(0);
        setPitch(0);
        setRoll(0);
        alignmentRef.current = 0;
        alignedRef.current = false;
    }



    // <canvas id={"manualCanalCanvas" + affectedCanal}/>
    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div style={{height: "1.2vh"}}/>

            <Group justify="space-between" align="center" style={{width: "100%"}}>
                
                <Stack mt="md" gap="sm">

                    <canvas ref={canvasRef} />

                    <Text fw={600}>Yaw</Text>
                    <Slider w={300} label="Yaw" defaultValue={0} min={-180} max={180} step={1} value={yaw} onChange={setYaw} />
                    <Text fw={600}>Pitch</Text>
                    <Slider w={300} label="Pitch" defaultValue={0} min={-180} max={180} step={1} value={pitch} onChange={setPitch}/>
                    <Text fw={600}>Roll</Text>
                    <Slider w={300} label="Roll" defaultValue={0} min={-180} max={180} step={1} value={roll} onChange={setRoll} />

                </Stack>

                <Stack mt="md" gap="md" align="center">
                    <Text size="lg" >{alignedRef.current ? "Aligned" : "Not Aligned"}</Text>

                    <Text size="lg" >{(alignmentRef.current * 100).toFixed(1)}%</Text>

                    <Button onClick={resetAlignment}>{"Reset Alignment"}</Button>
                </Stack>
            </Group>
            

        </div>
    )
}

export default ManualCanalRendering