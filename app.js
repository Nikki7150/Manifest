/*--------------------------------------------------------initializing fabric canvas---------------------------------------------------------*/
const canvas = new fabric.Canvas('VisionBoard', {
  width: 1000,
  height: 600, 
  backgroundColor: '#b98b62'
});

fabric.Text.prototype._setTextStyles = function(ctx, style, forMeasuring) {
    ctx.textBaseline = "alphabetic";
    if (this.path) {
        switch (this.pathAlign) {
            case "center":
                ctx.textBaseline = "middle";
                break;
            case "ascender":
                ctx.textBaseline = "top";
                break;
            case "descender":
                ctx.textBaseline = "bottom";
                break;
        }
    }
    ctx.font = this._getFontDeclaration(style, forMeasuring);
};

/*-----------------------------------------------------------MAINTAINING ASPECT RATIO ON RESIZE-----------------------------------------------------------*/
function resizeCanvas() {
    const wrapper = document.getElementById('BoardWrapper');
    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;

    const aspectRatio = canvas.width / canvas.height;
    let newWidth, newHeight;

    if (wrapperWidth / wrapperHeight > aspectRatio) {
        newHeight = wrapperHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = wrapperWidth;
        newHeight = newWidth / aspectRatio;
    }

    canvas.setDimensions({ width: newWidth, height: newHeight });
    canvas.setZoom(newWidth / 1000); // Assuming original width is 1000
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call to set the canvas size

/*-----------------------------------------------------------BASE FUNCTIONS-----------------------------------------------------------*/
function saveBoard() {
    const autoSaveLabel = document.getElementById("AutoSave");
    autoSaveLabel.textContent = "Saving...";
    
    const boardData = JSON.stringify(canvas.toJSON());
    localStorage.setItem("manifest-board", boardData);
    setTimeout(() => {
        autoSaveLabel.textContent = "Saved";
    }, 1000);
}

/*-----------------------------------------------------------BUTTON FUNCTIONALITY-----------------------------------------------------------*/
// AddText button
const addTextBtn = document.getElementById("AddTextButton");
addTextBtn.addEventListener("click", () => {
    const text = new fabric.Textbox("New Text", {
        left: 100,
        top: 100,
        fontSize: 24, 
        fill: "#3d2b1f"
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
});

// UploadImage button
const uploadImageBtn = document.getElementById("UploadImageButton");
const imageInput = document.getElementById("ImageUploadInput");
uploadImageBtn.addEventListener("click", () => {
    imageInput.click();
});

imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
            const maxWidth = 300;
            const maxHeight = 300;

            const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);

            img.set({
                left: 200,
                top: 200,
                scaleX: scale,
                scaleY: scale
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
    imageInput.value = ""; // Reset the input for future uploads
});

// DeleteObject button
const deleteObjectBtn = document.getElementById("DeleteObject");

deleteObjectBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        canvas.remove(activeObject);
        canvas.renderAll();
    }
});

// DownloadBoard button 
const downloadBoardBtn = document.getElementById("DownloadBoard");

downloadBoardBtn.addEventListener("click", () => {
    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1.0
    });
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'vision_board.png';
    link.click();
});

// ClearBoard button
const clearBoardBtn = document.getElementById("ClearBoard");

clearBoardBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear the vision board? This action cannot be undone.")) {
        canvas.clear();
        canvas.setBackgroundColor('#b98b62', canvas.renderAll.bind(canvas));
    }

    localStorage.removeItem("manifest-board");
});

// BringForward button
const bringForwardBtn = document.getElementById("BringForward");

bringForwardBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.bringForward();
        canvas.renderAll();
    }
});

// SendBackward button
const sendBackwardBtn = document.getElementById("SendBackward");

sendBackwardBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.sendBackwards();
        canvas.renderAll();
    }
});

// DrawingMode button
const toolbarButtons = document.querySelectorAll(".toolbar-btn");
const drawingModeBtn = document.getElementById("DrawingMode");
drawingModeBtn.addEventListener("click", () => {
    canvas.isDrawingMode = !canvas.isDrawingMode;
    document.getElementById("drawingTools").classList.toggle("hidden", !canvas.isDrawingMode);

    if (canvas.isDrawingMode) {
        drawingModeBtn.textContent = "✏️ Exit Drawing";
        drawingModeBtn.classList.add("active");
        alert("Drawing mode enabled. Turn it off to move objects.");
        canvas.freeDrawingBrush.width = 1;
        canvas.freeDrawingBrush.color = "#000000";
        const showSize = document.getElementById("size");
        showSize.textContent = canvas.freeDrawingBrush.width;

        toolbarButtons.forEach(button => {
            button.disabled = canvas.isDrawingMode;
            button.style.cursor = canvas.isDrawingMode ? "not-allowed" : "pointer";
        });

    } else {
        drawingModeBtn.textContent = "✏️ Draw";
        drawingModeBtn.classList.remove("active");

        // Re-enable toolbar buttons when exiting drawing mode
        toolbarButtons.forEach(button => {
            button.disabled = false;
            button.style.cursor = "pointer";
        });
    }
});

// SaveBoard button
const saveBoardBtn = document.getElementById("SaveBoard");

saveBoardBtn.addEventListener("click", () => {
    saveBoard();
    alert("Vision board saved successfully!");
});

// automatically load saved board on page load
window.addEventListener("load", () => {
    const savedBoard = localStorage.getItem("manifest-board");
    if (savedBoard) {
        canvas.loadFromJSON(savedBoard, () => {
            canvas.renderAll();
        });
    }
});

// automatically save board every time something changes
canvas.on("object:added", saveBoard);
canvas.on("object:modified", saveBoard);
canvas.on("object:removed", saveBoard);


/*-----------------------------------------------------------TOOLBAR FUNCTIONALITY-----------------------------------------------------------*/
let activeModal = null;
// ToolBar button handlers (for switching between tabs)
const toolbarBtns = document.querySelectorAll('#ToolBar button');
toolbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const map = {
        sbtn: stickerModal,
        dbtn: decorModal,
        fbtn: frameModal
        };
        const targetModal = map[btn.id];
        if (!targetModal) return;
        if (activeModal === targetModal) {
            return;
        } else {
            if (activeModal) {
                activeModal.style.display = "none";
                activeModal.classList.remove("slideUp", "slideDown");
            }
            activeModal = targetModal;
            targetModal.style.display = "block";
            targetModal.classList.remove("slideUp", "slideDown");
            targetModal.style.height = "50%";
            toolbar.style.display = "flex";
            toolbar.style.zIndex = "101";
        }
    });
});


/*-----------------------------------------------------------MODAL FUNCTIONALITY-----------------------------------------------------------*/
// sticker modal
const stickerModalBtn = document.getElementById("StickersButton");
const stickerModal = document.getElementById("stickerModal");
const closeStickerBtn = document.getElementById("closeSticker");
const toolbar = document.getElementById("ToolBar");

stickerModalBtn.addEventListener("click", () => {
    activeModal = stickerModal;
    stickerModal.style.display = "block";
    stickerModal.classList.add("slideUp");
    stickerModal.style.height = "50%";
    setTimeout(() => {
        toolbar.style.display = "flex";
        toolbar.style.zIndex = "101";
    }, 500);
});

closeStickerBtn.addEventListener("click", () => {
    stickerModal.classList.remove("slideUp");
    toolbar.style.display = "none";
    stickerModal.classList.add("slideDown");
    setTimeout(() => {
        stickerModal.style.display = "none";
        stickerModal.classList.remove("slideDown");
    }, 500);
});


// decor modal
const decorModalBtn = document.getElementById("DecorButton");
const decorModal = document.getElementById("decorModal");
const closeDecorBtn = document.getElementById("closeDecor");

decorModalBtn.addEventListener("click", () => {
    activeModal = decorModal;
    decorModal.classList.add("slideUp");
    decorModal.style.display = "block";
    decorModal.style.height = "50%";
    toolbar.style.zIndex = "101";
    toolbar.style.display = "flex";
});

closeDecorBtn.addEventListener("click", () => {
    decorModal.classList.remove("slideUp");
    toolbar.style.display = "none";
    decorModal.classList.add("slideDown");
    setTimeout(() => {
        decorModal.style.display = "none";
        decorModal.classList.remove("slideDown");
    }, 500);
});


// frame modal
const frameModalBtn = document.getElementById("FramesButton");
const frameModal = document.getElementById("framesModal");
const closeFrameBtn = document.getElementById("closeFrame");

frameModalBtn.addEventListener("click", () => {
    activeModal = frameModal;
    frameModal.classList.add("slideUp");
    frameModal.style.display = "block";
    frameModal.style.height = "50%";
    toolbar.style.display = "flex";
    toolbar.style.zIndex = "101";
});

closeFrameBtn.addEventListener("click", () => {
    frameModal.classList.remove("slideUp");
    toolbar.style.display = "none";
    frameModal.classList.add("slideDown");
    setTimeout(() => {
        frameModal.style.display = "none";
        frameModal.classList.remove("slideDown");
    }, 500);
});

/*-----------------------------------------------------------ADDING CONTENT TO CANVAS-----------------------------------------------------------*/
// Adding stickers to canvas
const stickers = document.querySelectorAll(".pre-sticker");
stickers.forEach(sticker => {
    sticker.addEventListener("click", () => {
        const src = sticker.getAttribute("src");
        fabric.Image.fromURL(src, (img) => {
            img.set({
                left: 150,
                top: 150,
                scaleX: 0.5,
                scaleY: 0.5
            });
            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
        });
    });
});

/*-----------------------------------------------------------DRAWING TOOLS-----------------------------------------------------------*/ 
const colorPicker = document.getElementById("color");
colorPicker.addEventListener("change", (e) => {
    canvas.freeDrawingBrush.color = e.target.value;
});

const showSize = document.getElementById("size");
showSize.textContent = canvas.freeDrawingBrush.width;

const brushSizeSlider = document.getElementById("brushSize");

canvas.freeDrawingBrush.width = 1;
showSize.textContent = 1;

brushSizeSlider.addEventListener("input", (e) => {
    const size = Number(e.target.value);

    canvas.freeDrawingBrush.width = size;
    showSize.textContent = size;
});

const clearDrawingBtn = document.getElementById("clear");
clearDrawingBtn.addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all drawings? This action cannot be undone.")) {
        const objects = canvas.getObjects();
        objects.forEach(obj => {
            if (obj.type === "path") {
                canvas.remove(obj);
            }
        });
        canvas.renderAll();
    }
});

/*-----------------------------------------------------------TEXT EDITING-----------------------------------------------------------*/
const fonts = [
    "Poppins",
    "Inter",
    "Montserrat",
    "Playfair Display",
    "Merriweather",
    "Lora",
    "Pacifico",
    "Dancing Script",
    "Bebas Neue",
    "Architects Daughter", "Caveat", "Caveat Brush", "Dancing Script",
  "Gochi Hand", "Indie Flower", "Kalam", "Permanent Marker",
  "Playpen Sans", "Shadows Into Light"
];

const fontList = document.getElementById("fontList");

fonts.forEach(font => {

    const button = document.createElement("button");

    button.textContent = font;
    button.classList.add("font-button");
    button.style.fontFamily = font;

    fontList.appendChild(button);

    button.addEventListener("click", () => {
        const activeObject = canvas.getActiveObject();

        if (activeObject && activeObject.type === "textbox") {
            activeObject.set({fontFamily: font});
            canvas.renderAll();
            saveBoard();
        }
    });

});

// text color change
const color = document.getElementById("f-color");
color.addEventListener("input", (e) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.type === "textbox") {
        activeObject.set({
            fill: e.target.value
        });
        canvas.renderAll();
        saveBoard();
    }
});

// when a textbox is selected, open the text edit modal
canvas.on("selection:created", () => {
    const selectedObject = canvas.getActiveObject();

    if (selectedObject && selectedObject.type === "textbox") {
        document.getElementById("textEditBox").style.display = "block";
    }
});

canvas.on("selection:updated", () => {
    const selectedObject = canvas.getActiveObject();

    if (selectedObject && selectedObject.type === "textbox") {
        document.getElementById("textEditBox").style.display = "block";
    } else {
        document.getElementById("textEditBox").style.display = "none";
    }
});

canvas.on("selection:cleared", () => {
    document.getElementById("textEditBox").style.display = "none";
});

