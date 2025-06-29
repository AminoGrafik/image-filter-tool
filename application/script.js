document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const customUploadButton = document.getElementById('custom-upload-button');
    const uploadButton = document.getElementById('upload-button');
    const imagePreview = document.getElementById('image-preview');
    const filteredCanvas = document.getElementById('filtered-canvas');
    const downloadButton = document.getElementById('download-button');
    const filterSelect = document.getElementById('filter-select');
    const duotoneControls = document.getElementById('duotone-controls');
    const asciiControls = document.getElementById('ascii-controls');
    const color1Input = document.getElementById('color1');
    const color2Input = document.getElementById('color2');
    const asciiOutput = document.getElementById('ascii-output');

    const ctx = filteredCanvas.getContext('2d');
    let originalImage = null;

    // Trigger hidden file input when the custom button is clicked
    customUploadButton.addEventListener('click', () => {
        uploadButton.click();
    });

    // Handle image upload and processing
    uploadButton.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                originalImage = new Image();
                originalImage.onload = () => {
                    applyCurrentFilter();
                    downloadButton.disabled = false;
                };
                originalImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Re-apply the current filter whenever a control is changed
    filterSelect.addEventListener('change', applyCurrentFilter);
    color1Input.addEventListener('input', applyCurrentFilter);
    color2Input.addEventListener('input', applyCurrentFilter);

    // Main function to direct to the correct filter
    function applyCurrentFilter() {
        if (!originalImage) return;

        const selectedFilter = filterSelect.value;
        toggleControlVisibility(selectedFilter);

        // Reset canvas to original image before applying filter
        filteredCanvas.width = originalImage.width;
        filteredCanvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);

        if (selectedFilter === 'duotone') {
            applyDuotoneFilter();
        } else if (selectedFilter === 'ascii') {
            applyAsciiFilter();
        } else if (selectedFilter === 'sepia') {
            applySepiaFilter();
        } else if (selectedFilter === 'invert') {
            applyInvertFilter();
        }
    }

    // Manages which control panel is visible based on the selected filter
    function toggleControlVisibility(filter) {
        // Show canvas and hide ASCII output by default for all image filters
        filteredCanvas.style.display = 'block';
        asciiOutput.style.display = 'none';

        if (filter === 'duotone') {
            duotoneControls.style.display = 'flex';
            asciiControls.style.display = 'none';
        } else if (filter === 'ascii') {
            asciiControls.style.display = 'block';
            duotoneControls.style.display = 'none';
            // For ASCII, hide the canvas and show the text output
            filteredCanvas.style.display = 'none';
            asciiOutput.style.display = 'block';
        } else {
            // For all other filters (Sepia, Invert, etc.), hide all specific controls
            duotoneControls.style.display = 'none';
            asciiControls.style.display = 'none';
        }
    }
    
    // === NEW FILTER FUNCTION: SEPIA ===
    function applySepiaFilter() {
        const imageData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // === NEW FILTER FUNCTION: INVERT ===
    function applyInvertFilter() {
        const imageData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // Applies the DUOTONE effect to the canvas
    function applyDuotoneFilter() {
        const imageData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        const data = imageData.data;
        const color1 = hexToRgb(color1Input.value);
        const color2 = hexToRgb(color2Input.value);

        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const t = avg / 255;
            data[i] = color1.r + (color2.r - color1.r) * t;
            data[i + 1] = color1.g + (color2.g - color1.g) * t;
            data[i + 2] = color1.b + (color2.b - color1.b) * t;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // Applies the ASCII ART effect
    function applyAsciiFilter() {
        const density = 'Ñ@#W$9876543210?!abc;:+=-,._ ';
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const maxWidth = 120;
        const scale = maxWidth / originalImage.width;
        tempCanvas.width = maxWidth;
        tempCanvas.height = originalImage.height * scale * 0.5;
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
        if (asciiOutput.clientWidth > 0) {
            asciiOutput.style.fontSize = `${asciiOutput.clientWidth / maxWidth * 1.4}px`;
            asciiOutput.style.lineHeight = '1.1';
        }
    }

    // Handles downloading the generated image or text file
    downloadButton.addEventListener('click', () => {
        if (!originalImage) return;

        const selectedFilter = filterSelect.value;
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (selectedFilter === 'ascii') {
            link.download = `ascii-art-${timestamp}.txt`;
            const blob = new Blob([asciiOutput.textContent], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
        } else {
            // This now handles Duotone, Sepia, Invert, and any future canvas filters
            link.download = `${selectedFilter}-image-${timestamp}.png`;
            link.href = filteredCanvas.toDataURL('image/png');
        }
        link.click();
    });

    // Helper utility to convert a hex color string to an RGB object
    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }
});
