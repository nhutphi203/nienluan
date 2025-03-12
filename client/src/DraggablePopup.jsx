import { Rnd } from "react-rnd";
import "./DraggablePopup.css";

const DraggablePopup = ({ children, closeModal }) => {
    return (
        <Rnd
            default={{
                x: window.innerWidth / 2 - 200,
                y: window.innerHeight / 2 - 150,
                width: 400,
                height: "auto",
            }}
            enableResizing={false}
            dragHandleClassName="popup-header"
            className="draggable-popup"
            style={{
                backgroundColor: "white",
                borderRadius: "10px",
                padding: "15px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            }}
        >
            <div className="popup-header">
                <button onClick={closeModal} style={{ float: "right", background: "none", border: "none", fontSize: "20px", cursor: "pointer" }}>X</button>
            </div>
            {children}
        </Rnd>
    );
};

export default DraggablePopup;
