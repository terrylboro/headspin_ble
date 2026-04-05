import { useEffect, useRef, useState } from "react"
import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { getAlignment, meshPartsLength } from "../utils/alignment";
import { BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, BACKGR_COLOUR, GREEN_COLOUR, RED_COLOUR} from "../utils/config";
import { changeQuaternionBase } from "../utils/changeBase";
import {applyYawOffset} from "../utils/applyYawOffset"
import { useTreatment } from "../context/TreatmentProvider";


// {canal, ear, affectedCanal, matrixRef, offsetMatrixRef, stage, alignmentRef, alignedRef}: Props
const CanalRendering = () => {

    const [active, setActive] = useState(true)
    const handleChange = () => {
        setActive(!active)
    }

    // Using TreatmentProvider context to get the necessary variables for rendering and alignment
    const {affectedEar, affectedCanal, matrixRef, offsetMatrixRef, state, alignmentRef, alignedRef} = useTreatment();

    const camera = useRef<THREE.Camera>()
    const scene = useRef<THREE.Scene>()
    const renderer = useRef<THREE.WebGLRenderer>()
    const meshParts = useRef<THREE.Mesh[]>([])

    const canalColours = {"posterior": BLUE_COLOUR, "anterior": ORANGE_COLOUR, "lateral": BROWN_COLOUR, "all": 0, "unselected": 0x333333}
    const coloursAll = [BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, 0x333333, 0x333333]

    useEffect(() => {

        // Renderer initialisation
        const canvas = document.getElementById("canalCanvas" + affectedCanal) as HTMLCanvasElement
        renderer.current = new THREE.WebGLRenderer({canvas: canvas, antialias: true})
        const size = active ? document.documentElement.clientWidth * 0.207 : 0
		renderer.current.setSize(size, size)


        // Scene initialisation
        scene.current = new THREE.Scene()
        scene.current.background = new THREE.Color(BACKGR_COLOUR)

        // Camera initialisation
        camera.current = new THREE.PerspectiveCamera(15, 1)
        // camera.current.position.set(0, 0, 39)  
        // camera.current.lookAt(0, 0, 0)
        // camera.current.rotation.z = Math.PI / 2;
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


        // Load Canal Mesh
        const loader = new PLYLoader()
        let color = 0
        for (let i = 0; i < meshPartsLength[affectedCanal ? affectedCanal : 5]; i++) {
            const meshPath = "rh_meshes/" + affectedCanal + "_" + i.toString() + ".ply"
            loader.load(meshPath, (geometry) => {


                if ((i+1 === state.stage && affectedCanal === "lateral") || 
                                (i === state.stage && affectedCanal !== "lateral")) color = RED_COLOUR
                else color = canalColours[affectedCanal ? affectedCanal : "unselected"]

                const material = new THREE.MeshStandardMaterial({color: color, side: THREE.DoubleSide, flatShading: true})
                const loadedMesh = new THREE.Mesh(geometry, material)
                
                loadedMesh.applyMatrix4(new THREE.Matrix4().makeScale(1, 1, 1))
                scene.current!.add(loadedMesh)
                meshParts.current.push(loadedMesh)
            })
        }

        // Main animation loop
        let loop: number = requestAnimationFrame(animate)
        function animate() {
            if (meshParts.current[meshPartsLength[affectedCanal ? affectedCanal : 5] - 1]) {
                for (let mesh of meshParts.current) {
                    mesh.rotation.set(0, 0, 0) // each frame first resets the canal position
                    
                    const qB = new THREE.Quaternion();
                    changeQuaternionBase(matrixRef.current.clone(), qB);
                    // Applying offset
                    // applyYawOffset(offsetMatrixRef.current.clone(), qB)
                    //
                    mesh.applyQuaternion(qB);                    
                }


                const segmentID = affectedCanal === "lateral" ? state.stage - 1 : state.stage

                // update alignment variable for the affected canal
                alignmentRef!.current = getAlignment(affectedCanal!, state.stage, meshParts.current[segmentID])
                if (alignedRef) {
                    const material = new THREE.MeshStandardMaterial({color: GREEN_COLOUR, side: THREE.DoubleSide, flatShading: true})
                    meshParts.current[segmentID].material = material
                } 
                else {
                    const material = new THREE.MeshStandardMaterial({color: RED_COLOUR, side: THREE.DoubleSide, flatShading: true})
                    meshParts.current[segmentID].material = material
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

    }, [affectedEar, affectedCanal, active, matrixRef, offsetMatrixRef, state])


    return (
        <div style={{display: "flex", flexDirection: "column"}}>
            <div style={{display: "flex", flexDirection: "row"}}>
                <canvas id={"canalCanvas" + affectedCanal}/>
            </div>
        </div>
    )
}

export default CanalRendering