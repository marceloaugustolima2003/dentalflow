
export async function compressImage(file, { maxWidth = 800, maxHeight = 800, quality = 0.7, type = 'image/webp' } = {}) {
    // Basic check: if not an image, return original
    if (!file || !file.type.startsWith('image/')) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions
                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    } else {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                // Draw to canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob((blob) => {
                    if (!blob) {
                        // Fallback to original if blob creation fails
                        console.warn('Canvas to Blob conversion failed, using original file.');
                        resolve(file);
                        return;
                    }

                    // Create new filename with correct extension
                    const extension = type.split('/')[1];
                    let originalName = file.name;
                    const lastDotIndex = file.name.lastIndexOf('.');
                    if (lastDotIndex !== -1) {
                        originalName = file.name.substring(0, lastDotIndex);
                    }
                    const newName = `${originalName}.${extension}`;

                    // Create a new File object
                    const newFile = new File([blob], newName, {
                        type: type,
                        lastModified: Date.now(),
                    });

                    resolve(newFile);
                }, type, quality);
            };

            img.onerror = (err) => {
                console.error('Image loading error:', err);
                resolve(file); // Fallback to original
            };
        };

        reader.onerror = (err) => {
             console.error('FileReader error:', err);
             resolve(file); // Fallback to original
        };
    });
}
