import { useEffect, useRef, useState } from "react";
import { SWATCHES } from "@/constants";
import { Button } from "@/components/ui/button";
import axios from "axios";
import Draggable from "react-draggable";
import { FaEraser, FaUndo, FaRedo, FaPaintBrush, FaSave, FaPalette } from "react-icons/fa"; // Icons

interface Response {
  expr: string;
  result: string;
  assign: boolean;
}

interface GeneratedResult {
  expression: string;
  answer: string;
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [yPosition, setYPosition] = useState(50); // Initial Y position for the first result
  const [result] = useState<GeneratedResult>();
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff"); // Default color: White
  const [reset, setReset] = useState(false);
  const [dictOfVars, setDictOfVars] = useState<Record<string, string>>({});
  const [latexExpressions, setLatexExpressions] = useState<string[]>([]);
  const [latexPosition, setLatexPosition] = useState({ x: 50, y: 50 });
  const [eraserMode, setEraserMode] = useState(false); // Eraser Mode
  const [brushSize, setBrushSize] = useState(5); // Default brush size
  const [history, setHistory] = useState<string[]>([]); // Undo history
  const [redoHistory, setRedoHistory] = useState<string[]>([]); // Redo history
  const [setCanvasState] = useState<string>(""); // Canvas state to handle undo/redo
  const [canvasBgColor, setCanvasBgColor] = useState("#000000"); // Default canvas background color
  const [isSaving, setIsSaving] = useState(false); // State to trigger saving

  useEffect(() => {
    if (latexExpressions.length > 0 && window.MathJax) {
        setTimeout(() => {
            window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
        }, 0);
    }
}, [latexExpressions]);

useEffect(() => {
    if (result) {
        renderLatexToCanvas(result.expression, result.answer);
    }
}, [result]);

const renderLatexToCanvas = (expression: string, answer: string) => {
  const canvas = canvasRef.current;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = canvasBgColor; // Set canvas background color
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Set font style
  const fontSize = 48; // Adjust as needed
  ctx.font = `${fontSize}px Arial`; // Customize font family and size
  ctx.fillStyle = color; // Use the selected brush color for the text

  // Prepare the LaTeX expression
  const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;

  // Render the LaTeX using MathJax
  if (window.MathJax) {
    window.MathJax.Hub.Queue(() => {
      const div = document.createElement("div");
      div.style.fontSize = `${fontSize}px`;
      div.style.fontFamily = "Arial";
      div.innerHTML = latex;

      document.body.appendChild(div); // Add the element to the DOM temporarily

      // Convert LaTeX to SVG or other renderable format
      
    });
  }
};

  // Initialize canvas only once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      ctx.fillStyle = canvasBgColor; // Set canvas background color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.lineCap = "round";
      ctx.lineWidth = brushSize; // Apply initial brush size
    }
    const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: {inlineMath: [['$', '$'], ['\\(', '\\)']]},
            });
        };

        return () => {
            document.head.removeChild(script);
        };
  }, []); // This effect runs only once when the component is mounted

  // Update canvas properties when brush size or background color changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
  
    // Set the canvas resolution to match its CSS size
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineWidth = brushSize; // Fill with the background color
      
    }
  }, [brushSize]); // Only run this effect when brushSize or background color changes

  useEffect(() => {
    const canvas = canvasRef.current;
    
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
  
    // Set the canvas resolution to match its CSS size
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.fillStyle = canvasBgColor; // Set canvas background color
        ctx.fillRect(0, 0, canvas.width, canvas.height); 
    }
  }, [canvasBgColor]);
  // Handle canvas reset
  useEffect(() => {
    if (!reset) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
  
    // Set the canvas resolution to match its CSS size
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = canvasBgColor; // Reset with current canvas background color
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    setLatexExpressions([]);
    setDictOfVars({});
    setHistory([]);
    setRedoHistory([]); // Clear redo history on reset
    setReset(false); // Reset flag after clearing
  }, [reset]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(); // Get canvas position and size
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const x = e.clientX - rect.left; // Adjust for canvas offset
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }
};

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const image = canvas.toDataURL(); // Save canvas state for undo
    setHistory((prevHistory) => [...prevHistory, image]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect(); // Get canvas position and size
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const x = e.clientX - rect.left; // Adjust for canvas offset
    const y = e.clientY - rect.top;
    ctx.strokeStyle = eraserMode ? canvasBgColor : color; // Eraser functionality
    ctx.lineWidth = brushSize;
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  };

  const undo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const lastState = history[history.length - 1];
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const img = new Image();
      img.src = lastState;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setRedoHistory((prevRedoHistory) => [lastState, ...prevRedoHistory]); // Add to redo history
        setHistory(history.slice(0, -1)); // Remove last state after undo
      };
    }
  };

  const redo = () => {
    const canvas = canvasRef.current;
    if (!canvas || redoHistory.length === 0) return;
    const lastRedoState = redoHistory[0];
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const img = new Image();
      img.src = lastRedoState;
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        setHistory((prevHistory) => [...prevHistory, lastRedoState]); // Add to history
        setRedoHistory(redoHistory.slice(1)); // Remove last state from redo history
      };
    }
  };

  const saveCanvas = async () => {
    setIsSaving(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "drawing.png";
    link.click();
    setIsSaving(false);
  };

  const runRoute = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
  
    try {
      // Extract the user-drawn expression as an image
      const userExpressionData = canvas.toDataURL("image/png");
  
      // Send the user-drawn expression to the API
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/calculate`,
        { image: userExpressionData, dict_of_vars: dictOfVars }
      );
  
      const respData: Response[] = response.data.data;
      const updatedDict = { ...dictOfVars };
  
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Draw the preserved canvas state (user drawing only)
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = canvasBgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
  
        // Render user-drawn content
        const userImage = new Image();
        userImage.src = userExpressionData;
  
        userImage.onload = () => {
          ctx.drawImage(userImage, 0, 0);
  
          // Overlay the API results, adjusting the position for each result
          respData.forEach(({ expr, result, assign }, index) => {
            if (assign) updatedDict[expr] = result;
            const latex = `${expr} = ${result}`;
  
            // Adjust Y position for each new result
            ctx.fillStyle = color; // Set color for text rendering
            ctx.font = "20px Arial"; // Set font size and style for the text
            ctx.fillText(latex, 50, yPosition + index * 30); // Increment Y position for each result
          });
  
          setDictOfVars(updatedDict);
          setYPosition((prevYPosition) => prevYPosition + respData.length * 30); // Update yPosition for the next set of results
        };
      }
    } catch (error) {
      console.error("Error processing canvas:", error);
    }
  };
  

  return (
    <div className="flex h-screen">
      {/* Fixed Toolbar */}
      <div className="w-60 bg-gray-800 text-white p-6 h-full space-y-6">
      <Button onClick={runRoute} className="w-full bg-blue-500 hover:bg-blue-600">
           Calculate
        </Button>
        <Button onClick={() => setReset(true)} className="w-full bg-red-500 hover:bg-red-600">
           Reset
        </Button>
        <Button
          onClick={() => setEraserMode(!eraserMode)}
          className={`w-full ${eraserMode ? "bg-yellow-500" : "bg-gray-500"} hover:bg-yellow-600`}
        >
          <FaEraser className="mr-2" /> {eraserMode ? "Disable Eraser" : "Enable Eraser"}
        </Button>
        <div className="flex items-center">
          <FaPaintBrush className="mr-2" />
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <Button onClick={undo} className="w-full bg-gray-500 hover:bg-gray-600">
          <FaUndo className="mr-2" /> Undo
        </Button>
        <Button onClick={redo} className="w-full bg-gray-500 hover:bg-gray-600">
          <FaRedo className="mr-2" /> Redo
        </Button>
        <Button onClick={saveCanvas} className="w-full bg-blue-500 hover:bg-blue-600">
          {isSaving ? "Saving..." : <><FaSave className="mr-2" /> Save</>}
        </Button>
  
        {/* Color Picker Section */}
        <div>
          <div className="grid grid-cols-6 gap-3 mt-3">
            {SWATCHES.map((swatch) => (
              <div
                key={swatch}
                onClick={() => setColor(swatch)}
                style={{
                  backgroundColor: swatch,
                  border: swatch === color ? "2px solid yellow" : "2px solid transparent",
                  cursor: "pointer",
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                }}
                title={swatch} // Tooltip for color codes
              />
            ))}
          </div>
        </div>
  
        {/* Canvas Background Color */}
        <Button onClick={() => setCanvasBgColor("#000000")} className="w-full bg-gray-700 hover:bg-gray-800">
          <FaPalette className="mr-2" /> Dark Background
        </Button>
        <Button onClick={() => setCanvasBgColor("#ffffff")} className="w-full bg-gray-700 hover:bg-gray-800">
          <FaPalette className="mr-2" /> Light Background
        </Button>
      </div>
  
      {/* Canvas Area */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseOut={stopDrawing}
        />
        {/* Draggable Latex Expressions */}
        {latexExpressions.map((latex, index) => (
          <Draggable
            key={index}
            defaultPosition={latexPosition}
            onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
          >
            <div
              className="absolute"
              style={{ top: `${latexPosition.y}px`, left: `${latexPosition.x}px` }}
            >
              <p className="text-white bg-black px-3 py-2 rounded-md">{latex}</p>
            </div>
          </Draggable>
        ))}
      </div>
    </div>
  );
}  