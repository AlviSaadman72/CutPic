document.addEventListener('DOMContentLoaded', () => {
    const introAnimation = document.getElementById('intro-animation');
    const mainContent = document.getElementById('main-content');
    const datetimeDisplay = document.getElementById('datetime');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    const imageUpload = document.getElementById('image-upload');
    const uploadedImage = document.getElementById('uploaded-image');
    const regulationOptions = document.getElementById('regulation-options');
    const newWidthInput = document.getElementById('new-width');
    const newHeightInput = document.getElementById('new-height');
    const newSizeMbInput = document.getElementById('new-size-mb');
    const downloadBtn = document.getElementById('download-btn');
    const fileStatus = document.getElementById('file-status');
    const canvas = document.getElementById('image-canvas');
    const ctx = canvas.getContext('2d');

    let originalFile = null;
    const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB in bytes [cite: 4]

    // --- 1. Initial Animation Logic  ---
    setTimeout(() => {
        // Fade out animation
        introAnimation.style.opacity = '0';
        
        // Hide animation and show main content after transition
        setTimeout(() => {
            introAnimation.style.display = 'none';
            mainContent.style.display = 'block';
        }, 500); // Wait for the CSS transition to complete
    }, 4000); // Show for 4 seconds

    // --- 2. Digital Clock and Calendar Logic  ---
    function updateDateTime() {
        const now = new Date();
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        
        const dateStr = now.toLocaleDateString('en-US', dateOptions);
        const timeStr = now.toLocaleTimeString('en-US', timeOptions);
        
        datetimeDisplay.textContent = `${dateStr} | ${timeStr}`;
    }

    // Update the clock every second
    setInterval(updateDateTime, 1000);
    updateDateTime(); // Initial call

    // --- 3. Theme Toggle Logic  ---
    themeToggle.addEventListener('click', () => {
        if (body.classList.contains('light-theme')) {
            body.classList.remove('light-theme');
            body.classList.add('dark-theme');
            themeToggle.textContent = 'Toggle Light Mode';
        } else {
            body.classList.remove('dark-theme');
            body.classList.add('light-theme');
            themeToggle.textContent = 'Toggle Dark Mode';
        }
    });

    // --- 4. Image Upload Logic [cite: 4] ---
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file type [cite: 4]
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
            alert('Unsupported file format. Please upload JPG/JPEG or PNG.');
            fileStatus.textContent = 'Invalid file type!';
            return;
        }

        // Check file size [cite: 4]
        if (file.size > MAX_FILE_SIZE) {
            alert('File size exceeds 4MB limit.');
            fileStatus.textContent = `File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Limit: 4MB.`;
            return;
        }

        originalFile = file;
        fileStatus.textContent = `File loaded: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB)`;
        downloadBtn.disabled = false;
        regulationOptions.style.display = 'block';

        const reader = new FileReader();
        reader.onload = (event) => {
            uploadedImage.src = event.target.result;
            uploadedImage.style.display = 'block';

            // Set default dimensions on load
            uploadedImage.onload = () => {
                newWidthInput.value = uploadedImage.naturalWidth;
                newHeightInput.value = uploadedImage.naturalHeight;
            }
        };
        reader.readAsDataURL(file);
    });

    // --- 5. Image Processing and Download Logic [cite: 5, 6] ---
    downloadBtn.addEventListener('click', () => {
        if (!originalFile) return;

        const newWidth = parseInt(newWidthInput.value, 10); // user can change the picture’s width [cite: 5]
        const newHeight = parseInt(newHeightInput.value, 10); // user can change the picture’s length [cite: 5]
        const targetSizeMB = parseFloat(newSizeMbInput.value); // user can also set the size of megabyte [cite: 5]

        if (newWidth <= 0 || newHeight <= 0 || targetSizeMB <= 0) {
            alert('Please set valid width, height, and target size.');
            return;
        }

        // Setup Canvas for Cropping/Resizing
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.clearRect(0, 0, newWidth, newHeight);
        
        const img = new Image();
        img.onload = () => {
            // Draw image to canvas to crop/resize it to new dimensions [cite: 6]
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Function to find the optimal quality for target size
            let quality = 0.92; // Starting quality
            const maxIterations = 20; 
            let iteration = 0;
            let blob = null;

            const checkAndDownload = () => {
                // Determine MIME type for download (default to jpeg for compression)
                const mimeType = originalFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
                
                // Convert canvas to blob with quality adjustment
                canvas.toBlob((b) => {
                    blob = b;
                    // Adjust quality if size is too large
                    if (blob.size > targetSizeMB * 1024 * 1024 && iteration < maxIterations && mimeType === 'image/jpeg') {
                        // Reduce quality and try again
                        quality -= 0.05; 
                        iteration++;
                        
                        // Recursive call for quality adjustment
                        setTimeout(checkAndDownload, 50); 
                    } else {
                        // Download the final image [cite: 6]
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        // Prepend 'cutpic-' to the original filename
                        a.download = `cutpic-${originalFile.name.replace(/\.(jpg|jpeg|png)$/i, '')}_${newWidth}x${newHeight}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        alert(`Image processed and downloaded! Final Size: ${(blob.size / (1024 * 1024)).toFixed(2)}MB`);
                    }
                }, mimeType, quality);
            };

            checkAndDownload();

        };
        img.src = uploadedImage.src; // Use the image data from the preview
    });
});