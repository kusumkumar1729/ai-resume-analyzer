// Create this file as: src/types/pdfjs.d.ts or types/pdfjs.d.ts

declare module 'pdfjs-dist/build/pdf.mjs' {
    export * from 'pdfjs-dist';
}

declare module 'pdfjs-dist' {
    export interface PDFDocumentProxy {
        numPages: number;
        getPage(pageNumber: number): Promise<PDFPageProxy>;
    }

    export interface PDFPageProxy {
        getViewport(params: { scale: number; rotation?: number }): PDFPageViewport;
        render(params: {
            canvasContext: CanvasRenderingContext2D;
            viewport: PDFPageViewport;
            transform?: number[];
        }): { promise: Promise<void> };
    }

    export interface PDFPageViewport {
        width: number;
        height: number;
    }

    export interface LoadingTask {
        promise: Promise<PDFDocumentProxy>;
    }

    export interface GlobalWorkerOptionsType {
        workerSrc: string;
    }

    export const GlobalWorkerOptions: GlobalWorkerOptionsType;

    export function getDocument(params: {
        data: ArrayBuffer | Uint8Array;
        verbosity?: number;
        cMapUrl?: string;
        cMapPacked?: boolean;
        disableFontFace?: boolean;
        maxImageSize?: number;
        disableStream?: boolean;
        disableRange?: boolean;
    }): LoadingTask;
}

// Global window extension for script-loaded PDF.js
declare global {
    interface Window {
        pdfjsLib?: {
            getDocument: typeof import('pdfjs-dist').getDocument;
            GlobalWorkerOptions: import('pdfjs-dist').GlobalWorkerOptionsType;
        };
    }
}