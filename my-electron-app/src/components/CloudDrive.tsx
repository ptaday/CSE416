import React from 'react';
import { FaSearch, FaUpload, FaShareAlt, FaTrash } from 'react-icons/fa';

interface CloudDriveProps {
    isDarkTheme: boolean;
}

interface CloudDriveState {
    searchTerm: string;
    filterDate: string | null;
    files: Array<{ name: string; trashed: boolean; searchTerm: string }>; // Add `searchTerm` property to files
    showTrash: boolean;
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
        };

        this.fileInputRef = React.createRef();

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleDateFilter = this.handleDateFilter.bind(this);
        this.handleFileUpload = this.handleFileUpload.bind(this);
        this.triggerFileInputClick = this.triggerFileInputClick.bind(this);
        this.handleTrashFile = this.handleTrashFile.bind(this);
        this.handleShareFile = this.handleShareFile.bind(this);
        this.toggleShowTrash = this.toggleShowTrash.bind(this);
    }

    handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ searchTerm: event.target.value });
    }

    handleDateFilter(dateRange: string) {
        this.setState({ filterDate: dateRange });
    }

    handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const files = event.target.files;
        if (files && files.length > 0) {
            const uploadedFiles = Array.from(files).map(file => ({
                name: file.name,
                trashed: false, // Files are not trashed when uploaded
                searchTerm: file.name.toLowerCase(), // Initialize the searchTerm property from the file name
            }));
            this.setState(prevState => ({
                files: [...prevState.files, ...uploadedFiles],
            }));
        }
    }

    triggerFileInputClick() {
        if (this.fileInputRef.current) {
            this.fileInputRef.current.click();
        }
    }

    // Trash file handler
    handleTrashFile(fileName: string) {
        this.setState(prevState => ({
            files: prevState.files.map(file =>
                file.name === fileName ? { ...file, trashed: !file.trashed } : file
            ),
        }));
    }

    // Share file handler (currently just logs the file)
    handleShareFile(fileName: string) {
        console.log(`Sharing file: ${fileName}`);
    }

    // Toggle between showing trashed files and non-trashed files
    toggleShowTrash() {
        this.setState(prevState => ({
            showTrash: !prevState.showTrash,
        }));
    }

    // Filter files based on searchTerm and trashed state
    getFilteredFiles() {
        const { searchTerm, files, showTrash } = this.state;

        // Filter files based on their trashed status and whether the search term matches
        return files.filter(file =>
            file.trashed === showTrash &&
            file.searchTerm.includes(searchTerm.toLowerCase()) // Match against searchTerm property
        );
    }

    render() {
        const filteredFiles = this.getFilteredFiles();
        const { isDarkTheme } = this.props;
        const { showTrash } = this.state;

        return (
            <div className={`cloud-drive-container ${isDarkTheme ? 'dark' : 'light'}`}>
                <h3>Cloud Drive</h3>
                
                {/* Search bar */}
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search files..."
                        value={this.state.searchTerm}
                        onChange={this.handleSearchChange}
                    />
                    <FaSearch />
                </div>

                {/* Filter buttons */}
                <div className="filter-buttons">
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('today')}>Today</button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('this-week')}>This Week</button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDateFilter('this-month')}>This Month</button>
                </div>

                {/* Action buttons */}
                <div className="action-buttons">
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={this.triggerFileInputClick}>
                        <FaUpload /> Upload File
                    </button>
                    <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={this.toggleShowTrash}>
                        <FaTrash /> {showTrash ? 'Back to Files' : 'Review Trash'}
                    </button>
                </div>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={this.fileInputRef}
                    style={{ display: 'none' }}
                    multiple
                    onChange={this.handleFileUpload}
                />

                {/* Files List */}
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
                                            <button className="action-button" onClick={() => this.handleTrashFile(file.name)}>
                                                <FaTrash /> Trash
                                            </button>
                                        </>
                                    )}
                                    {showTrash && (
                                        <button className="action-button" onClick={() => this.handleTrashFile(file.name)}>
                                            Restore
                                        </button>
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
