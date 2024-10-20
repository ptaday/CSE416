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
    hashCode: string; // Added hashCode
}

interface RequestFileState {
    searchTerm: string;
    files: Array<FileItem>;
}

export class RequestFile extends React.Component<RequestFileProps, RequestFileState> {
    constructor(props: RequestFileProps) {
        super(props);
        this.state = {
            searchTerm: '',
            files: [
                { name: 'file1.txt', price: 0.001, dateUploaded: new Date('2023-10-01'), hashCode: 'abc123' },
                { name: 'file2.jpg', price: 0.002, dateUploaded: new Date('2023-09-20'), hashCode: 'def456' },
                { name: 'presentation.ppt', price: 0.005, dateUploaded: new Date('2023-08-15'), hashCode: 'ghi789' },
                { name: 'music.mp3', price: 0.003, dateUploaded: new Date('2023-07-10'), hashCode: 'jkl012' }
            ], // Prepopulated dummy files
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
                // Here, you can generate the file content or link it to an existing file.
                // For demo purposes, I'm generating a simple text file.

                const fileContent = `This is the content of the file: ${file.name}`;
                const blob = new Blob([fileContent], { type: 'text/plain' }); // Change 'text/plain' as needed
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
                <div className={`file-list`}>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Price (BTC)</th>
                                <th>Date Uploaded</th>
                                <th>Hash Code</th> {/* Added Hash Code column */}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFiles.length > 0 ? (
                                filteredFiles.map((file, index) => (
                                    <tr key={index}>
                                        <td>{file.name}</td>
                                        <td>{file.price !== null ? file.price.toFixed(8) : 'N/A'}</td>
                                        <td>{file.dateUploaded.toDateString()}</td>
                                        <td>{file.hashCode}</td> {/* Displaying hash code */}
                                        <td>
                                            <button className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => this.handleDownloadFile(file.name)}>
                                                <FaDownload /> Download
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5}>No files found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }
}
