import { IInputs, IOutputs } from "./generated/ManifestTypes";

// TODO: Configure these values in your environment
const FUNCTION_URL = "YOUR_AZURE_FUNCTION_URL"; // Replace with your Azure Function URL
const SITE_ID = "YOUR_SHAREPOINT_SITE_ID"; // Replace with your SharePoint Site ID
const ITEM_PATH = "Shared Documents"; // Target document library
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export class FileUploader implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private fileInput: HTMLInputElement;
    private uploadButton: HTMLButtonElement;
    private statusDiv: HTMLDivElement;
    private selectedFile: File | null = null;

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this.container = container;
        this.container.style.cssText = "padding:20px;min-height:200px;font-family:Arial,sans-serif";
        
        // Title
        const title = document.createElement("h3");
        title.textContent = "Upload to SharePoint";
        title.style.cssText = "margin:0 0 15px 0;color:#333";
        this.container.appendChild(title);
        
        // File input (hidden)
        this.fileInput = document.createElement("input");
        this.fileInput.type = "file";
        this.fileInput.id = "fileUploadInput";
        this.fileInput.style.cssText = "display:none";
        this.fileInput.onchange = () => {
            if (this.fileInput.files && this.fileInput.files[0]) {
                this.selectedFile = this.fileInput.files[0];
                this.statusDiv.textContent = 'Selected: ' + this.selectedFile.name + ' (' + (this.selectedFile.size / 1024 / 1024).toFixed(2) + ' MB)';
                this.statusDiv.style.color = "#0078d4";
                this.uploadButton.disabled = false;
                this.uploadButton.style.opacity = "1";
                this.uploadButton.style.cursor = "pointer";
            }
        };
        this.container.appendChild(this.fileInput);

        // Custom file select button
        const selectButton = document.createElement("button");
        selectButton.textContent = "Choose File";
        selectButton.style.cssText = "display:block;margin-bottom:15px;padding:12px 24px;background:#f3f2f1;color:#323130;border:1px solid #8a8886;border-radius:4px;cursor:pointer;font-size:14px;font-weight:600";
        selectButton.onclick = () => this.fileInput.click();
        this.container.appendChild(selectButton);

        // Upload button
        this.uploadButton = document.createElement("button");
        this.uploadButton.textContent = "Upload to SharePoint";
        this.uploadButton.disabled = true;
        this.uploadButton.style.cssText = "display:block;margin-bottom:15px;padding:12px 24px;background:#0078d4;color:white;border:none;border-radius:4px;font-size:14px;font-weight:600;opacity:0.5;cursor:not-allowed";
        this.uploadButton.onclick = () => this.uploadFile();
        this.container.appendChild(this.uploadButton);

        // Status div
        this.statusDiv = document.createElement("div");
        this.statusDiv.textContent = "No file selected";
        this.statusDiv.style.cssText = "padding:10px;background:#f3f2f1;border-radius:4px;color:#605e5c";
        this.container.appendChild(this.statusDiv);
    }

    private async uploadFile(): Promise<void> {
        if (!this.selectedFile) return;
        
        this.uploadButton.disabled = true;
        this.statusDiv.textContent = "Creating upload session...";

        try {
            const sessionResponse = await fetch(FUNCTION_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ siteId: SITE_ID, fileName: this.selectedFile.name, itemPath: ITEM_PATH })
            });

            if (!sessionResponse.ok) throw new Error('Failed to create upload session: ' + sessionResponse.status);

            const session = await sessionResponse.json();
            const uploadUrl = session.uploadUrl;
            const fileSize = this.selectedFile.size;
            let start = 0;
            const fileArrayBuffer = await this.selectedFile.arrayBuffer();

            while (start < fileSize) {
                const end = Math.min(start + CHUNK_SIZE, fileSize);
                const chunk = fileArrayBuffer.slice(start, end);
                const contentRange = 'bytes ' + start + '-' + (end - 1) + '/' + fileSize;

                const chunkResponse = await fetch(uploadUrl, {
                    method: "PUT",
                    headers: { "Content-Range": contentRange, "Content-Length": chunk.byteLength.toString() },
                    body: chunk
                });

                if (chunkResponse.status === 200 || chunkResponse.status === 201) {
                    this.statusDiv.textContent = "Upload complete!";
                    break;
                } else if (chunkResponse.status === 202) {
                    const percent = Math.round((end / fileSize) * 100);
                    this.statusDiv.textContent = 'Uploading... ' + percent + '%';
                    start = end;
                } else {
                    throw new Error('Upload failed: ' + chunkResponse.status);
                }
            }
        } catch (error) {
            this.statusDiv.textContent = 'Error: ' + error;
        } finally {
            this.uploadButton.disabled = false;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public updateView(context: ComponentFramework.Context<IInputs>): void {}
    public getOutputs(): IOutputs { return {}; }
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public destroy(): void {}
}
