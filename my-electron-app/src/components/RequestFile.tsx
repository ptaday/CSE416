import React from 'react';
import { FaSearch, FaDownload } from 'react-icons/fa';
import '../CloudDrive.css';

interface RequestFileProps {
    isDarkTheme: boolean;
}

interface FileItem {
    name: string;
    price: number | null;
    dateUploaded: Date;
    hashCode: string;
    provider: string; // Added provider field
}

interface DownloadHistoryItem {
    provider: string;
    name: string;
    price: number | null;
    hashCode: string;
}

interface RequestFileState {
    searchTerm: string;
    files: Array<FileItem>;
    downloadHistory: Array<DownloadHistoryItem>;
}

export class RequestFile extends React.Component<RequestFileProps, RequestFileState> {
    constructor(props: RequestFileProps) {
        super(props);
        this.state = {
            searchTerm: '',
            files: [
                { name: 'file1.txt', price: 0.001, dateUploaded: new Date('2023-10-01'), hashCode: 'abc123', provider: 'Provider A' },
                { name: 'file2.jpg', price: 0.002, dateUploaded: new Date('2023-09-20'), hashCode: 'def456', provider: 'Provider B' },
                { name: 'presentation.ppt', price: 0.005, dateUploaded: new Date('2023-08-15'), hashCode: 'ghi789', provider: 'Provider A' },
                { name: 'music.mp3', price: 0.003, dateUploaded: new Date('2023-07-10'), hashCode: 'jkl012', provider: 'Provider C' }
            ],
            downloadHistory: [], // Initialize empty download history
        };

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleDownloadFile = this.handleDownloadFile.bind(this);
    }

    handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ searchTerm: event.target.value });
    }

    handleDownloadFile(fileName: string) {
        const file = this.state.files.find(file => file.name === fileName);
        if (file) {
            const userConfirmed = window.confirm(`Are you sure you want to download "${file.name}" at the rate of ${file.price !== null ? file.price.toFixed(8) : 'N/A'} BTC?`);
            if (userConfirmed) {
                const newDownloadHistoryItem: DownloadHistoryItem = {
                    provider: file.provider, // Include the provider from the file
                    name: file.name,
                    price: file.price,
                    hashCode: file.hashCode
                };

                // Immediately update state with the new download history item
                this.setState(prevState => ({
                    downloadHistory: [...prevState.downloadHistory, newDownloadHistoryItem]
                }));

                // Simulate file download
                const fileContent = `This is the content of the file: ${file.name}`;
                const blob = new Blob([fileContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = file.name; // Suggest a name for the downloaded file
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url); // Clean up the object URL
            }
        }
    }

    getFilteredFiles() {
        const { searchTerm, files } = this.state;

        return files.filter(file =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            file.hashCode.toLowerCase().includes(searchTerm.toLowerCase()) // Added hashCode search
        );
    }

    render() {
        const filteredFiles = this.getFilteredFiles();
        const { isDarkTheme } = this.props;
        const { downloadHistory } = this.state;

        return (
            <div className={`cloud-drive-container ${isDarkTheme ? 'dark' : 'light'}`}>
                <h3>Request File</h3>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search files by name or hash..."
                        value={this.state.searchTerm}
                        onChange={this.handleSearchChange}
                    />
                    <FaSearch />
                </div>

                {/* File List */}
                <div className={`file-list`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Provider</th> {/* Added Provider column */}
                                <th>Price (BTC)</th>
                                <th>Date Uploaded</th>
                                <th>Hash Code</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.length > 0 ? (
                                filteredFiles.map((file, index) => (
                                    <tr key={index}>
                                        <td>{file.name}</td>
                                        <td>{file.provider}</td> {/* Displaying provider */}
                                        <td>{file.price !== null ? file.price.toFixed(8) : 'N/A'}</td>
                                        <td>{file.dateUploaded.toDateString()}</td>
                                        <td>{file.hashCode}</td>
                                        <td>
                                            <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDownloadFile(file.name)}>
                                                <FaDownload /> Download
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6}>No files found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Always show Download History table */}
                <div className="download-history">
                    <h4>Download History</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>Provider</th>
                                <th>Filename</th>
                                <th>Price (BTC)</th>
                                <th>Hash Code</th>
                            </tr>
                        </thead>
                        <tbody>
                            {downloadHistory.length > 0 ? (
                                downloadHistory.map((historyItem, index) => (
                                    <tr key={index}>
                                        <td>{historyItem.provider}</td>
                                        <td>{historyItem.name}</td>
                                        <td>{historyItem.price !== null ? historyItem.price.toFixed(8) : 'N/A'}</td>
                                        <td>{historyItem.hashCode}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4}>No downloads yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
