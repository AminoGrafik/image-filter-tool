document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT SELECTION ---
    const uploadButton = document.getElementById('upload-button');
    const imagePreview = document.getElementById('image-preview');
    const filteredCanvas = document.getElementById('filtered-canvas');
    const downloadButton = document.getElementById('download-button');
    const filterSelect = document.getElementById('filter-select');

    const controlMap = {
        duotone: document.getElementById('duotone-controls'),
        pixelate: document.getElementById('pixelate-controls'),
        vignette: document.getElementById('vignette-controls'),
        ascii: document.getElementById('ascii-controls'),
    };

    const pixelateSlider = document.getElementById('pixelate-slider');
    const pixelateValue = document.getElementById('pixelate-value');
    const vignetteSlider = document.getElementById('vignette-slider');
    const vignetteValue = document.getElementById('vignette-value');

    const ctx = filteredCanvas.getContext('2d');
    let originalImage = null;

    // --- CRITICAL FIX: DEFINE THE FILTER ACTIONS OBJECT BEFORE IT IS USED ---
    const filterActions = {
        grayscale: () => applyPixelManipulation(data => {
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i + 1] = data[i + 2] = avg;
            }
        }),

        sepia: () => applyPixelManipulation(data => {
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
                data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
                data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
                data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
            }
        }),

        invert: () => applyPixelManipulation(data => {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
        }),

        duotone: () => {
            const color1 = hexToRgb(document.getElementById('color1').value);
            const color2 = hexToRgb(document.getElementById('color2').value);
            applyPixelManipulation(data => {
                for (let i = 0; i < data.length; i += 4) {
                    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                    const t = avg / 255;
                    data[i] = color1.r + (color2.r - color1.r) * t;
                    data[i + 1] = color1.g + (color2.g - color1.g) * t;
                    data[i + 2] = color1.b + (color2.b - color1.b) * t;
                }
            });
        },
        
        pixelate: () => {
            const blockSize = parseInt(pixelateSlider.value, 10);
            const w = filteredCanvas.width;
            const h = filteredCanvas.height;
            for (let y = 0; y < h; y += blockSize) {
                for (let x = 0; x < w; x += blockSize) {
                    const pixel = ctx.getImageData(x, y, 1, 1).data;
                    ctx.fillStyle = `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3]/255})`;
                    ctx.fillRect(x, y, blockSize, blockSize);
                }
            }
        },

        vignette: () => {
            const strength = parseInt(vignetteSlider.value, 10) / 100;
            const w = filteredCanvas.width;
            const h = filteredCanvas.height;
            const centerX = w / 2;
            const centerY = h / 2;
            const radius = Math.sqrt(centerX ** 2 + centerY ** 2);
            
            applyPixelManipulation(data => {
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const i = (y * w + x) * 4;
                        const dist = Math.sqrt((centerX - x) ** 2 + (centerY - y) ** 2);
                        const fade = Math.max(0, 1 - (dist / radius) * strength * 1.5);
                        data[i] *= fade;
                        data[i + 1] *= fade;
                        data[i + 2] *= fade;
                    }
                }
            });
        },

        vintage: () => {
            filterActions.sepia(); // Apply sepia logic first
            const w = filteredCanvas.width;
            const h = filteredCanvas.height;
            const centerX = w / 2;
            const centerY = h / 2;
            const strength = 0.7;
            const radius = Math.sqrt(centerX ** 2 + centerY ** 2);

            applyPixelManipulation(data => {
                for (let y = 0; y < h; y++) {
                    for (let x = 0; x < w; x++) {
                        const i = (y * w + x) * 4;
                        const dist = Math.sqrt((centerX - x) ** 2 + (centerY - y) ** 2);
                        const fade = Math.max(0, 1 - (dist / radius) * strength);
                        const noise = (Math.random() - 0.5) * 40;
                        data[i] = data[i] * fade + noise;
                        data[i + 1] = data[i + 1] * fade + noise;
                        data[i + 2] = data[i + 2] * fade + noise;
                    }
                }
            });
        },

        sketch: () => {
            filterActions.grayscale(); // Start with grayscale
            const imageData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
            const data = imageData.data;
            const inverted = new Uint8ClampedArray(data);
            for (let i = 0; i < data.length; i += 4) {
                inverted[i] = 255 - data[i];
                inverted[i + 1] = 255 - data[i + 1];
                inverted[i + 2] = 255 - data[i + 2];
            }
            
            applyPixelManipulation(outputData => {
                 for (let i = 0; i < outputData.length; i += 4) {
                    const base = data[i];
                    const blend = inverted[i];
                    const finalVal = (base === 255) ? base : Math.min(255, ((base << 8) / (255 - blend)));
                    outputData[i] = outputData[i + 1] = outputData[i + 2] = finalVal;
                }
            });
        },

        ascii: () => {
            const asciiOutput = document.getElementById('ascii-output');
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
        },
    };
    
    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        uploadButton.addEventListener('change', handleImageUpload);
        filterSelect.addEventListener('change', masterFilterHandler);

        const interactiveControls = [
            ...document.querySelectorAll('input[type="range"]'),
            ...document.querySelectorAll('input[type="color"]'),
        ];
        interactiveControls.forEach(control => {
            control.addEventListener('input', masterFilterHandler);
        });

        pixelateSlider.addEventListener('input', () => pixelateValue.textContent = pixelateSlider.value);
        vignetteSlider.addEventListener('input', () => vignetteValue.textContent = vignetteSlider.value);
        downloadButton.addEventListener('click', handleDownload);
    }

    // --- CORE FUNCTIONS ---
    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImage = new Image();
            originalImage.onload = () => {
                filterSelect.value = 'none';
                masterFilterHandler();
                downloadButton.disabled = false;
            };
            originalImage.src = e.target.result;
            imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function masterFilterHandler() {
        if (!originalImage) return;

        const selectedFilter = filterSelect.value;
        toggleControlVisibility(selectedFilter);

        filteredCanvas.width = originalImage.width;
        filteredCanvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);

        const filterAction = filterActions[selectedFilter];
        if (filterAction) {
            filterAction();
        }
    }

    function toggleControlVisibility(filter) {
        const asciiOutput = document.getElementById('ascii-output');
        filteredCanvas.style.display = 'block';
        asciiOutput.style.display = 'none';
        
        Object.values(controlMap).forEach(control => control.hidden = true);

        if (controlMap[filter]) {
            controlMap[filter].hidden = false;
        }

        if (filter === 'ascii') {
            filteredCanvas.style.display = 'none';
            asciiOutput.style.display = 'block';
        }
    }
    
    // --- HELPER FUNCTIONS ---
    function applyPixelManipulation(manipulationLogic) {
        const imageData = ctx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height);
        manipulationLogic(imageData.data);
        ctx.putImageData(imageData, 0, 0);
    }
    
    function handleDownload() {
        if (!originalImage) return;
        const selectedFilter = filterSelect.value;
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (selectedFilter === 'ascii') {
            link.download = `ascii-art-${timestamp}.txt`;
            const blob = new Blob([document.getElementById('ascii-output').textContent], { type: 'text/plain' });
            link.href = URL.createObjectURL(blob);
        } else {
            const filename = selectedFilter === 'none' ? 'original' : selectedFilter;
            link.download = `${filename}-image-${timestamp}.png`;
            link.href = filteredCanvas.toDataURL('image/png');
        }
        link.click();
    }

    function hexToRgb(hex) {
        const bigint = parseInt(hex.slice(1), 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
    }

    // Initialize the application
    setupEventListeners();
});
