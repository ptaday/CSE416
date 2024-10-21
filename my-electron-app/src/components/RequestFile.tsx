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
    provider: string;
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
    isLoading: boolean;
}

export class RequestFile extends React.Component<RequestFileProps, RequestFileState> {
    constructor(props: RequestFileProps) {
        super(props);
        this.state = {
            searchTerm: '',
            files: [
                { name: 'file1.txt', price: 0.001, dateUploaded: new Date('2023-10-01'), hashCode: 'abc123', provider: 'Provider A' },
                { name: 'file2.txt', price: 0.002, dateUploaded: new Date('2023-09-20'), hashCode: 'abc123', provider: 'Provider B' }, // Same hash as file1.txt
                { name: 'presentation.ppt', price: 0.005, dateUploaded: new Date('2023-08-15'), hashCode: 'ghi789', provider: 'Provider A' },
                { name: 'music.mp3', price: 0.003, dateUploaded: new Date('2023-07-10'), hashCode: 'jkl012', provider: 'Provider C' }
            ],
            downloadHistory: [],
            isLoading: false,
        };

        this.handleSearchChange = this.handleSearchChange.bind(this);
        this.handleDownloadFile = this.handleDownloadFile.bind(this);
    }

    handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
        this.setState({ searchTerm: event.target.value });
    }

    async handleDownloadFile(fileName: string) {
        const file = this.state.files.find(file => file.name === fileName);
        if (file) {
            const userConfirmed = window.confirm(`Are you sure you want to download "${file.name}" at the rate of ${file.price !== null ? file.price.toFixed(8) : 'N/A'} BTC?`);
            if (userConfirmed) {
                this.setState({ isLoading: true });

                const newDownloadHistoryItem: DownloadHistoryItem = {
                    provider: file.provider,
                    name: file.name,
                    price: file.price,
                    hashCode: file.hashCode
                };

                await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate a 2-second delay

                this.setState(prevState => ({
                    downloadHistory: [...prevState.downloadHistory, newDownloadHistoryItem],
                    isLoading: false
                }));

                const fileContent = `This is the content of the file: ${file.name}`;
                const blob = new Blob([fileContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = file.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }
        }
    }

    getFilteredFiles() {
        const { searchTerm, files } = this.state;

        // Normalize the search term for case-insensitive search
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        // Step 1: Find files that match by name
        const matchingFilesByName = files.filter(file =>
            file.name.toLowerCase().includes(lowerCaseSearchTerm)
        );

        // Step 2: Collect hash codes of matched files
        const matchingHashCodes = new Set<string>();
        matchingFilesByName.forEach(file => {
            matchingHashCodes.add(file.hashCode);
        });

        // Step 3: Find files that match by hash code (including different names)
        const matchingFilesByHash = files.filter(file =>
            file.hashCode.toLowerCase().includes(lowerCaseSearchTerm) && !matchingFilesByName.includes(file)
        );

        // Step 4: Combine the results, including files with the same hash
        const combinedFiles = [...matchingFilesByName];

        // Include files that share the same hash code with matched files
        files.forEach(file => {
            if (matchingHashCodes.has(file.hashCode) && !combinedFiles.includes(file)) {
                combinedFiles.push(file);
            }
        });

        // Also include files that matched the hash search
        matchingFilesByHash.forEach(file => {
            if (!combinedFiles.includes(file)) {
                combinedFiles.push(file);
            }
        });

        return combinedFiles;
    }

    render() {
        const filteredFiles = this.getFilteredFiles();
        const { isDarkTheme } = this.props;
        const { downloadHistory, isLoading } = this.state;

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

                {isLoading && <div className="loading-indicator">Downloading, please wait...</div>}

                <div className={`file-list`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Provider</th>
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
                                        <td>{file.provider}</td>
                                        <td>{file.price !== null ? file.price.toFixed(8) : 'N/A'}</td>
                                        <td>{file.dateUploaded.toDateString()}</td>
                                        <td>{file.hashCode}</td>
                                        <td>
                                            <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDownloadFile(file.name)} disabled={isLoading}>
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
