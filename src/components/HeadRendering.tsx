import { useEffect, useRef } from "react"
import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, BACKGR_COLOUR, RED_COLOUR, BACKGR_COLOUR_CSS} from "../utils/config";

import { changeQuaternionBase } from "../utils/changeBase";
import {applyYawOffset} from "../utils/applyYawOffset"
import { useTreatment } from "../context/TreatmentProvider";
import { Button, Stack } from "@mantine/core";

interface Props {
    ear: "left" | "right" | "unselected"
    matrixRef: React.MutableRefObject<THREE.Matrix4>
    offsetMatrixRef: React.MutableRefObject<THREE.Matrix4> 
}

// const HeadRendering = ({ear, matrixRef, offsetMatrixRef}: Props) => {
const HeadRendering = () => {

    const { matrixRef, offsetMatrixRef, affectedEar } = useTreatment();

    const camera = useRef<THREE.Camera>()
    const scene = useRef<THREE.Scene>()
    const renderer = useRef<THREE.WebGLRenderer>()
    const meshParts = useRef<THREE.Mesh[]>([])

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
        camera.current.position.set(100, 0, 0) 
        camera.current.lookAt(0, 0, 0)
        camera.current.rotation.z = Math.PI / 2;


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


        // Load Ear Mesh
        const loader = new PLYLoader()
        loader.load("rh_meshes/capsule_3x.ply", (geometry) => {

            const material = new THREE.MeshStandardMaterial({color: BLUE_COLOUR, flatShading: true})
            const loadedMesh = new THREE.Mesh(geometry.center(), material)

            scene.current!.add(loadedMesh)
            meshParts.current.push(loadedMesh)
        })

        // Load head mesh
        loader.load("rh_meshes/head.ply", (geometry) => {

            const material = new THREE.MeshPhongMaterial({color: 0x555555, flatShading: true, transparent: true, opacity: 0.5})
            const loadedMesh = new THREE.Mesh(geometry.center(), material)

            scene.current!.add(loadedMesh)
            meshParts.current.push(loadedMesh)
        })

        let loop: number = requestAnimationFrame(animate)

        function animate() {
            if (meshParts.current[0]) {
                for (let mesh of meshParts.current) {
                    
                    // A manual tuning of the mesh position
                    if (mesh.geometry.attributes.position.array.length === 33435) {
                        mesh.rotation.set(0, 0, 0)
                        // mesh.position.set(ear === "left" ? 3.5 : -3.5, 0, 0)
                        // mesh.position.set(affectedEar === "left" ? 3.5 : -3.5, 0, 0)
                        mesh.position.set(0, 0, 0)
                    }
                    else mesh.rotation.set(0.0, 0.0, 0)  // this was set in original code

                    const qB = new THREE.Quaternion();

                    const corrected = offsetMatrixRef.current.clone().multiply(matrixRef.current);
                    changeQuaternionBase(corrected, qB);
                    // Applying offset
                    // applyYawOffset(offsetMatrixRef.current.clone(), qB)
                    mesh.applyQuaternion(qB);
                }

                renderer.current!.render(scene.current!, camera.current!)
            }
            loop = requestAnimationFrame(animate)
        }

        return () => {
            cancelAnimationFrame(loop) 
            meshParts.current = [] // flush any previous loadings
        }

    // }, [ear, matrixRef, offsetMatrixRef])
    }, [affectedEar, matrixRef, offsetMatrixRef])

    function calibrateOrientation() {
        const current = matrixRef.current.clone();
        offsetMatrixRef.current.copy(current).invert();
    }


    return (
    <div id="headCanvasContainer" style={{ height: "100%", aspectRatio: "1 / 1", alignItems: "center", backgroundColor: "#000000"}}>
        <canvas ref={canvasRef} id={"headCanvas"}
            style={{ width: "100%", height: "100%", display: "block", margin: "0 auto" }}
        />
    </div>
    )
}

export default HeadRendering