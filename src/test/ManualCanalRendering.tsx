import { useEffect, useRef, useState } from "react"
import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { getAlignment, getCanalAlignment, meshPartsLength } from "../utils/alignment";
import { BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, BACKGR_COLOUR, GREEN_COLOUR, RED_COLOUR} from "../utils/config";
import { changeQuaternionBase } from "../utils/changeBase";
import {applyYawOffset} from "../utils/applyYawOffset"
import { useTreatment } from "../context/TreatmentProvider";

import { CanalType } from "../context/TreatmentProvider";

import { Slider, Stack, Text, Group, Button } from '@mantine/core';


const ManualCanalRendering = () => {

    // const { matrixRef, offsetMatrixRef, affectedEar } = useTreatment();

    const { state, affectedCanal } = useTreatment();

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
    const coloursAll = [BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, 0x333333, 0x333333]

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


    useEffect(() => {

        // Renderer initialisation
        // const canvas = document.getElementById("manualCanalCanvas" + state.affectedCanal) as HTMLCanvasElement
        if (!canvasRef.current) return;
        renderer.current = new THREE.WebGLRenderer({canvas: canvasRef.current, antialias: true})
        const size = active ? document.documentElement.clientWidth * 0.207 : 0
        renderer.current.setSize(size, size)


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
            stage1Direction,
            stage1Origin,
            10,
            ORANGE_COLOUR
        );
        canalGroup.current.add(stage1ArrowRef.current);

        stage2ArrowRef.current = new THREE.ArrowHelper(
            stage2Direction,
            stage2Origin,
            10,
            ORANGE_COLOUR
        );
        canalGroup.current.add(stage2ArrowRef.current);

        stage3ArrowRef.current = new THREE.ArrowHelper(
            stage3Direction,
            stage3Origin,
            10,
            ORANGE_COLOUR
        );
        canalGroup.current.add(stage3ArrowRef.current);



        // Load Canal Mesh
        const loader = new PLYLoader()
        let color = 0
        for (let i = 0; i < meshPartsLength[state.affectedCanal ? state.affectedCanal : 5]; i++) {
            const meshPath = "rh_meshes/" + state.affectedCanal + "_" + i.toString() + ".ply"
            loader.load(meshPath, (geometry) => {


                // if ((i+1 === currentStage && affectedCanal === "lateral") || 
                //                 (i === currentStage && affectedCanal !== "lateral")) color = RED_COLOUR
                // else color = canalColours[affectedCanal ? affectedCanal : "unselected"]

                // if (i-1 === state.stage) color = RED_COLOUR
                // else 
                color = canalColours[state.affectedCanal ? state.affectedCanal : "unselected"]

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
            if (meshParts.current[meshPartsLength[state.affectedCanal ? state.affectedCanal : 5] - 1]) {
                // for (let mesh of meshParts.current) {
                //     mesh.rotation.set(0, 0, 0) // each frame first resets the canal position
                    
                    // const qB = new THREE.Quaternion();
                    // changeQuaternionBase(matrixRef.current.clone(), qB);
                //     mesh.applyQuaternion(qB);                    
                // }

                // Rotate the group
                const qB = new THREE.Quaternion();
                changeQuaternionBase(matrixRef.current.clone(), qB);
                canalGroup.current.setRotationFromQuaternion(qB);

                const segmentID = (state.affectedCanal !== "lateral") ? state.stage + 1 : state.stage;

                // update alignment variable for the affected canal
                // alignmentRef!.current = getAlignment(state.affectedCanal!, state.stage, meshParts.current[segmentID])
                alignmentRef!.current = getCanalAlignment( // the current direction of the stage 1 arrow
                    stage1Direction,
                    canalGroup.current,  //.children[segmentID] as THREE.Object3D, // the current segment mesh
                    new THREE.Vector3(0, 0, 1), // target world direction (upwards)
                    15 // threshold in degrees
                ).score
                if (state.isAligned) {
                    const material = new THREE.MeshStandardMaterial({color: GREEN_COLOUR, side: THREE.DoubleSide, flatShading: true})
                    meshParts.current[segmentID!].material = material
                } 
                else {
                    const material = new THREE.MeshStandardMaterial({color: RED_COLOUR, side: THREE.DoubleSide, flatShading: true})
                    meshParts.current[segmentID!].material = material
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
                    <Text size="lg" >{(alignmentRef.current * 100).toFixed(1)}%</Text>

                    <Button onClick={resetAlignment}>{"Reset Alignment"}</Button>
                </Stack>
            </Group>
            

        </div>
    )
}

export default ManualCanalRendering