export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

// Function to load PDF.js via CDN (most reliable method)
async function loadPdfJsViaCDN(): Promise<any> {
    return new Promise((resolve, reject) => {
        // Check if already loaded
        if ((window as any).pdfjsLib) {
            resolve((window as any).pdfjsLib);
            return;
        }

        // Load PDF.js from CDN
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.crossOrigin = 'anonymous';

        script.onload = () => {
            if ((window as any).pdfjsLib) {
                // Set worker source
                (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc =
                    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

                console.log('PDF.js loaded successfully from CDN');
                resolve((window as any).pdfjsLib);
            } else {
                reject(new Error('PDF.js loaded but pdfjsLib not found'));
            }
        };

        script.onerror = () => {
            reject(new Error('Failed to load PDF.js from CDN'));
        };

        document.head.appendChild(script);
    });
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
    console.log('Starting PDF conversion for:', file.name);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.type);

    try {
        // Validate file
        if (!file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
            throw new Error(`File is not a PDF. Name: ${file.name}, Type: ${file.type}`);
        }

        if (file.size === 0) {
            throw new Error('PDF file is empty');
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error('PDF file too large (max 10MB)');
        }

        // Load PDF.js from CDN
        console.log('Loading PDF.js...');
        const pdfjsLib = await loadPdfJsViaCDN();
        console.log('PDF.js loaded successfully');

        // Read file as ArrayBuffer
        console.log('Reading file...');
        const arrayBuffer = await file.arrayBuffer();
        console.log('File read successfully, size:', arrayBuffer.byteLength);

        // Load PDF document
        console.log('Loading PDF document...');
        const loadingTask = pdfjsLib.getDocument({
            data: arrayBuffer,
            verbosity: 0, // Reduce console output
            disableFontFace: true, // Improve compatibility
            disableStream: true,
            disableRange: true
        });

        const pdf = await loadingTask.promise;
        console.log('PDF loaded, pages:', pdf.numPages);

        if (pdf.numPages === 0) {
            throw new Error('PDF has no pages');
        }

        // Get first page
        console.log('Getting first page...');
        const page = await pdf.getPage(1);
        console.log('First page loaded');

        // Calculate scale - use smaller scale for better performance
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        console.log('Viewport:', viewport.width, 'x', viewport.height);

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            throw new Error('Could not get canvas 2D context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Configure canvas
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        console.log('Rendering page...');

        // Render with timeout
        const renderPromise = page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;

        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Rendering timeout')), 15000);
        });

        await Promise.race([renderPromise, timeoutPromise]);
        console.log('Page rendered successfully');

        // Convert to blob
        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                if (blob && blob.size > 0) {
                    const originalName = file.name.replace(/\.pdf$/i, '');
                    const imageFile = new File([blob], `${originalName}.png`, {
                        type: 'image/png',
                        lastModified: Date.now()
                    });

                    console.log('Conversion successful, image size:', blob.size);

                    resolve({
                        imageUrl: URL.createObjectURL(blob),
                        file: imageFile,
                    });
                } else {
                    console.error('Failed to create blob');
                    resolve({
                        imageUrl: '',
                        file: null,
                        error: 'Failed to create image from PDF',
                    });
                }
            }, 'image/png', 0.8);
        });

    } catch (error) {
        console.error('PDF conversion error:', error);

        const errorMessage = error instanceof Error
            ? error.message
            : 'Unknown error during PDF conversion';

        return {
            imageUrl: '',
            file: null,
            error: `PDF conversion failed: ${errorMessage}`,
        };
    }
}