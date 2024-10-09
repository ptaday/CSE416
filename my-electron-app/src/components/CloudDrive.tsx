import React from 'react';
import { FaSearch, FaUpload, FaShareAlt, FaTrash, FaDownload } from 'react-icons/fa';

interface CloudDriveProps {
    isDarkTheme: boolean;
}

interface CloudDriveState {
    searchTerm: string;
    filterDate: string | null;
    files: Array<{ name: string; trashed: boolean; searchTerm: string; fileData?: Blob }>;
    showTrash: boolean;
    isDragOver: boolean;
}

export class CloudDrive extends React.Component<CloudDriveProps, CloudDriveState> {
    private fileInputRef: React.RefObject<HTMLInputElement>;

    constructor(props: CloudDriveProps) {
        super(props);
        this.state = {
            searchTerm: '',
            filterDate: null,
            files: [],
            showTrash: false,
            isDragOver: false,
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
                searchTerm: file.name.toLowerCase(),
                fileData: new Blob([file], { type: file.type }),
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

    getFilteredFiles() {
        const { searchTerm, files, showTrash } = this.state;
        return files.filter(file =>
            file.trashed === showTrash && file.searchTerm.includes(searchTerm.toLowerCase())
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
        const { isDarkTheme } = this.props;  // Use this.props.isDarkTheme
        const { isDragOver, showTrash } = this.state;

        return (
            <div className={`cloud-drive-container ${isDarkTheme ? 'dark' : 'light'}`}>
                <h3>Cloud Drive</h3>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={this.state.searchTerm}
                        onChange={this.handleSearchChange}
                    />
                    <FaSearch />
                </div>

                <div className="filter-buttons">
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('today')}>Today</button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('this-week')}>This Week</button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('this-month')}>This Month</button>
                </div>

                <div className="action-buttons">
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={this.triggerFileInputClick}>
                        <FaUpload /> Upload File
                    </button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={this.toggleShowTrash}>
                        <FaTrash /> {showTrash ? 'Back to Files' : 'Review Trash'}
                    </button>
                </div>

                <input
                    type="file"
                    ref={this.fileInputRef}
                    style={{ display: 'none' }}
                    multiple
                    onChange={(e) => this.handleFileUpload(e.target.files)}
                />

                <div
                    className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
                >
                    {isDragOver ? 'Drop files anywhere on the page' : 'Drag and drop files anywhere on the page'}
                </div>

                <div className="files-list">
                    {filteredFiles.length > 0 ? (
                        filteredFiles.map((file, index) => (
                            <div key={index} className="file-item">
                                <span>{file.name}</span>
                                <div className="file-actions">
                                    {!showTrash && (
                                        <>
                                            <button className="action-button" onClick={() => this.handleShareFile(file.name)}>
                                                <FaShareAlt /> Share
                                            </button>
                                            <button className="action-button" onClick={() => this.handleDownloadFile(file.name)}>
                                                <FaDownload /> Download
                                            </button>
                                            <button className="action-button" onClick={() => this.handleTrashFile(file.name)}>
                                                <FaTrash /> Trash
                                            </button>
                                        </>
                                    )}
                                    {showTrash && (
                                        <>
                                            <button className="action-button" onClick={() => this.handleTrashFile(file.name)}>
                                                Restore
                                            </button>
                                            <button className="action-button delete-button" onClick={() => this.deleteFileForever(file.name)}>
                                                Delete Forever
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>{showTrash ? 'No files in trash.' : 'No files found.'}</p>
                    )}
                </div>
            </div>
        );
    }
}
