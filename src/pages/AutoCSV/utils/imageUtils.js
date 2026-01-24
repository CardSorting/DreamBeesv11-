
export const processImageForGemini = async (file) => {
  return new Promise((resolve, reject) => {
    // Create an object URL from the file to avoid reading the entire file into memory as a string first
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      // Clean up the object URL immediately after loading
      URL.revokeObjectURL(objectUrl);

      const MAX_DIMENSION = 1024;
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > height) {
        if (width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        }
      } else {
        if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw and resize
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with 0.8 quality to optimize payload size
      // This ensures we always send a manageable payload to Gemini
      const mimeType = 'image/jpeg';
      const dataUrl = canvas.toDataURL(mimeType, 0.8);
      const base64 = dataUrl.split(',')[1];

      resolve({ base64, mimeType });
    };

    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };

    img.src = objectUrl;
  });
};
