import { Matrix4 } from "three"

// Matrices that define the camera positions around the head. Used in IndividualCamera to transform landmark
// predictions into the world coordinate system

const pitch = (135) / 180 * Math.PI
const topCameraMatrix = new Matrix4()
topCameraMatrix.makeRotationX(-pitch)

const leftCameraMatrix = new Matrix4()
leftCameraMatrix.set(0, 0, 1, 0,
                    -1, 0, 0, 0,
                     0, -1, 0, 0, 
                     0, 0, 0, 1)

const rightCameraMatrix = new Matrix4()
rightCameraMatrix.set(0, 0, -1, 0,
                      1, 0, 0, 0,
                      0, -1, 0, 0, 
                      0, 0, 0, 1)

export const cameraMatrices = [leftCameraMatrix, topCameraMatrix, rightCameraMatrix]