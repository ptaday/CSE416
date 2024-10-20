import React from 'react';
import { FaSearch, FaUpload, FaShareAlt, FaTrash, FaDownload, FaEdit, FaUndo } from 'react-icons/fa';

interface FileShareProps {
    isDarkTheme: boolean;
}

interface FileItem {
    name: string;
    trashed: boolean;
    fileData?: Blob;
    price: number | null; // Allow price to be null
}

interface FileShareState {
    searchTerm: string;
    filterDate: string | null;
    files: Array<FileItem>;
    showTrash: boolean;
    isDragOver: boolean;
    editingFile: FileItem | null; // Track the file being edited
    newName: string; // New name input
    newPrice: number | null; // New price input
}

export class FileShare extends React.Component<FileShareProps, FileShareState> {
    private fileInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: FileShareProps) {
        super(props);
        this.state = {
            searchTerm: '',
            filterDate: null,
            files: [],
            showTrash: false,
            isDragOver: false,
            editingFile: null,
            newName: '',
            newPrice: null,
        };

        this.fileInputRef = React.createRef();

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleDateFilter = this.handleDateFilter.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.triggerFileInputClick = this.triggerFileInputClick.bind(this);
        this.handleTrashFile = this.handleTrashFile.bind(this);
        this.handleShareFile = this.handleShareFile.bind(this);
        this.handleDownloadFile = this.handleDownloadFile.bind(this);
        this.toggleShowTrash = this.toggleShowTrash.bind(this);
        this.deleteFileForever = this.deleteFileForever.bind(this);
        this.startEditing = this.startEditing.bind(this);
        this.handleEditChange = this.handleEditChange.bind(this);
        this.saveChanges = this.saveChanges.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDragEnter = this.handleDragEnter.bind(this);
        this.handleDragLeave = this.handleDragLeave.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    componentDidMount() {
        window.addEventListener('dragover', this.handleDragOver);
        window.addEventListener('dragenter', this.handleDragEnter);
        window.addEventListener('dragleave', this.handleDragLeave);
        window.addEventListener('drop', this.handleDrop);
    }

    componentWillUnmount() {
        window.removeEventListener('dragover', this.handleDragOver);
        window.removeEventListener('dragenter', this.handleDragEnter);
        window.removeEventListener('dragleave', this.handleDragLeave);
        window.removeEventListener('drop', this.handleDrop);
    }

    handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ searchTerm: event.target.value });
    }

    handleDateFilter(dateRange: string) {
        this.setState({ filterDate: dateRange });
    }

    handleFileUpload(files: FileList | null) {
        if (files && files.length > 0) {
            const uploadedFiles = Array.from(files).map(file => ({
                name: file.name,
                trashed: false,
                fileData: new Blob([file], { type: file.type }),
                price: null, // Initialize price as null
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

    handleTrashFile(fileName: string) {
        this.setState(prevState => ({
            files: prevState.files.map(file =>
                file.name === fileName ? { ...file, trashed: !file.trashed } : file
            ),
        }));
    }

    handleShareFile(fileName: string) {
        console.log(`Sharing file: ${fileName}`);
    }

    handleDownloadFile(fileName: string) {
        const file = this.state.files.find(file => file.name === fileName);

        if (file) {
            if (file.fileData) {
                const fileURL = URL.createObjectURL(file.fileData);
                const a = document.createElement('a');
                a.href = fileURL;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(fileURL);
            } else {
                const downloadUrl = `/path-to-backend/${fileName}`;  // Replace with actual URL if needed
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        }
    }

    toggleShowTrash() {
        this.setState(prevState => ({
            showTrash: !prevState.showTrash,
        }));
    }

    deleteFileForever(fileName: string) {
        this.setState(prevState => ({
            files: prevState.files.filter(file => file.name !== fileName),
        }));
    }

    startEditing(file: FileItem) {
        this.setState({ editingFile: file, newName: file.name, newPrice: file.price });
    }

    handleEditChange(event: React.ChangeEvent<HTMLInputElement>, field: 'name' | 'price') {
        if (field === 'name') {
            this.setState({ newName: event.target.value });
        } else if (field === 'price') {
            const priceValue = parseFloat(event.target.value);
            this.setState({ newPrice: isNaN(priceValue) ? null : priceValue });
        }
    }

    saveChanges() {
        const { editingFile, newName, newPrice } = this.state;

        if (editingFile) {
            this.setState(prevState => ({
                files: prevState.files.map(file =>
                    file.name === editingFile.name
                        ? { ...file, name: newName, price: newPrice }
                        : file
                ),
                editingFile: null, // Clear editing state
                newName: '', // Reset new name input
                newPrice: null, // Reset new price input
            }));
        }
    }

    getFilteredFiles() {
        const { searchTerm, files, showTrash } = this.state;
        return files.filter(file =>
            file.trashed === showTrash && file.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    handleDragOver(event: DragEvent) {
        event.preventDefault();
    }

    handleDragEnter(event: DragEvent) {
        event.preventDefault();
        this.setState({ isDragOver: true });
    }

    handleDragLeave() {
        this.setState({ isDragOver: false });
    }

    handleDrop(event: DragEvent) {
        event.preventDefault();
        const files = event.dataTransfer?.files; // Use optional chaining to avoid null errors
        if (files && files.length > 0) {
            this.handleFileUpload(files);
        }
        this.setState({ isDragOver: false });
    }

    render() {
        const filteredFiles = this.getFilteredFiles();
        const { isDarkTheme } = this.props;  
        const { isDragOver, showTrash, editingFile, newName, newPrice } = this.state;

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

                <div className="action-buttons filter-buttons">
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('today')}>Today</button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('this-week')}>This Week</button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('this-month')}>This Month</button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={this.triggerFileInputClick}>
                        <FaUpload /> Upload File
                    </button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={this.toggleShowTrash}>
                        {showTrash ? 'Show Active Files' : 'Show Trash'}
                    </button>
                </div>

                <input
                    type="file"
                    ref={this.fileInputRef}
                    style={{ display: 'none' }}
                    onChange={(e) => this.handleFileUpload(e.target.files)}
                    multiple
                />

                <div className={`drop-area ${isDragOver ? 'drag-over' : ''}`}>
                    <p>{showTrash ? 'Trashed files' : 'Drag and drop files here'}</p>
                </div>

                <div className="file-list">
                    {filteredFiles.length > 0 ? (
                        filteredFiles.map((file, index) => (
                            <div key={index} className="file-item">
                                {editingFile?.name === file.name ? (
                                    <div className="editing-file">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => this.handleEditChange(e, 'name')}
                                        />
                                        <input
                                            type="number"
                                            value={newPrice !== null ? newPrice : ''}
                                            onChange={(e) => this.handleEditChange(e, 'price')}
                                            placeholder="Price (optional)"
                                        />
                                        <button onClick={this.saveChanges}>Save</button>
                                    </div>
                                ) : (
                                    <>
                                        <span>{file.name} - Price: {file.price !== null ? file.price.toFixed(2) : 0} BTC </span>
                                        <div className="file-actions">
                                            {!file.trashed && (<button onClick={() => this.handleShareFile(file.name)}><FaShareAlt /> Share</button>)}
                                            {!file.trashed && (<button onClick={() => this.handleDownloadFile(file.name)}><FaDownload /> Download</button>)}
                                            {!file.trashed && (<button onClick={() => this.startEditing(file)}><FaEdit /> Edit</button>)}
                                            <button onClick={() => this.handleTrashFile(file.name)}><FaTrash /> {file.trashed ? 'Restore' : 'Trash'}</button>
                                            {file.trashed && (
                                                <button onClick={() => this.deleteFileForever(file.name)}><FaUndo /> Delete Forever</button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>No files found.</p>
                    )}
                </div>
            </div>
        );
    }
}
