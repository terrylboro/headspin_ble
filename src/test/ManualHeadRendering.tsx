import { useEffect, useRef, useState } from "react"
import * as THREE from "three";
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';
import { BLUE_COLOUR, ORANGE_COLOUR, BROWN_COLOUR, BACKGR_COLOUR, RED_COLOUR} from "../utils/config";

import { changeQuaternionBase } from "../utils/changeBase";
import {applyYawOffset} from "../utils/applyYawOffset"
import { useTreatment } from "../context/TreatmentProvider";

import { Slider, Stack, Text } from '@mantine/core';


const ManualHeadRendering = () => {

    // const { matrixRef, offsetMatrixRef, affectedEar } = useTreatment();

    const matrixRef = useRef(new THREE.Matrix4())
    const offsetMatrixRef = useRef(new THREE.Matrix4())
    const affectedEar = "left"

    const camera = useRef<THREE.Camera>()
    const scene = useRef<THREE.Scene>()
    const renderer = useRef<THREE.WebGLRenderer>()
    const meshParts = useRef<THREE.Mesh[]>([])

    const [yaw, setYaw] = useState(0)
    const [pitch, setPitch] = useState(0)
    const [roll, setRoll] = useState(0)

    useEffect(() => {

        // Renderer initialisation
        const canvas = document.getElementById("manualHeadCanvas") as HTMLCanvasElement
        renderer.current = new THREE.WebGLRenderer({canvas: canvas, antialias: true})
        const size = document.documentElement.clientWidth * 0.207
        renderer.current.setSize(size, size)

        // Scene initialisation
        scene.current = new THREE.Scene()
        scene.current.background = new THREE.Color(BACKGR_COLOUR)

        // Camera initialisation
        camera.current = new THREE.PerspectiveCamera(12, 1)
        camera.current.position.set(100, 0, 0) 
        // camera.current.rotateZ(Math.PI / 2) // to match the orientation of the head mesh
        
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
                        mesh.position.set(affectedEar === "left" ? 3.5 : -3.5, 0, 0)
                    }
                    else mesh.rotation.set(0.0, 0.0, 0)  // this was set in original code

                    const qB = new THREE.Quaternion();
                    changeQuaternionBase(matrixRef.current.clone(), qB);
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
    }, [affectedEar, matrixRef])

    // function rotateHead() {
    //     const euler = new THREE.Euler((roll * Math.PI / 180), (pitch * Math.PI / 180), (yaw * Math.PI / 180), "ZYX");
    //     matrixRef.current.makeRotationFromEuler(euler);
    // }

    useEffect(() => {
        const euler = new THREE.Euler(
            roll * Math.PI / 180,
            pitch * Math.PI / 180,
            yaw * Math.PI / 180,
            "ZYX"
        );
        matrixRef.current.makeRotationFromEuler(euler);
    }, [yaw, pitch, roll]);


    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div style={{height: "1.2vh"}}/>
            <canvas id={"manualHeadCanvas"}/>
            <Stack mt="md" gap="sm">

                <Text fw={600}>Yaw</Text>
                <Slider w={300} label="Yaw" defaultValue={0} min={-180} max={180} step={1} value={yaw} onChange={setYaw} />
                <Text fw={600}>Pitch</Text>
                <Slider w={300} label="Pitch" defaultValue={0} min={-180} max={180} step={1} value={pitch} onChange={setPitch}/>
                <Text fw={600}>Roll</Text>
                <Slider w={300} label="Roll" defaultValue={0} min={-180} max={180} step={1} value={roll} onChange={setRoll} />

            </Stack>

        </div>
    )
}

export default ManualHeadRendering