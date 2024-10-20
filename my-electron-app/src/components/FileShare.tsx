import React from 'react';
import { FaSearch, FaUpload, FaShareAlt, FaDownload, FaEdit, FaUndo } from 'react-icons/fa';
import '../CloudDrive.css';

interface FileShareProps {
    isDarkTheme: boolean;
}

interface FileItem {
    name: string;
    fileData?: Blob;
    price: number | null;
    dateUploaded: Date;
}

interface FileShareState {
    searchTerm: string;
    files: Array<FileItem>;
    isDragOver: boolean;
    editingFile: FileItem | null;
    newName: string;
    newPrice: number | null;
    newDate: Date | null;
}

export class FileShare extends React.Component<FileShareProps, FileShareState> {
    private fileInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: FileShareProps) {
        super(props);
        this.state = {
            searchTerm: '',
            files: [],
            isDragOver: false,
            editingFile: null,
            newName: '',
            newPrice: null,
            newDate: null,
        };

        this.fileInputRef = React.createRef();

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.triggerFileInputClick = this.triggerFileInputClick.bind(this);
        this.handleShareFile = this.handleShareFile.bind(this);
        this.handleDownloadFile = this.handleDownloadFile.bind(this);
        this.startEditing = this.startEditing.bind(this);
        this.handleEditChange = this.handleEditChange.bind(this);
        this.saveChanges = this.saveChanges.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ searchTerm: event.target.value });
    }

    handleFileUpload(files: FileList | null) {
        if (files && files.length > 0) {
            // Prompt for price
            const priceInput = prompt("Enter a price for the uploaded file (BTC):");
            const price = priceInput ? parseFloat(priceInput) : null;

            // Check if the price is valid
            if (price !== null && (isNaN(price) || price < 0)) {
                alert("Please enter a valid price.");
                return;
            }

            const uploadedFiles = Array.from(files).map(file => ({
                name: file.name,
                fileData: new Blob([file], { type: file.type }),
                price: price,
                dateUploaded: new Date(),
            }));

            this.setState(prevState => ({
                files: [...prevState.files, ...uploadedFiles],
                isDragOver: false,
            }));
        }
    }

    triggerFileInputClick() {
        if (this.fileInputRef.current) {
            this.fileInputRef.current.click();
        }
    }

    handleShareFile(fileName: string) {
        const fileIndex = this.state.files.findIndex(file => file.name === fileName);
        if (fileIndex !== -1) {
            const priceInput = prompt("Enter a price for sharing this file (BTC):");
            const price = priceInput ? parseFloat(priceInput) : null;

            // Check if the price is valid
            if (price !== null && (isNaN(price) || price < 0)) {
                alert("Please enter a valid price.");
                return;
            }

            // Update the file's price in the state
            this.setState(prevState => {
                const updatedFiles = [...prevState.files];
                updatedFiles[fileIndex] = {
                    ...updatedFiles[fileIndex],
                    price: price,
                };
                return { files: updatedFiles };
            });

            console.log(`Updated price for sharing file: ${fileName} to ${price !== null ? price.toFixed(8) : 'N/A'}`);
            // Add your sharing logic here (e.g., API call, etc.)
        }
    }

    handleDownloadFile(fileName: string) {
        const file = this.state.files.find(file => file.name === fileName);
        if (file && file.fileData) {
            const fileURL = URL.createObjectURL(file.fileData);
            const a = document.createElement('a');
            a.href = fileURL;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(fileURL);
        }
    }

    startEditing(file: FileItem) {
        this.setState({ editingFile: file, newName: file.name, newPrice: file.price, newDate: file.dateUploaded });
    }

    handleEditChange(event: React.ChangeEvent<HTMLInputElement>, field: 'name' | 'price' | 'date') {
        if (field === 'name') {
            this.setState({ newName: event.target.value });
        } else if (field === 'price') {
            const priceValue = parseFloat(event.target.value);
            this.setState({ newPrice: isNaN(priceValue) ? null : priceValue });
        } else if (field === 'date') {
            this.setState({ newDate: new Date(event.target.value) });
        }
    }

    saveChanges() {
        const { editingFile, newName, newPrice, newDate } = this.state;
        if (editingFile) {
            this.setState(prevState => ({
                files: prevState.files.map(file =>
                    file.name === editingFile.name
                        ? { ...file, name: newName, price: newPrice, dateUploaded: newDate ?? file.dateUploaded }
                        : file
                ),
                editingFile: null,
                newName: '',
                newPrice: null,
                newDate: null,
            }));
        }
    }

    getFilteredFiles() {
        const { searchTerm, files } = this.state;

        return files.filter(file =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    handleDragOver(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        this.setState({ isDragOver: true });
    }

    handleDragLeave() {
        this.setState({ isDragOver: false });
    }

    handleDrop(event: React.DragEvent<HTMLDivElement>) {
        event.preventDefault();
        this.setState({ isDragOver: false });
        const files = event.dataTransfer?.files;
        this.handleFileUpload(files);
    }

    render() {
        const filteredFiles = this.getFilteredFiles();
        const { isDarkTheme } = this.props;
        const { isDragOver, editingFile, newName, newPrice, newDate } = this.state;

        return (
            <div className={`cloud-drive-container ${isDarkTheme ? 'dark' : 'light'}`}>
                <h3>File Share</h3>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={this.state.searchTerm}
                        onChange={this.handleSearchChange}
                    />
                    <FaSearch />
                </div>
                <div className="upload-area" onDragOver={this.handleDragOver} onDragLeave={this.handleDragLeave} onDrop={this.handleDrop}>
                    <button onClick={this.triggerFileInputClick}>
                        <FaUpload /> Upload
                    </button>
                    <input
                        type="file"
                        ref={this.fileInputRef}
                        onChange={(e) => this.handleFileUpload(e.target.files)}
                        style={{ display: 'none' }}
                        multiple
                    />
                </div>
                <div className={`file-list ${isDragOver ? 'drag-over' : ''}`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price (BTC)</th>
                                <th>Date Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.length > 0 ? (
                                filteredFiles.map((file, index) => (
                                    <tr key={index}>
                                        {editingFile && editingFile.name === file.name ? (
                                            <>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={newName}
                                                        onChange={(e) => this.handleEditChange(e, 'name')}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={newPrice !== null ? newPrice.toFixed(8) : ''}
                                                        onChange={(e) => this.handleEditChange(e, 'price')}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        value={newDate ? newDate.toISOString().split('T')[0] : ''}
                                                        onChange={(e) => this.handleEditChange(e, 'date')}
                                                    />
                                                </td>
                                                <td>
                                                    <button onClick={this.saveChanges}><FaUndo /> Save</button>
                                                    <button onClick={() => this.setState({ editingFile: null })}><FaUndo /> Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{file.name}</td>
                                                <td>{file.price !== null ? file.price.toFixed(8) : 'N/A'}</td>
                                                <td>{file.dateUploaded.toDateString()}</td>
                                                <td>
                                                    <button onClick={() => this.startEditing(file)}><FaEdit /> Edit</button>
                                                    <button onClick={() => this.handleDownloadFile(file.name)}><FaDownload /> Download</button>
                                                    <button onClick={() => this.handleShareFile(file.name)}><FaShareAlt /> Share</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>No files found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
