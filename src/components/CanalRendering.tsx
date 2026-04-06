import { useEffect, useRef, useState } from "react"
import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { getCanalAlignment, meshPartsLength } from "../utils/alignment";
import { BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, BACKGR_COLOUR, GREEN_COLOUR, RED_COLOUR} from "../utils/config";
import { changeQuaternionBase } from "../utils/changeBase";
import {applyYawOffset} from "../utils/applyYawOffset"
import { useTreatment } from "../context/TreatmentProvider";

import { CanalType } from "../context/TreatmentProvider";

import { Slider, Stack, Text, Group, Button } from '@mantine/core';
import { TreatmentStage } from "../types/treatmentTypes";

import { canalDirections } from "../utils/canalDirections";


// {canal, ear, affectedCanal, matrixRef, offsetMatrixRef, stage, alignmentRef, alignedRef}: Props
const CanalRendering = () => {

    const [active, setActive] = useState(true)

    // Using TreatmentProvider context to get the necessary variables for rendering and alignment
    const {matrixRef, offsetMatrixRef, state, dispatch} = useTreatment();

    const alignmentRef = useRef<number>(0)
    const alignedRef = useRef<boolean>(false)

    // Scene setting variables
    const camera = useRef<THREE.Camera>()
    const scene = useRef<THREE.Scene>()
    const renderer = useRef<THREE.WebGLRenderer>()
    const meshParts = useRef<THREE.Mesh[]>([])

    const canalColours = {"posterior": BLUE_COLOUR, "anterior": ORANGE_COLOUR, "lateral": BROWN_COLOUR, "all": 0, "unselected": 0x333333}
    const coloursAll = [BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, 0x333333, 0x333333]

    // Group mesh control variables
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const canalGroup = useRef<THREE.Group>(new THREE.Group());
    const stage1ArrowRef = useRef<THREE.ArrowHelper | null>(null);
    const stage2ArrowRef = useRef<THREE.ArrowHelper | null>(null);
    const stage3ArrowRef = useRef<THREE.ArrowHelper | null>(null);

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


        // Load Canal Mesh
        const loader = new PLYLoader()
        let color = 0
        for (let i = 0; i < meshPartsLength[state.affectedCanal ? state.affectedCanal : 5]; i++) {
            const meshPath = "rh_meshes/" + state.affectedCanal + "_" + i.toString() + ".ply"
            loader.load(meshPath, (geometry) => {


                color = canalColours["unselected"]

                const material = new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide, flatShading: true})
                const loadedMesh = new THREE.Mesh(geometry, material)
                
                loadedMesh.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1))
                canalGroup.current.add(loadedMesh)
                meshParts.current.push(loadedMesh)
            })
        }

        // Main animation loop
        let loop: number = requestAnimationFrame(animate)
        function animate() {
            if (meshParts.current[meshPartsLength[state.affectedCanal ? state.affectedCanal : 5] - 1]) {

                // Rotate the group
                const qB = new THREE.Quaternion();

                // Add in the offset matrix to correct for any yaw drift in the IMU data
                const corrected = offsetMatrixRef.current.clone().multiply(matrixRef.current);
                changeQuaternionBase(corrected, qB);
                canalGroup.current.setRotationFromQuaternion(qB);
 
                const segmentID = (state.stage===TreatmentStage.COMPLETE) ? 3 : ((state.affectedCanal !== "lateral") ? state.stage + 1 : state.stage + 1);

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

    }, [state, matrixRef, offsetMatrixRef])


    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <div style={{display: "flex", flexDirection: "row"}}>
                <canvas ref={canvasRef}/>
            </div>
        </div>
    )
}

export default CanalRendering