document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT SELECTION ---
    const uploadButton = document.getElementById('upload-button');
    const imagePreview = document.getElementById('image-preview');
    const filteredCanvas = document.getElementById('filtered-canvas');
    const downloadButton = document.getElementById('download-button');
    const filterSelect = document.getElementById('filter-select');
    
    // Filter Controls
    const duotoneControls = document.getElementById('duotone-controls');
    const pixelateControls = document.getElementById('pixelate-controls');
    const vignetteControls = document.getElementById('vignette-controls');
    const asciiControls = document.getElementById('ascii-controls');
    
    // Sliders and Values
    const pixelateSlider = document.getElementById('pixelate-slider');
    const pixelateValue = document.getElementById('pixelate-value');
    const vignetteSlider = document.getElementById('vignette-slider');
    const vignetteValue = document.getElementById('vignette-value');

    const ctx = filteredCanvas.getContext('2d');
    let originalImage = null;

    // --- EVENT LISTENERS ---
    uploadButton.addEventListener('change', handleImageUpload);
    filterSelect.addEventListener('change', applyCurrentFilter);
    
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        slider.addEventListener('input', applyCurrentFilter);
    });
    
    pixelateSlider.addEventListener('input', () => pixelateValue.textContent = pixelateSlider.value);
    vignetteSlider.addEventListener('input', () => vignetteValue.textContent = vignetteSlider.value);

    document.querySelectorAll('input[type="color"]').forEach(picker => {
        picker.addEventListener('input', applyCurrentFilter);
    });


    // --- CORE FUNCTIONS ---
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                originalImage = new Image();
                originalImage.onload = () => {
                    filterSelect.value = 'none';
                    applyCurrentFilter();
                    downloadButton.disabled = false;
                };
                originalImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    function applyCurrentFilter() {
        if (!originalImage) return;

        const selectedFilter = filterSelect.value;
        toggleControlVisibility(selectedFilter);

        filteredCanvas.width = originalImage.width;
        filteredCanvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);

        switch (selectedFilter) {
            case 'duotone': applyDuotoneFilter(); break;
            case 'grayscale': applyGrayscaleFilter(); break;
            case 'sepia': applySepiaFilter(); break;
            case 'invert': applyInvertFilter(); break;
            case 'pixelate': applyPixelateFilter(); break;
            case 'vignette': applyVignetteFilter(); break;
            case 'sketch': applySketchFilter(); break;
            case 'vintage': applyVintageFilter(); break;
            case 'ascii': applyAsciiFilter(); break;
            case 'none':
            default:
                ctx.drawImage(originalImage, 0, 0);
                break;
        }
    }

    function toggleControlVisibility(filter) {
        filteredCanvas.style.display = 'block';
        asciiOutput.style.display = 'none';
        
        // Hide all controls by adding the 'hidden' attribute
        duotoneControls.hidden = true;
        pixelateControls.hidden = true;
        vignetteControls.hidden = true;
        asciiControls.hidden = true;

        // Show controls for the selected filter by removing the 'hidden' attribute
        switch (filter) {
            case 'duotone': duotoneControls.hidden = false; break;
            case 'pixelate': pixelateControls.hidden = false; break;
            case 'vignette': vignetteControls.hidden = false; break;
            case 'ascii':
                asciiControls.hidden = false;
                filteredCanvas.style.display = 'none';
                asciiOutput.style.display = 'block';
                break;
        }
    }

    // --- FILTER IMPLEMENTATIONS (Unchanged from previous version) ---

    function getPixelData() {
        return ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
    }

    function applyGrayscaleFilter() {
        const imageData = getPixelData();
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = data[i + 1] = data[i + 2] = avg;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function applySepiaFilter() {
        const imageData = getPixelData();
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
            data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
            data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function applyInvertFilter() {
        const imageData = getPixelData();
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function applyDuotoneFilter() {
        const imageData = getPixelData();
        const data = imageData.data;
        const color1 = hexToRgb(document.getElementById('color1').value);
        const color2 = hexToRgb(document.getElementById('color2').value);
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const t = avg / 255;
            data[i] = color1.r + (color2.r - color1.r) * t;
            data[i + 1] = color1.g + (color2.g - color1.g) * t;
            data[i + 2] = color1.b + (color2.b - color1.b) * t;
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function applyPixelateFilter() {
        const blockSize = parseInt(pixelateSlider.value, 10);
        const w = filteredCanvas.width;
        const h = filteredCanvas.height;
        for (let y = 0; y < h; y += blockSize) {
            for (let x = 0; x < w; x += blockSize) {
                const pixel = ctx.getImageData(x + Math.floor(blockSize/2), y + Math.floor(blockSize/2), 1, 1).data;
                ctx.fillStyle = `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]/255})`;
                ctx.fillRect(x, y, blockSize, blockSize);
            }
        }
    }

    function applyVignetteFilter() {
        const imageData = getPixelData();
        const data = imageData.data;
        const w = filteredCanvas.width;
        const h = filteredCanvas.height;
        const centerX = w / 2;
        const centerY = h / 2;
        const strength = parseInt(vignetteSlider.value, 10) / 100;
        const radius = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const dx = centerX - x;
                const dy = centerY - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const fade = Math.max(0, 1 - (dist / radius) * strength * 1.5);
                data[i] *= fade;
                data[i + 1] *= fade;
                data[i + 2] *= fade;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function applyVintageFilter() {
        applySepiaFilter();
        const imageData = getPixelData();
        const data = imageData.data;
        const w = filteredCanvas.width;
        const h = filteredCanvas.height;
        const centerX = w / 2;
        const centerY = h / 2;
        const strength = 0.7;
        const radius = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const dx = centerX - x;
                const dy = centerY - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const fade = Math.max(0, 1 - (dist / radius) * strength);
                const noise = (Math.random() - 0.5) * 40;
                data[i] = data[i] * fade + noise;
                data[i + 1] = data[i + 1] * fade + noise;
                data[i + 2] = data[i + 2] * fade + noise;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    function applySketchFilter() {
        applyGrayscaleFilter();
        const imageData = getPixelData();
        const data = imageData.data;
        const inverted = [];
        for (let i = 0; i < data.length; i += 4) {
            inverted[i] = 255 - data[i];
            inverted[i + 1] = 255 - data[i + 1];
            inverted[i + 2] = 255 - data[i + 2];
            inverted[i + 3] = data[i + 3];
        }
        const outputData = ctx.createImageData(filteredCanvas.width, filteredCanvas.height);
        for (let i = 0; i < data.length; i += 4) {
            const base = data[i];
            const blend = inverted[i];
            const final_v = (base === 255) ? base : Math.min(255, ((base << 8) / (255 - blend)));
            outputData.data[i] = outputData.data[i + 1] = outputData.data[i + 2] = final_v;
            outputData.data[i + 3] = 255;
        }
        ctx.putImageData(outputData, 0, 0);
    }

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

    // --- UTILITY AND DOWNLOAD ---
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
            const filename = selectedFilter === 'none' ? 'original' : selectedFilter;
            link.download = `${filename}-image-${timestamp}.png`;
            link.href = filteredCanvas.toDataURL('image/png');
        }
        link.click();
    });

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }
});
