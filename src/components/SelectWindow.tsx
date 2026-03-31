import { useState } from "react"


interface Props {
    ear: "left"|"right"|"unselected";
    canal: "posterior"|"anterior"|"lateral"|"all"|"unselected";
    earCallback: (ear: "left"|"right"|"unselected") => void;
    canalCallback: (canal: "posterior"|"anterior"|"lateral"|"unselected") => void;
    headAlignCallback: () => void;
}

const SelectWindow = ({ear, canal, earCallback, canalCallback, headAlignCallback}: Props) => {

    const [isHoverP, setIsHoverP] = useState(false)
    const [isHoverA, setIsHoverA] = useState(false)
    const [isHoverL, setIsHoverL] = useState(false)
    const [isHoverAH, setIsHoverAH] = useState(false)

    const handleMouseEnter = (c: "p"|"a"|"l"|"ah") => {
        if (c === "p") setIsHoverP(true)
        if (c === "a") setIsHoverA(true)
        if (c === "l") setIsHoverL(true)
        if (c == "ah") setIsHoverAH(true)
    }

    const handleMouseLeave = (c: "p"|"a"|"l"|"ah") => {
        if (c === "p") setIsHoverP(false)
        if (c === "a") setIsHoverA(false)
        if (c === "l") setIsHoverL(false)
        if (c == "ah") setIsHoverAH(false)
    }


    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>

                <div style={{height: "3.2vh"}}/>
                <div style={{fontSize: "1.25vw"}}>Select affected canal and ear</div>
                <div style={{height: "3vh"}}/>

        <div style={{display: "flex", flexDirection: "row", width: "100%", justifyContent: "center", alignItems: "center"}}>

            <div style={{display: "flex", flexDirection: "column", width: "40%", alignItems: "center"}}>
                
                <div>
                <button className="btn"
                        onClick={() => {canalCallback("posterior")}} 
                        onMouseEnter={() => {handleMouseEnter("p")}}
                        onMouseLeave={() => {handleMouseLeave("p")}}
                        style={{backgroundColor: isHoverP ? "#0022AA" : "white", 
                                borderColor: "#0022AA", 
                                fontSize: "1vw",
                                color: isHoverP ? "white" : "#0022AA"}}>Posterior</button>
                <div style={{height: "1vh"}}/>
                </div>

                <div>
                <button className="btn" 
                        onMouseEnter={() => {handleMouseEnter("a")}}
                        onMouseLeave={() => {handleMouseLeave("a")}}
                        onClick={() => {canalCallback("anterior")}}
                        style={{backgroundColor: isHoverA ? "#EEAA22" : "white", 
                                borderColor: "#EEAA22", 
                                fontSize: "1vw",
                                color: isHoverA ? "white" : "#EEAA22"}}>Anterior</button>
                <div style={{height: "1vh"}}/>
                </div>

                <div>
                <button className="btn" 
                        onMouseEnter={() => {handleMouseEnter("l")}}
                        onMouseLeave={() => {handleMouseLeave("l")}}
                        onClick={() => {canalCallback("lateral")}}
                        style={{backgroundColor: isHoverL ? "#887766" : "white", 
                                borderColor: "#887766", 
                                fontSize: "1vw",
                                color: isHoverL ? "white" : "#887766"}}>Lateral</button>
                <div style={{height: "1vh"}}/>
                </div>
            </div>

            <div style={{width: "1vw"}}/>

            <div style={{display: "flex", flexDirection: "column", width: "40%", alignItems: "center"}}>
                <button className="btn btn-outline-dark"
                        style={{fontSize: "1vw"}}
                        onClick={() => {earCallback("left")}}>Left</button>
                <div style={{height: "1vh"}}/>

                <button className="btn btn-outline-dark"
                        style={{fontSize: "1vw"}}
                        onClick={() => {earCallback("right")}}>Right</button>
            </div>
        </div>
        <div style={{height: "1vh"}}/>
        <div style={{height: "1vh"}}/>
        {(canal != "unselected") ? <div style={{fontSize: "1.25vw"}}>{"Selected:  " + ear.charAt(0).toUpperCase() + ear.slice(1) +
        " " + canal.charAt(0).toUpperCase() + canal.slice(1)}</div> : 
                 <div style={{fontSize: "1.25vw", color: "#333333"}}>No canal selected</div>}

        
        <div style={{height: "1vh"}}/>  
        <button className="btn"
        onClick={headAlignCallback} 
        onMouseEnter={() => {handleMouseEnter("ah")}}
        onMouseLeave={() => {handleMouseLeave("ah")}}
        style={{backgroundColor: isHoverAH ? "#0022AA" : "white", 
                borderColor: "#0022AA", 
                fontSize: "1vw",
                color: isHoverAH ? "white" : "#0022AA"}}>Align Head</button>
        <div style={{height: "1vh"}}/>  

        </div>
    )
}

export default SelectWindow

