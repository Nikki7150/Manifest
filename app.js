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

// AddSticker button
/*const addStickerBtn = document.getElementById("AddStickerButton");
addStickerBtn.addEventListener("click", () => {
    const stickerUrl = "https://cdn-icons-png.flaticon.com/512/616/616408.png"; // Example sticker URL
    fabric.Image.fromURL(stickerUrl, (img) => {
        img.set({
            left: 150,
            top: 150,
            scaleX: 0.3,
            scaleY: 0.3
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
    });
});*/

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