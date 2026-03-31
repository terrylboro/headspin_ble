import { ProgramState, StateMachineContext, StateMachineActions } from "../hooks/useStateMachine";

interface Props {
  state: ProgramState;
  context: StateMachineContext;
  actions?: StateMachineActions;
}

const StateDisplay = ({ state, context, actions }: Props) => {
  const getStateDescription = (state: ProgramState): string => {
    switch (state) {
      case "RESET":
        return "Ready to start";
      case "SELECT_CANAL":
        return "Select canal and ear";
      case "STAGE_1":
        return "Stage 1 of 3";
      case "STAGE_2":
        return "Stage 2 of 3";
      case "STAGE_3":
        return "Stage 3 of 3";
      case "STAGE_COMPLETE":
        return "Treatment Complete!";
      default:
        return state;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ height: "1vh" }} />
      <div style={{ fontSize: "1.1vw", fontWeight: "bold", color: state === "STAGE_COMPLETE" ? "#4CAF50" : "#333" }}>
        Status: {getStateDescription(state)}
      </div>
      <div style={{ fontSize: "0.9vw", color: "#666" }}>
        {context.affectedEar !== "unselected" && context.affectedCanal !== "unselected"
          ? `${context.affectedEar.charAt(0).toUpperCase() + context.affectedEar.slice(1)} - ${
              context.affectedCanal.charAt(0).toUpperCase() + context.affectedCanal.slice(1)
            }`
          : "No canal selected"}
      </div>
      {state === "STAGE_COMPLETE" && actions && (
        <button
          onClick={() => actions.resetToStart()}
          style={{
            marginTop: "1vh",
            padding: "0.5vw 1vw",
            fontSize: "0.9vw",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Start New Treatment
        </button>
      )}
      <div style={{ height: "0.5vh" }} />
    </div>
  );
};

export default StateDisplay;
