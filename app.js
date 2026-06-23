/*--------------------------------------------------------initializing fabric canvas---------------------------------------------------------*/
const BASE_CANVAS_WIDTH = 1000;
const BASE_CANVAS_HEIGHT = 600;
let currentBackground = 'assets/backgrounds/cork-board.jpg';

const canvas = new fabric.Canvas('VisionBoard', {
  width: BASE_CANVAS_WIDTH,
  height: BASE_CANVAS_HEIGHT
});

function setCanvasBackgroundImage(imagePath = currentBackground, callback = () => canvas.renderAll()) {
    fabric.Image.fromURL(imagePath, (img) => {
        img.set({
            originX: 'left',
            originY: 'top',
            scaleX: BASE_CANVAS_WIDTH / img.width,
            scaleY: BASE_CANVAS_HEIGHT / img.height
        });

        canvas.setBackgroundImage(img, callback);
    });
}

setCanvasBackgroundImage(currentBackground);

fabric.Object.prototype.cornerStyle = "circle";

fabric.Object.prototype.cornerColor = "#f8b4d9";

fabric.Object.prototype.cornerStrokeColor = "#ffffff";

fabric.Object.prototype.cornerSize = 12;

fabric.Object.prototype.transparentCorners = false;

fabric.Object.prototype.borderColor = "#f8b4d9";

canvas.on("selection:created", () => {

    const obj = canvas.getActiveObject();

    if (!obj) return;

    obj.shadow = new fabric.Shadow({
        color: "rgba(251, 0, 38, 0.5)",
        blur: 15
    });

    canvas.renderAll();

});

canvas.on("selection:updated", () => {
    canvas.getObjects().forEach(obj => {
        obj.shadow = null;
    });

    const obj = canvas.getActiveObject();

    if (!obj) return;

    obj.shadow = new fabric.Shadow({
        color: "rgba(251, 0, 38, 0.5)",
        blur: 15
    });

    canvas.renderAll();

});

canvas.on("selection:cleared", () => {

    canvas.getObjects().forEach(obj => {
        obj.shadow = null;
    });

    canvas.renderAll();

});

/*-----------------------------------------------------------UNDO/REDO-----------------------------------------------------------*/
let undoStack = [];
let redoStack = [];
let isRestoring = false;

function saveState() {
    if (isRestoring) return;

    const json = JSON.stringify(
        canvas.toJSON(['customFilters'])
    );

    undoStack.push(json);

    redoStack = [];
}

canvas.on("object:added", saveState);
canvas.on("object:modified", saveState);
canvas.on("object:removed", saveState);

const undoBtn = document.getElementById("Undo");
undoBtn.addEventListener("click", undo);

// when cmd + z is pressed, undo, and when cmd + y is pressed, redo
document.addEventListener("keydown", (e) => {
    if (e.metaKey && e.key === "z" || (e.ctrlKey && e.key === "z")) {undo();}

    if (e.metaKey && e.key === "y" || (e.ctrlKey && e.key === "y")) {redo();}
});

const redoBtn = document.getElementById("Redo");
redoBtn.addEventListener("click", redo);

function undo() {
    if (undoStack.length <= 1)
        return;

    const currentState = undoStack.pop();

    redoStack.push(currentState);

    const previousState = undoStack[undoStack.length - 1];

    isRestoring = true;
    canvas.loadFromJSON(previousState, () => {
        setCanvasBackgroundImage(currentBackground, () => {
            canvas.renderAll();
            isRestoring = false;
        });
    });
}

function redo() {
    if (redoStack.length === 0)
        return;

    const nextState = redoStack.pop();

    undoStack.push(nextState);

    isRestoring = true;
    canvas.loadFromJSON(nextState, () => {
        setCanvasBackgroundImage(currentBackground, () => {
            canvas.renderAll();
            isRestoring = false;
        });
    });
}

saveState(); // Save initial state

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

    const aspectRatio = BASE_CANVAS_WIDTH / BASE_CANVAS_HEIGHT;
    let newWidth, newHeight;

    if (wrapperWidth / wrapperHeight > aspectRatio) {
        newHeight = wrapperHeight;
        newWidth = newHeight * aspectRatio;
    } else {
        newWidth = wrapperWidth;
        newHeight = newWidth / aspectRatio;
    }

    canvas.setDimensions({ width: newWidth, height: newHeight });
    canvas.setZoom(newWidth / BASE_CANVAS_WIDTH);
    setCanvasBackgroundImage(currentBackground);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas(); // Initial call to set the canvas size

/*-----------------------------------------------------------BASE FUNCTIONS-----------------------------------------------------------*/
function saveBoard() {
    const autoSaveLabel = document.getElementById("AutoSave");
    autoSaveLabel.textContent = "Saving...";
    
    const canvasData = canvas.toJSON(['customFilters']);
    delete canvasData.backgroundImage;

    const boardData = {canvas: canvasData, background: currentBackground };
    localStorage.setItem("manifest-board", JSON.stringify(boardData));
    setTimeout(() => {
        autoSaveLabel.textContent = "Saved";
    }, 1000);
}

function applyFilters(img) {

    const filters = [];

    filters.push(
        new fabric.Image.filters.Brightness({
            brightness: img.customFilters.brightness
        })
    );

    filters.push(
        new fabric.Image.filters.Contrast({
            contrast: img.customFilters.contrast
        })
    );

    filters.push(
        new fabric.Image.filters.Saturation({
            saturation: img.customFilters.saturation
        })
    );

    filters.push(
        new fabric.Image.filters.Blur({
            blur: img.customFilters.blur
        })
    );

    if (img.customFilters.grayscale) {
        filters.push(
            new fabric.Image.filters.Grayscale()
        );
    }

    if (img.customFilters.sepia) {
        filters.push(
            new fabric.Image.filters.Sepia()
        );
    }

    if (img.customFilters.invert) {
        filters.push(
            new fabric.Image.filters.Invert()
        );
    }

    img.filters = filters;

    img.applyFilters();
    canvas.renderAll();
    saveBoard();
}

function initializeFilters(img) {

    if (!img.customFilters) {
        img.customFilters = {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            blur: 0,

            grayscale: false,
            sepia: false,
            invert: false
        };
    }
}

function updateImageEditorUI(img) {
    brightnessSlider.value =
        img.customFilters?.brightness ?? 0;

    contrastSlider.value =
        img.customFilters?.contrast ?? 0;

    saturationSlider.value =
        img.customFilters?.saturation ?? 0;

    blurSlider.value =
        img.customFilters?.blur ?? 0;

    grayscaleBtn.checked =
        img.customFilters.grayscale;

    sepiaBtn.checked =
        img.customFilters.sepia;

    invertBtn.checked = 
        img.customFilters.invert;
}

function addImageToCanvas(src) {
    fabric.Image.fromURL(src, (img) => {
        initializeFilters(img);

        img.set({
            left: 150,
            top: 150,
            scaleX: 0.5,
            scaleY: 0.5
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        saveBoard();
    });
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
            img.customFilters = {
                brightness: 0,
                contrast: 0,
                saturation: 0,

                grayscale: false,
                sepia: false,
                invert: false,

                blur: 0
            };
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

// when delete key is pressed, delete the active object
document.addEventListener("keydown", (e) => {
    if (e.key === "Delete" || e.key === "Backspace") {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            canvas.remove(activeObject);
            canvas.renderAll();
        }
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
        setCanvasBackgroundImage();
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

// when up arrow key is pressed, bring the active object forward
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowUp") {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.bringForward();
            canvas.renderAll();
        }
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

// when down arrow key is pressed, send the active object backward
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.sendBackwards();
            canvas.renderAll();
        }
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
    const savedData = JSON.parse(localStorage.getItem("manifest-board"));
    if (savedData) {
        const savedCanvas = savedData.canvas || savedData;
        currentBackground = savedData.background || currentBackground;

        canvas.loadFromJSON(savedCanvas, () => {
            canvas.getObjects().forEach(obj => {
                if (obj.type === "image") {
                    initializeFilters(obj);
                    applyFilters(obj);
                    obj.dirty = true;
                }
            });

            setCanvasBackgroundImage(currentBackground, () => {
                canvas.renderAll();
            });
        });
    }
});

// automatically save board every time something changes
canvas.on("object:added", saveBoard);
canvas.on("object:modified", saveBoard);
canvas.on("object:removed", saveBoard);

// DuplicateObject button
const duplicateObjectBtn = document.getElementById("Duplicate");

duplicateObjectBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (activeObject) {
        activeObject.clone((cloned) => {
            if (activeObject.customFilters) {
                cloned.customFilters = JSON.parse(JSON.stringify(activeObject.customFilters));
                applyFilters(cloned);
            }
            cloned.set({
                left: activeObject.left + 20,
                top: activeObject.top + 20
            });
            canvas.add(cloned);
            canvas.setActiveObject(cloned);
            canvas.renderAll();
            saveBoard();
        });
    }
});

// when cmd + c is pressed, copy the active object, and when cmd + v is pressed, paste the copied object
let clipboard = null;
// change ctrl to metaKey for MacOS
document.addEventListener("keydown", (e) => {
    if (e.metaKey && e.key === "c" || (e.ctrlKey && e.key === "c")
    ) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((cloned) => {
                if (activeObject.customFilters) {
                    cloned.customFilters = JSON.parse(JSON.stringify(activeObject.customFilters));
                    applyFilters(cloned);
                }
                clipboard = cloned;
            });
        }
    }

    if (e.metaKey && e.key === "v" || (e.ctrlKey && e.key === "v")) {
        if (clipboard) {
            clipboard.clone((cloned) => {
                if (clipboard.customFilters) {
                    cloned.customFilters = JSON.parse(JSON.stringify(clipboard.customFilters));
                    applyFilters(cloned);
                }
                cloned.set({
                    left: cloned.left + 20,
                    top: cloned.top + 20
                });
                canvas.add(cloned);
                canvas.setActiveObject(cloned);
                canvas.renderAll();
                saveBoard();
            });
        }
    }
});

const groupBtn = document.getElementById("GroupObjects");
groupBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== "activeSelection") {
        alert("Select at least 2 objects.");
        return;
    }
    const group = activeObject.toGroup();
    canvas.setActiveObject(group);
    canvas.renderAll();
    saveBoard();
});

const ungroupBtn = document.getElementById("UngroupObjects");
ungroupBtn.addEventListener("click", () => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.type !== "group") return;
    activeObject.toActiveSelection();
    canvas.renderAll();
    saveBoard();
});

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
            // change color of active button
            toolbarBtns.forEach(button => {
                if (button === btn) {
                    button.classList.add("active");
                } else {
                    button.classList.remove("active");
                }
            });
        }
    });
});


/*-----------------------------------------------------------MODAL FUNCTIONALITY-----------------------------------------------------------*/
// sticker modal
const stickerModalBtn = document.getElementById("StickersButton");
const stickerModal = document.getElementById("stickerModal");
const closeStickerBtn = document.getElementById("closeSticker");
const toolbar = document.getElementById("ToolBar");

const flowersBtn = document.getElementById("flowersBtn");
const schoolBtn = document.getElementById("schoolBtn");
const sealsBtn = document.getElementById("sealsBtn");
const bowsBtn = document.getElementById("bowsBtn");
const travelBtn = document.getElementById("travelBtn");

stickerModalBtn.addEventListener("click", () => {
    activeModal = stickerModal;
    stickerModal.style.display = "block";
    stickerModal.classList.add("slideUp");
    stickerModal.style.height = "50%";
    setTimeout(() => {
        toolbar.style.display = "flex";
        toolbar.style.zIndex = "101";
    }, 500);
    toolbarBtns.forEach(button => {
        if (button.id === "sbtn") {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });

    // make the dividers category active by default, and load the dividers decor items
    flowersBtn.classList.add("active");
    fetch("assets/data/stickers/flowers.json")
        .then(res => res.json())
        .then(items => {
            const container = document.getElementById("stickerContainer");
            container.innerHTML = "";
            items.forEach(file => {
                const img = document.createElement("img");
                img.src = `assets/stickers/flowers/${file}`;
                img.classList.add("pre-sticker");
                img.alt = file;
                img.addEventListener("click", () => {
                    addImageToCanvas(img.src);
                });
                container.appendChild(img);
            });
        })
        .catch(err => {
            console.error("Error loading flowers stickers:", err);
        });
});

[flowersBtn, schoolBtn, sealsBtn, bowsBtn, travelBtn].forEach(button => {
    button.addEventListener("click", () => {
        [flowersBtn, schoolBtn, sealsBtn, bowsBtn, travelBtn].forEach(btn => {
            btn.classList.remove("active");
        });
        button.classList.add("active");
        const category = button.id.replace("Btn", "");
        fetch(`assets/data/stickers/${category.toLowerCase()}.json`)
            .then(res => res.json())
            .then(items => {
                const container = document.getElementById("stickerContainer");
                container.innerHTML = "";
                items.forEach(file => {
                    const img = document.createElement("img");
                    img.src = `assets/stickers/${category.toLowerCase()}/${file}`;
                    img.classList.add("pre-sticker");
                    img.alt = file;
                    img.addEventListener("click", () => {
                        addImageToCanvas(img.src);
                    });
                    container.appendChild(img);
                });
            })
            .catch(err => {
                console.error(`Error loading ${category} stickers:`, err);
            });
    });
});


closeStickerBtn.addEventListener("click", () => {
    stickerModal.classList.remove("slideUp");
    toolbar.style.display = "none";
    stickerModal.classList.add("slideDown");
    setTimeout(() => {
        stickerModal.style.display = "none";
        stickerModal.classList.remove("slideDown");
    }, 500);

    // reset category buttons
    [flowersBtn, schoolBtn, sealsBtn, bowsBtn, travelBtn].forEach(btn => {
        btn.classList.remove("active");
    });
});


// decor modal
const decorModalBtn = document.getElementById("DecorButton");
const decorModal = document.getElementById("decorModal");
const closeDecorBtn = document.getElementById("closeDecor");

const dividersBtn = document.getElementById("dividersBtn");
const doodlesBtn = document.getElementById("doodlesBtn");
const paperBtn = document.getElementById("paperBtn");
const shapesBtn = document.getElementById("shapesBtn");
const tapesBtn = document.getElementById("tapesBtn");
const magazineBtn = document.getElementById("magazineBtn");


decorModalBtn.addEventListener("click", () => {
    activeModal = decorModal;
    decorModal.classList.add("slideUp");
    decorModal.style.display = "block";
    decorModal.style.height = "50%";
    setTimeout(() => {
        toolbar.style.display = "flex";
        toolbar.style.zIndex = "101";
    }, 500);
    toolbarBtns.forEach(button => {
        if (button.id === "dbtn") {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
    // make the dividers category active by default, and load the dividers decor items
    dividersBtn.classList.add("active");
    fetch("assets/data/decor/dividers.json")
        .then(res => res.json())
        .then(items => {
            const container = document.getElementById("decorContainer");
            container.innerHTML = "";
            items.forEach(file => {
                const img = document.createElement("img");
                img.src = `assets/decor/dividers/${file}`;
                img.classList.add("pre-sticker");
                img.alt = file;
                img.addEventListener("click", () => {
                    addImageToCanvas(img.src);
                });
                container.appendChild(img);
            });
        })
        .catch(err => {
            console.error("Error loading dividers decor:", err);
        });
});


[dividersBtn, doodlesBtn, paperBtn, shapesBtn, tapesBtn, magazineBtn].forEach(button => {
    button.addEventListener("click", () => {
        [dividersBtn, doodlesBtn, paperBtn, shapesBtn, tapesBtn, magazineBtn].forEach(btn => {
            btn.classList.remove("active");
        });
        button.classList.add("active");
        const category = button.id.replace("Btn", "");
        fetch(`assets/data/decor/${category.toLowerCase()}.json`)
            .then(res => res.json())
            .then(items => {
                const container = document.getElementById("decorContainer");
                container.innerHTML = "";
                items.forEach(file => {
                    const img = document.createElement("img");
                    img.src = `assets/decor/${category.toLowerCase()}/${file}`;
                    img.classList.add("pre-sticker");
                    img.alt = file;
                    img.addEventListener("click", () => {
                        addImageToCanvas(img.src);
                    });
                    container.appendChild(img);
                });
            })
            .catch(err => {
                console.error(`Error loading ${category} decor:`, err);
            });
    });
});



closeDecorBtn.addEventListener("click", () => {
    decorModal.classList.remove("slideUp");
    toolbar.style.display = "none";
    decorModal.classList.add("slideDown");
    setTimeout(() => {
        decorModal.style.display = "none";
        decorModal.classList.remove("slideDown");
    }, 500);
    // reset category buttons
    [dividersBtn, doodlesBtn, paperBtn, shapesBtn, tapesBtn, magazineBtn].forEach(btn => {
        btn.classList.remove("active");
    });
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
    setTimeout(() => {
        toolbar.style.display = "flex";
        toolbar.style.zIndex = "101";
    }, 500);
    toolbarBtns.forEach(button => {
        if (button.id === "fbtn") {
            button.classList.add("active");
        } else {
            button.classList.remove("active");
        }
    });
});

fetch("assets/data/frames.json")
  .then(res => res.json())
  .then(frames => {
    const container = document.getElementById("frameContainer");

    frames.forEach(file => {
      const img = document.createElement("img");

      img.src = `assets/frames/${file}`;
      img.classList.add("pre-sticker");
      img.alt = file;

      img.addEventListener("click", () => {
        addImageToCanvas(img.src);
      });

      container.appendChild(img);
    });
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

/*when clicking outside the modal, close it*/
window.addEventListener("click", (e) => {
    if (activeModal && !activeModal.contains(e.target) && !e.target.classList.contains("toolbar-btn")) {
        activeModal.classList.remove("slideUp");
        activeModal.classList.add("slideDown");
        toolbar.style.display = "none";
        setTimeout(() => {
            activeModal.style.display = "none";
            activeModal.classList.remove("slideDown");
            activeModal = null;
        }, 500);
    }
});

/*-----------------------------------------------------------ADDING CONTENT TO CANVAS-----------------------------------------------------------*/
// Adding stickers to canvas
const stickers = document.querySelectorAll(".pre-sticker");
stickers.forEach(sticker => {
    sticker.addEventListener("click", () => {
        addImageToCanvas(sticker.getAttribute("src"));
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

/*-----------------------------------------------------------IMAGE EDITING-----------------------------------------------------------*/
// when a image is selected, open the image edit modal
canvas.on("selection:created", () => {
    const selectedObject =
        canvas.getActiveObject();

    if (selectedObject && selectedObject.type === "image") {
        initializeFilters(selectedObject);
        document.getElementById("imageEditBox").style.display = "block";
        updateImageEditorUI(selectedObject);
    }
});

canvas.on("selection:updated", () => {
    const selectedObject = canvas.getActiveObject();

    if (selectedObject && selectedObject.type === "image") {
        initializeFilters(selectedObject);
        document.getElementById("imageEditBox").style.display = "block";
        updateImageEditorUI(selectedObject);
    } else {
        document.getElementById("imageEditBox").style.display = "none";
    }
});

canvas.on("selection:cleared", () => {
    document.getElementById("imageEditBox").style.display = "none";
});

// brightness change
const brightnessSlider =document.getElementById("brightness");
brightnessSlider.addEventListener("input", () => {

    const img = canvas.getActiveObject();

    if (!img || img.type !== "image") return;

    img.customFilters.brightness = parseFloat(brightnessSlider.value);

    applyFilters(img);

});

// contrast change
const contrastSlider = document.getElementById("contrast");
contrastSlider.addEventListener("input", () => {

    const img = canvas.getActiveObject();

    if (!img || img.type !== "image") return;

    img.customFilters.contrast =  parseFloat(contrastSlider.value);

    applyFilters(img);

});

// saturation change
const saturationSlider = document.getElementById("saturation");
saturationSlider.addEventListener("input", () => {

    const img = canvas.getActiveObject();

    if (!img || img.type !== "image") return;

    img.customFilters.saturation = parseFloat(saturationSlider.value);

    applyFilters(img);

});

// grayscale toggle
const grayscaleBtn = document.getElementById("grayScale");

grayscaleBtn.addEventListener("change", () => {
    const img = canvas.getActiveObject();
    if (!img || img.type !== "image") return;
    initializeFilters(img);

    img.customFilters.grayscale = !img.customFilters.grayscale;
    grayscaleBtn.checked = img.customFilters.grayscale;
    applyFilters(img);
});

// blur scale
const blurSlider = document.getElementById("blur");
blurSlider.addEventListener("input", () => {
    const img = canvas.getActiveObject();
    if (!img || img.type !== "image") return;

    img.customFilters.blur = parseFloat(blurSlider.value);
    applyFilters(img);
});

// sepia toggle
const sepiaBtn =document.getElementById("sepia");
sepiaBtn.addEventListener("change", () => {
    const img = canvas.getActiveObject();
    if (!img || img.type !== "image") return;
    initializeFilters(img);

    img.customFilters.sepia = !img.customFilters.sepia;
    sepiaBtn.checked = img.customFilters.sepia;
    applyFilters(img);
});

// invert toggle
const invertBtn =document.getElementById("invert");
invertBtn.addEventListener("change", () => {
    const img = canvas.getActiveObject();
    if (!img || img.type !== "image")return;

    img.customFilters.invert = !img.customFilters.invert;
    invertBtn.checked = img.customFilters.invert;
    applyFilters(img);
});

// reset filters button
const resetFiltersBtn =
document.getElementById("resetFilters");

resetFiltersBtn.addEventListener("click", () => {
    const img = canvas.getActiveObject();
    initializeFilters(img);
    brightnessSlider.value = 0;
    contrastSlider.value = 0;
    saturationSlider.value = 0;
    blurSlider.value = 0;

    grayscaleBtn.checked = false;
    sepiaBtn.checked = false;
    invertBtn.checked = false;

    img.customFilters = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        blur: 0,

        grayscale: false,
        sepia: false,
        invert: false
    };

    applyFilters(img);
});

/*-----------------------------------------------------------SETTINGS-----------------------------------------------------------*/
const settingsBtn = document.getElementById("SettingsBtn");
const settingsModal = document.getElementById("settingsOverlay");

settingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "block";
});

const closeSettingsBtn = document.getElementById("closeSettings");
closeSettingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "none";
});

const corkBoardOption = document.getElementById("cork-preview");
corkBoardOption.addEventListener("click", () => {
    currentBackground = 'assets/backgrounds/cork-board.jpg';
    setCanvasBackgroundImage(currentBackground, () => {
        canvas.renderAll();
        saveBoard();
    });
});

const whiteBoardOption = document.getElementById("whiteB-preview");
whiteBoardOption.addEventListener("click", () => {
    currentBackground = 'assets/backgrounds/white-board.jpg';
    setCanvasBackgroundImage(currentBackground, () => {
        canvas.renderAll();
        saveBoard();
    });
});

const gridPaperOption = document.getElementById("grid-preview");
gridPaperOption.addEventListener("click", () => {
    currentBackground = 'assets/backgrounds/grid-paper.jpg';
    setCanvasBackgroundImage(currentBackground, () => {
        canvas.renderAll();
        saveBoard();
    });
});

const dottedPaperOption = document.getElementById("dotted-preview");
dottedPaperOption.addEventListener("click", () => {
    currentBackground = 'assets/backgrounds/dotted-paper.jpg';
    setCanvasBackgroundImage(currentBackground, () => {
        canvas.renderAll();
        saveBoard();
    });
});

const scrapBookOption = document.getElementById("scrapB-preview");
scrapBookOption.addEventListener("click", () => {
    currentBackground = 'assets/backgrounds/white-scrapbook-paper.jpg';
    setCanvasBackgroundImage(currentBackground, () => {
        canvas.renderAll();
        saveBoard();
    });
});

const darkPaperOption = document.getElementById("dark-preview");
darkPaperOption.addEventListener("click", () => {
    currentBackground = 'assets/backgrounds/dark-paper.jpg';
    setCanvasBackgroundImage(currentBackground, () => {
        canvas.renderAll();
        saveBoard();
    });
});