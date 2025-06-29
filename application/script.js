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

        if (selectedFilter === 'duotone') {
            applyDuotoneFilter();
        } else if (selectedFilter === 'ascii') {
            applyAsciiFilter();
        }
    }

    // Manages which control panel is visible based on the selected filter
    function toggleControlVisibility(filter) {
        if (filter === 'duotone') {
            duotoneControls.style.display = 'flex';
            asciiControls.style.display = 'none';
            filteredCanvas.style.display = 'block';
            asciiOutput.style.display = 'none';
        } else { // ASCII filter
            duotoneControls.style.display = 'none';
            asciiControls.style.display = 'block';
            filteredCanvas.style.display = 'none';
            asciiOutput.style.display = 'block';
        }
    }

    // Applies the DUOTONE effect to the canvas
    function applyDuotoneFilter() {
        filteredCanvas.width = originalImage.width;
        filteredCanvas.height = originalImage.height;

        // Draw original image to canvas
        ctx.drawImage(originalImage, 0, 0);

        // Get pixel data to manipulate
        const imageData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        const data = imageData.data;
        const color1 = hexToRgb(color1Input.value);
        const color2 = hexToRgb(color2Input.value);

        // Iterate over each pixel and apply duotone logic
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3; // Get grayscale value
            const t = avg / 255; // Normalize to a 0-1 range
            // Linearly interpolate between the two chosen colors
            data[i] = color1.r + (color2.r - color1.r) * t;     // Red
            data[i + 1] = color1.g + (color2.g - color1.g) * t; // Green
            data[i + 2] = color1.b + (color2.b - color1.b) * t; // Blue
        }
        // Put the modified pixel data back onto the canvas
        ctx.putImageData(imageData, 0, 0);
    }

    // Applies the ASCII ART effect
    function applyAsciiFilter() {
        // This string maps darker pixels to denser characters.
        const density = 'Ñ@#W$9876543210?!abc;:+=-,._ ';
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Resize image for performance and to fit the character grid
        const maxWidth = 120;
        const scale = maxWidth / originalImage.width;
        tempCanvas.width = maxWidth;
        // Adjust aspect ratio for characters, which are taller than they are wide
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

        // *** THIS IS THE CORRECTED PART ***
        // Base the font-size on the visible asciiOutput element, not the hidden canvas
        if (asciiOutput.clientWidth > 0) {
            asciiOutput.style.fontSize = `${asciiOutput.clientWidth / maxWidth * 1.4}px`;
            // Ensure line height is tight to prevent gaps
            asciiOutput.style.lineHeight = '1.1';
        }
    }

    // Handles downloading the generated image or text file
    downloadButton.addEventListener('click', () => {
        if (!originalImage) return;

        const selectedFilter = filterSelect.value;
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (selectedFilter === 'duotone') {
            link.download = `duotone-image-${timestamp}.png`;
            link.href = filteredCanvas.toDataURL('image/png');
        } else if (selectedFilter === 'ascii') {
            link.download = `ascii-art-${timestamp}.txt`;
            const blob = new Blob([asciiOutput.textContent], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
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
