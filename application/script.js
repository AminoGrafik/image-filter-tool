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

    // Trigger hidden file input
    customUploadButton.addEventListener('click', () => {
        uploadButton.click();
    });

    // Handle image upload
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

    // Re-apply filter when controls change
    filterSelect.addEventListener('change', applyCurrentFilter);
    color1Input.addEventListener('input', applyCurrentFilter);
    color2Input.addEventListener('input', applyCurrentFilter);

    // Apply the selected filter
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

    // Toggle visibility of filter-specific controls
    function toggleControlVisibility(filter) {
        if (filter === 'duotone') {
            duotoneControls.style.display = 'flex';
            asciiControls.style.display = 'none';
            filteredCanvas.style.display = 'block';
            asciiOutput.style.display = 'none';
        } else {
            duotoneControls.style.display = 'none';
            asciiControls.style.display = 'block';
            filteredCanvas.style.display = 'none';
            asciiOutput.style.display = 'block';
        }
    }

    // DUOTONE FILTER
    function applyDuotoneFilter() {
        filteredCanvas.width = originalImage.width;
        filteredCanvas.height = originalImage.height;

        // Draw original image
        ctx.drawImage(originalImage, 0, 0);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        const data = imageData.data;
        const color1 = hexToRgb(color1Input.value);
        const color2 = hexToRgb(color2Input.value);

        // Apply duotone logic
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const t = avg / 255;
            data[i] = color1.r + (color2.r - color1.r) * t;
            data[i + 1] = color1.g + (color2.g - color1.g) * t;
            data[i + 2] = color1.b + (color2.b - color1.b) * t;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    // ASCII FILTER
    function applyAsciiFilter() {
        const density = 'Ñ@#W$9876543210?!abc;:+=-,._ ';
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');

        // Resize for performance
        const maxWidth = 100;
        const scale = maxWidth / originalImage.width;
        tempCanvas.width = maxWidth;
        tempCanvas.height = originalImage.height * scale;
        
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
        // Adjust font size for better fit
        asciiOutput.style.fontSize = `${filteredCanvas.clientWidth / maxWidth * 2.5}px`;
    }

    // Handle image download
    downloadButton.addEventListener('click', () => {
        if (!originalImage) return;

        const selectedFilter = filterSelect.value;
        const link = document.createElement('a');

        if (selectedFilter === 'duotone') {
            link.download = 'filtered-image.png';
            link.href = filteredCanvas.toDataURL('image/png');
        } else if (selectedFilter === 'ascii') {
            // For ASCII, we download as a text file
            link.download = 'ascii-art.txt';
            const blob = new Blob([asciiOutput.textContent], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
        }
        link.click();
    });

    // Helper to convert hex color to RGB
    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return {
            r: (bigint >> 16) & 255,
            g: (bigint >> 8) & 255,
            b: bigint & 255
        };
    }
});
