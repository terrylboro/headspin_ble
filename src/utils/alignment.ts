import { Mesh, Vector3 } from "three"

export const meshPartsLength: {[key: string]: number} = {posterior: 5, anterior: 5, lateral: 3, all: 5}

const meshPartsEnds: {[key: string]: number[]} = {
    posterior: [2, 420, 128, 356, 531, 49],
    anterior: [306, 372, 492, 128, 167, 229],
    lateral: [289, 510, 322, 330, 410, 74]
}

export const getAlignment = (canal: string, stage: number, mesh: Mesh) => {

    const top = new Vector3()
    top.set(
        mesh.geometry.attributes.position.array[3 * meshPartsEnds[canal][2*(stage-1)]],
        mesh.geometry.attributes.position.array[3 * meshPartsEnds[canal][2*(stage-1)] + 1],
        mesh.geometry.attributes.position.array[3 * meshPartsEnds[canal][2*(stage-1)] + 2]
    )   
    const bottom = new Vector3()
    bottom.set(
        mesh.geometry.attributes.position.array[3 * meshPartsEnds[canal][2*(stage-1)+1]],
        mesh.geometry.attributes.position.array[3 * meshPartsEnds[canal][2*(stage-1)+1] + 1],
        mesh.geometry.attributes.position.array[3 * meshPartsEnds[canal][2*(stage-1)+1] + 2]
    )
    mesh.localToWorld(top)
    mesh.localToWorld(bottom)

    // This whole function picks a point at the top of the canal segment, one at the bottom,
    // and calculates how vertical is the line connecting them

    return (top.y - bottom.y)/top.distanceTo(bottom)
}