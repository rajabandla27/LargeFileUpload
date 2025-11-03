import { IInputs, IOutputs } from "./generated/ManifestTypes";

const CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB chunks

export class LargeFileUploader implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private _container: HTMLDivElement;
    private _context: ComponentFramework.Context<IInputs>;
    private _notifyOutputChanged: () => void;
    
    private _fileInput: HTMLInputElement;
    private _uploadButton: HTMLButtonElement;
    private _progressBar: HTMLProgressElement;
    private _statusText: HTMLDivElement;
    private _uploadResult: string;

    constructor() {
    }

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;
        this._uploadResult = "";

        // Create UI elements
        const wrapper = document.createElement("div");
        wrapper.className = "file-uploader-wrapper";

        // File input
        this._fileInput = document.createElement("input");
        this._fileInput.type = "file";
        this._fileInput.className = "file-input";
        this._fileInput.id = "fileInput";

        // Upload button
        this._uploadButton = document.createElement("button");
        this._uploadButton.className = "upload-button";
        this._uploadButton.textContent = "Upload to SharePoint";
        this._uploadButton.disabled = true;
        this._uploadButton.onclick = this.handleUpload.bind(this);

        // Progress bar
        this._progressBar = document.createElement("progress");
        this._progressBar.className = "progress-bar";
        this._progressBar.max = 100;
        this._progressBar.value = 0;
        this._progressBar.style.display = "none";

        // Status text
        this._statusText = document.createElement("div");
        this._statusText.className = "status-text";

        // Enable button when file is selected
        this._fileInput.onchange = () => {
            this._uploadButton.disabled = !this._fileInput.files || this._fileInput.files.length === 0;
            if (this._fileInput.files && this._fileInput.files.length > 0) {
                const file = this._fileInput.files[0];
                this._statusText.textContent = `Selected: ${file.name} (${this.formatBytes(file.size)})`;
            }
        };

        wrapper.appendChild(this._fileInput);
        wrapper.appendChild(this._uploadButton);
        wrapper.appendChild(this._progressBar);
        wrapper.appendChild(this._statusText);

        this._container.appendChild(wrapper);
    }

    private async handleUpload(): Promise<void> {
        if (!this._fileInput.files || this._fileInput.files.length === 0) {
            return;
        }

        const file = this._fileInput.files[0];
        const azureFunctionUrl = this._context.parameters.azureFunctionUrl.raw;
        const siteId = this._context.parameters.siteId.raw;
        const itemPath = this._context.parameters.itemPath.raw;

        if (!azureFunctionUrl || !siteId) {
            this._statusText.textContent = "Error: Azure Function URL and Site ID are required";
            this._statusText.className = "status-text error";
            return;
        }

        try {
            this._uploadButton.disabled = true;
            this._fileInput.disabled = true;
            this._progressBar.style.display = "block";
            this._progressBar.value = 0;
            this._statusText.textContent = "Creating upload session...";
            this._statusText.className = "status-text";

            // Step 1: Get upload URL from Azure Function
            const uploadUrl = await this.createUploadSession(azureFunctionUrl, siteId, itemPath || undefined, file.name);

            this._statusText.textContent = "Uploading file...";

            // Step 2: Upload file in chunks
            const result = await this.uploadFileResumable(uploadUrl, file, (uploaded, total) => {
                const percent = Math.round((uploaded / total) * 100);
                this._progressBar.value = percent;
                this._statusText.textContent = `Uploading: ${percent}% (${this.formatBytes(uploaded)} / ${this.formatBytes(total)})`;
            });

            this._uploadResult = JSON.stringify(result);
            this._statusText.textContent = `✓ Upload completed successfully: ${file.name}`;
            this._statusText.className = "status-text success";
            this._progressBar.value = 100;

            // Notify Power Apps of the result
            this._notifyOutputChanged();

        } catch (err: any) {
            this._statusText.textContent = `✗ Upload failed: ${err.message}`;
            this._statusText.className = "status-text error";
        } finally {
            this._uploadButton.disabled = false;
            this._fileInput.disabled = false;
        }
    }

    private async createUploadSession(serverEndpoint: string, siteId: string, itemPath: string | undefined, fileName: string): Promise<string> {
        const resp = await fetch(serverEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ siteId, itemPath, fileName })
        });

        if (!resp.ok) {
            const text = await resp.text();
            throw new Error(`Failed to create upload session: ${resp.status} - ${text}`);
        }

        const json = await resp.json();
        return json.uploadUrl as string;
    }

    private async uploadFileResumable(uploadUrl: string, file: File, onProgress?: (uploadedBytes: number, totalBytes: number) => void): Promise<any> {
        const size = file.size;
        let start = 0;

        while (start < size) {
            const end = Math.min(start + CHUNK_SIZE, size);
            const chunk = file.slice(start, end);
            const contentRange = `bytes ${start}-${end - 1}/${size}`;

            // Retry loop for this chunk
            let success = false;
            let lastErr: any = null;

            for (let retry = 0; retry < 5 && !success; retry++) {
                try {
                    const res = await fetch(uploadUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Range": contentRange,
                        },
                        body: chunk
                    });

                    // 201 Created or 200 OK means upload completed
                    if (res.status === 201 || res.status === 200) {
                        const json = await res.json();
                        if (onProgress) onProgress(size, size);
                        return json;
                    }

                    // 202 Accepted -> chunk accepted, continue
                    if (res.status === 202) {
                        await res.json().catch(() => null);
                        start = end;
                        if (onProgress) onProgress(start, size);
                        success = true;
                        break;
                    }

                    const text = await res.text();
                    throw new Error(`Upload chunk failed: ${res.status} ${text}`);

                } catch (err) {
                    lastErr = err;
                    await this.sleep(500 * Math.pow(2, retry));
                }
            }

            if (!success && lastErr) {
                throw lastErr;
            }
        }

        return null;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private formatBytes(bytes: number, decimals: number = 2): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this._context = context;
    }

    public getOutputs(): IOutputs {
        return {
            value: this._uploadResult
        };
    }

    public destroy(): void {
        // Cleanup
    }
}
