import React from 'react';
import axios from 'axios';
import { FaSearch } from 'react-icons/fa';
import '../CloudDrive.css';

interface RequestFileProps {
  isDarkTheme: boolean;
}

interface FileItem {
  cid: string;
  peerId: string;
  price: number;
  walletAddress: string;
  fileDescription: string;
}

interface RequestFileState {
  searchTerm: string;
  files: Array<FileItem>;
  isLoading: boolean;
}

export class RequestFile extends React.Component<RequestFileProps, RequestFileState> {
  constructor(props: RequestFileProps) {
    super(props);
    this.state = {
      searchTerm: '',
      files: [],
      isLoading: false,
    };
  }

  handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ searchTerm: event.target.value });
  };

  handleSearch = async () => {
    const { searchTerm } = this.state;
    if (!searchTerm.trim()) {
      alert('Please enter a valid search term.');
      return;
    }
    this.setState({ isLoading: true });

    try {
      const response = await axios.get('http://localhost:6100/providers/', {
        params: { targetCID: searchTerm },
      });

      // Parse the response
      const aggregatedResults = response.data.map((peerResponse: any) => {
        return peerResponse.metadata.map((file: any) => ({
          cid: file.cid,
          peerId: peerResponse.peer_id,
          price: file.price,
          walletAddress: file.walletaddress,
          fileDescription: file.fileDescription,
        }));
      }).flat(); // Flatten the nested array

      this.setState({ files: aggregatedResults, isLoading: false });

    } catch (error) {
      console.error('Search error:', error);
      alert('Failed to fetch files. Please try again later.');
      this.setState({ files: [], isLoading: false });
    }
  };

  handleFileAction = async (price: number, walletAddress: string, peerId: string, cid: string) => {
  this.setState({ isLoading: true }); // Set loading state to true when the action starts

  try {
    // Send the POST request to the backend
    const response = await axios.post('http://localhost:6100/file-transfer-request/', null, {
      params: {
        targetPeerID: peerId,
        cid: cid,
      },
    });

    // Check the response to ensure the file transfer was successful
    if (response.data === 'Successfully File Sent!') {
      alert('File transfer successful. The file was saved in the downloads directory!');
    } else {
      alert('Failed to transfer file. Please try again.');
    }
  } catch (error) {
    console.error('File transfer error:', error);
    alert('Error occurred while transferring the file.');
  } finally {
    this.setState({ isLoading: false }); // Set loading state to false once the request is done
  }
};

  render() {
    const { isDarkTheme } = this.props;
    const { isLoading, files } = this.state;

    const filteredFiles = files.filter((file) =>
      file.fileDescription.toLowerCase().includes(this.state.searchTerm.toLowerCase())
    );

    return (
      <div className={`cloud-drive-internal-container ${isDarkTheme ? 'dark' : 'light'}`}>
        <h3>File Request</h3>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search files by name or hash..."
            value={this.state.searchTerm}
            onChange={this.handleSearchChange}
          />
          <button
            className={`search-button ${isDarkTheme ? 'dark-button' : 'light-button'}`}
            onClick={this.handleSearch}
          >
            <FaSearch /> Search
          </button>
        </div>

        {isLoading && <div className="loading-indicator">Loading, please wait...</div>}

        <div className="file-list">
          <table className="request-file-table">
            <thead>
              <tr>
                <th>CID</th>
                <th>Peer ID</th>
                <th>Price (BTC)</th>
                <th>Wallet Address</th>
                <th>File Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.length > 0 ? (
                files.map((file, index) => (
                  <tr key={index}>
                    <td>{file.cid}</td>
                    <td>{file.peerId}</td>
                    <td>{file.price !== null ? file.price.toFixed(8) : 'N/A'}</td>
                    <td>{file.walletAddress}</td>
                    <td>{file.fileDescription}</td>
                    <td>
                      <button
                        className={`action-button ${isDarkTheme ? 'dark-button' : 'light-button'}`}
                        onClick={() =>
                          this.handleFileAction(file.price, file.walletAddress, file.peerId, file.cid)
                        }
                        disabled={isLoading}
                      >
                        Download File!
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
      </div>
    );
  }
}
