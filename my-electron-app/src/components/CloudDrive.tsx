import React from 'react';
import { FaSearch, FaUpload, FaTrash, FaDownload, FaEdit, FaUndo } from 'react-icons/fa';
import '../CloudDrive.css';

interface CloudDriveProps {
    isDarkTheme: boolean;
}

interface FileItem {
    name: string;
    trashed: boolean;
    fileData?: Blob;
    dateUploaded: Date; 
}

interface CloudDriveState {
    searchTerm: string;
    filterDate: string | null;
    files: Array<FileItem>;
    showTrash: boolean;
    isDragOver: boolean;
    editingFile: FileItem | null;
    newName: string;
    newDate: Date | null; 
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
            editingFile: null,
            newName: '',
            newDate: null, 
        };

        this.fileInputRef = React.createRef();

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleDateFilter = this.handleDateFilter.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.triggerFileInputClick = this.triggerFileInputClick.bind(this);
        this.handleTrashFile = this.handleTrashFile.bind(this);
        this.handleDownloadFile = this.handleDownloadFile.bind(this);
        this.toggleShowTrash = this.toggleShowTrash.bind(this);
        this.deleteFileForever = this.deleteFileForever.bind(this);
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

    handleDateFilter(dateRange: string) {
        this.setState({ filterDate: dateRange });
    }

    handleFileUpload(files: FileList | null) {
        if (files && files.length > 0) {
            const uploadedFiles = Array.from(files).map(file => ({
                name: file.name,
                trashed: false,
                fileData: new Blob([file], { type: file.type }),
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

    handleTrashFile(fileName: string) {
        this.setState(prevState => ({
            files: prevState.files.map(file =>
                file.name === fileName ? { ...file, trashed: !file.trashed } : file
            ),
        }));
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
        this.setState({ editingFile: file, newName: file.name, newDate: file.dateUploaded });
    }

    handleEditChange(event: React.ChangeEvent<HTMLInputElement>, field: 'name' | 'date') {
        if (field === 'name') {
            this.setState({ newName: event.target.value });
        } else if (field === 'date') {
            this.setState({ newDate: new Date(event.target.value) });
        }
    }

    saveChanges() {
        const { editingFile, newName, newDate } = this.state;
        if (editingFile) {
            this.setState(prevState => ({
                files: prevState.files.map(file =>
                    file.name === editingFile.name
                        ? { ...file, name: newName, dateUploaded: newDate ?? file.dateUploaded }
                        : file
                ),
                editingFile: null,
                newName: '',
                newDate: null,
            }));
        }
    }

    getFilteredFiles() {
        const { searchTerm, filterDate, files, showTrash } = this.state;

        const dateLimit = (fileDate: Date): boolean => {
            const today = new Date();
            if (filterDate === 'today') {
                return fileDate.toDateString() === today.toDateString();
            } else if (filterDate === 'this-week') {
                const oneWeekAgo = new Date(today.setDate(today.getDate() - 7));
                return fileDate >= oneWeekAgo;
            } else if (filterDate === 'this-month') {
                const oneMonthAgo = new Date(today.setMonth(today.getMonth() - 1));
                return fileDate >= oneMonthAgo;
            }
            return true;
        };

        return files.filter(file =>
            file.trashed === showTrash &&
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            dateLimit(file.dateUploaded)
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
        const files = event.dataTransfer.files;
        if (files && files.length > 0) {
            this.handleFileUpload(files);
        }
        this.setState({ isDragOver: false }); // Reset after drop
    }

    render() {
        const filteredFiles = this.getFilteredFiles();
        const { isDarkTheme } = this.props;
        const { isDragOver, showTrash, editingFile, newName, newDate } = this.state;
    
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
    
                <div className="action-buttons filter-buttons">
                    <button onClick={() => this.handleDateFilter('today')}>Today</button>
                    <button onClick={() => this.handleDateFilter('this-week')}>This Week</button>
                    <button onClick={() => this.handleDateFilter('this-month')}>This Month</button>
                    <button onClick={this.triggerFileInputClick}><FaUpload /> Upload</button>
                    <button onClick={this.toggleShowTrash}>
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
    
                <div
                    className={`drop-area ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={this.handleDragOver}
                    onDragLeave={this.handleDragLeave}
                    onDrop={this.handleDrop}
                >
                    <p>{showTrash ? 'Trashed files' : 'Drag and drop files here'}</p>
                </div>
    
                <div className="table-container"> {/* New wrapper for the table */}
                    <table className="file-table">
                        <thead>
                            <tr>
                                <th>File Name</th>
                                <th>Date Uploaded</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.length > 0 ? (
                                filteredFiles.map((file, index) => (
                                    <tr key={index}>
                                        {editingFile?.name === file.name ? (
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
                                                        type="date"
                                                        value={newDate ? newDate.toISOString().split('T')[0] : ''}
                                                        onChange={(e) => this.handleEditChange(e, 'date')}
                                                    />
                                                </td>
                                                <td>
                                                    <button onClick={this.saveChanges}><FaEdit /> Save</button>
                                                    <button onClick={() => this.setState({ editingFile: null })}><FaUndo /> Cancel</button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{file.name}</td>
                                                <td>{file.dateUploaded.toDateString()}</td>
                                                <td>
                                                    <button onClick={() => this.startEditing(file)}><FaEdit /> Edit</button>
                                                    <button onClick={() => this.handleDownloadFile(file.name)}><FaDownload /> Download</button>
                                                    <button onClick={() => this.handleTrashFile(file.name)}><FaTrash /> {file.trashed ? 'Restore' : 'Trash'}</button>
                                                    {file.trashed && (
                                                        <button onClick={() => this.deleteFileForever(file.name)}><FaTrash /> Delete Forever</button>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3}>No files found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div> {/* End of table wrapper */}
            </div>
        );
    }
    
}
