import { useEffect, useRef } from "react"
import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, BACKGR_COLOUR, RED_COLOUR, BACKGR_COLOUR_CSS} from "../utils/config";

import { changeQuaternionBase } from "../utils/changeBase";
import {applyYawOffset} from "../utils/applyYawOffset"
import { useTreatment } from "../context/TreatmentProvider";
import { Button, Stack } from "@mantine/core";

// interface Props {
//     ear: "left" | "right" | "unselected"
//     matrixRef: React.MutableRefObject<THREE.Matrix4>
//     offsetMatrixRef: React.MutableRefObject<THREE.Matrix4> 
// }
type HeadRenderingProps = {
    calibrateMode: boolean
}

// const HeadRendering = ({ear, matrixRef, offsetMatrixRef}: Props) => {
const HeadRendering = ({calibrateMode} : HeadRenderingProps) => {

    const { matrixRef, offsetMatrixRef, affectedEar } = useTreatment();

    const camera = useRef<THREE.Camera>()
    const scene = useRef<THREE.Scene>()
    const renderer = useRef<THREE.WebGLRenderer>()
    const meshParts = useRef<THREE.Mesh[]>([])
    const headGroup = useRef(new THREE.Group());

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {

        // Renderer initialisation
        canvasRef.current = document.getElementById("headCanvas") as HTMLCanvasElement;
        const container = document.getElementById("headCanvasContainer") as HTMLDivElement;

        renderer.current = new THREE.WebGLRenderer({canvas: canvasRef.current, antialias: true})
        // const size = document.documentElement.clientWidth * 0.207
		// renderer.current.setSize(size, size)
        renderer.current.setSize(container.clientWidth, container.clientHeight, false)

        // Scene initialisation
        scene.current = new THREE.Scene()
        scene.current.background = new THREE.Color(BACKGR_COLOUR)

        // Camera initialisation
        camera.current = new THREE.PerspectiveCamera(12, 1)
        calibrateMode ? camera.current.position.set(100, 0, 0) : camera.current.position.set(-100, 0, 0) 
        camera.current.lookAt(0, 0, 0)
        calibrateMode ? camera.current.rotation.z = Math.PI / 2 : camera.current.rotation.z = -Math.PI / 2;


        // Add lights
        const background = new THREE.AmbientLight(0xffffff, 0.1)
        scene.current.add(background)

        const pointLight2 = new THREE.PointLight(0xffffff, 2000)
        pointLight2.castShadow = true
        pointLight2.position.set(17, 20, 0)
        scene.current.add(pointLight2)

        const pointLight3 = new THREE.PointLight(0xffffff, 2000)
        pointLight3.castShadow = true
        pointLight3.position.set(-17, 20, 0)
        scene.current.add(pointLight3)

        // Add the head group to allow ear rotation to be offset
        scene.current.add(headGroup.current);


        // Load Ear Mesh
        const loader = new PLYLoader()
        loader.load("rh_meshes/capsule_3x.ply", (geometry) => {

            const material = new THREE.MeshStandardMaterial({color: BLUE_COLOUR, flatShading: true})
            const loadedMesh = new THREE.Mesh(geometry.center(), material)

            loadedMesh.position.set(0, affectedEar === "left" ? -3.5 : 3.5, 0)
            headGroup.current!.add(loadedMesh);
        })

        // Load head mesh
        loader.load("rh_meshes/head.ply", (geometry) => {

            const material = new THREE.MeshPhongMaterial({color: 0x555555, flatShading: true, transparent: true, opacity: 0.5})
            const loadedMesh = new THREE.Mesh(geometry.center(), material)

            // scene.current!.add(loadedMesh)
            meshParts.current.push(loadedMesh)
            headGroup.current.add(loadedMesh)
        })



        let loop: number = requestAnimationFrame(animate)

        function animate() {
            const qB = new THREE.Quaternion();
            const corrected = offsetMatrixRef.current.clone().multiply(matrixRef.current);
            changeQuaternionBase(corrected, qB);
            // Applying offset
            // applyYawOffset(offsetMatrixRef.current.clone(), qB)
            headGroup.current.setRotationFromQuaternion(qB);
            renderer.current!.render(scene.current!, camera.current!)
            // }
            loop = requestAnimationFrame(animate)
        }

        return () => {
            cancelAnimationFrame(loop)
            scene.current!.clear() 
            meshParts.current = [] // flush any previous loadings
        }
    }, [affectedEar, matrixRef, offsetMatrixRef])


    return (
    <div id="headCanvasContainer" style={{ height: "100%", aspectRatio: "1 / 1", alignItems: "center", backgroundColor: "#000000"}}>
        <canvas ref={canvasRef} id={"headCanvas"}
            style={{ width: "100%", height: "100%", display: "block", margin: "0 auto" }}
        />
    </div>
    )
}

export default HeadRendering