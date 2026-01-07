declare module 'html-pdf-node' {
    interface File {
        url?: string;
        content?: string;
    }

    interface Options {
        format?: string;
        path?: string;
        width?: string | number;
        height?: string | number;
        printBackground?: boolean;
        landscape?: boolean;
        margin?: {
            top?: string | number;
            right?: string | number;
            bottom?: string | number;
            left?: string | number;
        };
        preferCSSPageSize?: boolean;
        displayHeaderFooter?: boolean;
        headerTemplate?: string;
        footerTemplate?: string;
    }

    export function generatePdf(file: File, options?: Options): Promise<Buffer>;
    export function generatePdfs(files: File[], options?: Options): Promise<Buffer[]>;
}
