// initializing fabric canvas
const canvas = new fabric.Canvas('VisionBoard', {
  width: 1000,
  height: 600, 
  backgroundColor: '#b98b62'
});

// button functionality

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