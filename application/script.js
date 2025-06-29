// ASCII FILTER (Corrected Version)
function applyAsciiFilter() {
    // This string maps darker pixels to denser characters.
    const density = 'Ñ@#W$9876543210?!abc;:+=-,._ ';
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Resize image for performance and to fit the character grid
    const maxWidth = 120; // Increased clarity slightly
    const scale = maxWidth / originalImage.width;
    tempCanvas.width = maxWidth;
    tempCanvas.height = originalImage.height * scale * 0.5; // Adjust aspect ratio for characters

    tempCtx.drawImage(originalImage, 0, 0, tempCanvas.width, tempCanvas.height);

    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;

    let asciiStr = '';
    for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
            const i = (y * tempCanvas.width + x) * 4;
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const charIndex = Math.floor((avg / 255) * (density.length - 1));
            asciiStr += density.charAt(charIndex);
        }
        asciiStr += '\n';
    }
    asciiOutput.textContent = asciiStr;

    // *** THE FIX IS HERE ***
    // Base the font-size on the visible container, not the hidden canvas
    if (asciiOutput.clientWidth > 0) {
        asciiOutput.style.fontSize = `${asciiOutput.clientWidth / maxWidth * 1.4}px`;
        // Ensure line height is tight to prevent gaps
        asciiOutput.style.lineHeight = '1.1';
    }
}
