import { useEffect, useRef, useState } from "react"
import useSound from "use-sound"
import { HIGH_THRESHOLD, LOW_THRESHOLD, PASS_THRESHOLD, PROGRESS_THRESHOLD, PROGRESS_TIME, RED_COLOUR, TRANSITION_ALLOWANCE_TIME } from "../utils/config"

interface Props {
    stage: number
    stageCallback: (advance: boolean) => void
    alignmentRef: React.MutableRefObject<number>
    alignedRef: React.MutableRefObject<boolean>
    alignment?: number
    stage1Progress?: number
    stage2Progress?: number
    stage3Progress?: number
    resetTime?: number
}

const GREEN = "#44DD22"
const BLACK = "#000000"

const AlignmentDisplay = ({stage, stageCallback, alignmentRef, alignedRef, alignment, stage1Progress: propStage1Progress, stage2Progress: propStage2Progress, stage3Progress: propStage3Progress, resetTime: propResetTime}: Props) => {
    const [displayAlignment, setDisplayAligment] = useState(0.0)
    const [color, setColor] = useState(BLACK)

    const [playAligned] = useSound("sounds/aligned.mp3")
    const [playNotAligned] = useSound("sounds/naligned.mp3")
    const [playNext] = useSound("sounds/stagedone.mp3")

    const passTime = useRef(0.0)
    const resetTime = useRef(propResetTime ?? 0.0)

    const stage1Progress = useRef(propStage1Progress ?? 0.0)
    const stage2Progress = useRef(propStage2Progress ?? 0.0)
    const stage3Progress = useRef(propStage3Progress ?? 0.0)
    const resetProgress = useRef(0.0)

    // Update refs when props change from state machine
    useEffect(() => {
        if (alignment !== undefined) setDisplayAligment(alignment)
        if (propStage1Progress !== undefined) stage1Progress.current = propStage1Progress
        if (propStage2Progress !== undefined) stage2Progress.current = propStage2Progress
        if (propStage3Progress !== undefined) stage3Progress.current = propStage3Progress
        if (propResetTime !== undefined) resetTime.current = propResetTime
    }, [alignment, propStage1Progress, propStage2Progress, propStage3Progress, propResetTime])

    // Update alignedRef based on alignment value
    useEffect(() => {
        if (alignment !== undefined) {
            if (alignment >= PASS_THRESHOLD) {
                alignedRef.current = true
            } else if (alignment < PASS_THRESHOLD) {
                alignedRef.current = false
            }
        }
    }, [alignment, alignedRef])

    // let loop: NodeJS.Timeout
    // useEffect(() => {
    //     loop = setInterval(() => {
    //         const alignment = alignmentRef.current

            
    //         if (alignedRef.current) {
    //             // Check if canal has been aligned sufficiently long to progress
    //             if (passTime.current >= PROGRESS_TIME) {
    //                 stageCallback(true)
    //                 passTime.current = 0.0
    //                 resetTime.current = 0.0
    //                 alignedRef.current = false
    //                 playNext()
    //             // Else check that it is still aligned and increment the timer
    //             } else if (alignment >= PASS_THRESHOLD) {
    //                 switch (stage) {
    //                     case 1:
    //                         stage1Progress.current = passTime.current / PROGRESS_TIME
    //                         break;
    //                     case 2:
    //                         stage2Progress.current = passTime.current / PROGRESS_TIME
    //                         break;
    //                     case 3:
    //                         stage3Progress.current = passTime.current / PROGRESS_TIME
    //                         break
    //                     default:
    //                         // Unreachable state
    //                         stage1Progress.current = 0
    //                         stage2Progress.current = 0
    //                         stage3Progress.current = 0
    //                 }
    //                 passTime.current += 0.15  // logic runs every 150ms
    //             // Otherwise, reset the timer and set aligned state to false
    //             } else if (alignment < PASS_THRESHOLD && resetTime.current < TRANSITION_ALLOWANCE_TIME) {
    //                 resetTime.current += 0.15  // logic runs every 150ms
    //             // Otherwise, reset the timer and set aligned state to false
    //             } else {
    //                 stageCallback(false)
    //                 passTime.current = 0.0
    //                 resetTime.current = 0.0
    //                 stage1Progress.current = 0
    //                 stage2Progress.current = 0
    //                 stage3Progress.current = 0
    //                 setColor(BLACK)
    //                 alignedRef.current = false
    //             } 
    //         } else {
    //             if (alignment > PASS_THRESHOLD) {
    //                 playAligned()
    //                 setColor(GREEN)
    //                 alignedRef.current = true
    //             } else if (alignment < PASS_THRESHOLD) {
    //                 if (resetTime.current < TRANSITION_ALLOWANCE_TIME) {
    //                     resetTime.current += 0.15  // logic runs every 150ms
    //                 } else {
    //                     stageCallback(false)
    //                     passTime.current = 0.0
    //                     resetTime.current = 0.0
    //                     setColor(BLACK)
    //                     alignedRef.current = false
    //                 }
    //             // Otherwise, reset the timer and set aligned state to false
    //             } else {
    //                 // This state should be unreachable
    //             }
    //         }

    //         // if (alignment > HIGH_THRESHOLD && !alignedRef.current) {
    //         //     playAligned()
    //         //     setColor(GREEN)
    //         //     alignedRef.current = true
    //         // }

    //         // if (alignment < LOW_THRESHOLD && alignedRef.current) {
    //         //     setColor(BLACK)
    //         //     alignedRef.current = false
    //         //     playNotAligned()
    //         // }

    //         // if (alignment > PASS_THRESHOLD)
    //         //     passTime.current += 0.15

    //         // if (alignment < PASS_THRESHOLD && passTime.current > 0.0 && passTime.current < PROGRESS_TIME)
    //         //     passTime.current = 0.0

    //         // if (alignment < PROGRESS_THRESHOLD && passTime.current >= PROGRESS_TIME-0.05) {
    //         //     stageCallback()
    //         //     playNext()
    //         // }

    //         setDisplayAligment(alignment)
    //     }, 1500)

    //     return () => {
    //         // clearInterval(loop)
    //         alignedRef.current = false
    //         alignmentRef.current = 0.0
    //         passTime.current = 0.0
    //         setColor(BLACK)
    //     }
    // }, [stage, playAligned, playNotAligned])



    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div style={{height: "1vh"}}/>
            <div style={{color: color, fontSize: "1.25vw"}}>Alignment: {(displayAlignment*100).toFixed(2)}%</div>
        
            <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                Stage 1
                <progress value={stage1Progress.current} max={1.0} />
            </div>
            <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                Stage 2
                <progress value={stage2Progress.current} max={1.0} />
            </div>
            <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                Stage 3
                <progress value={stage3Progress.current} max={1.0} />
            </div>
            <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
                Reset
                <progress value={resetTime.current} max={TRANSITION_ALLOWANCE_TIME} />
            </div>

        
        </div>
    ) 
    
}

export default AlignmentDisplay