import React, { useState } from 'react';
import '../Peers.css';

//Testing Purposes: Modify after Backend Setup
interface FileData {
  name: string;
  ip: string;
  location: string;
  price: string;
}

interface PeersProps {
  isDarkTheme: boolean;
}

export const Peers: React.FC<PeersProps> = ({ isDarkTheme }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const fileList: FileData[] = [
    { name: 'Adventures of Shuai Mu', ip: '192.168.0.1', location: 'US', price: '0.0789 BC' },
    { name: 'Adventures of Shuai Mu2', ip: '192.168.0.2', location: 'Canada', price: '0.0543 BC' },
    { name: 'Adventures of Shuai Mu3', ip: '192.168.0.3', location: 'Germany', price: '0.0787 BC' },
    { name: 'Adventures of Shuai Mu4', ip: '145.168.0.3', location: 'China', price: '0.0984 BC' },
  ];

  const filteredFiles = fileList.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadModalToggle = () => {
    setUploadModalOpen(!uploadModalOpen);
  };

  return (
    <div className={`peers-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <h3>File Sharing Proxy System</h3>

      {/* Upload Button */}
      <button className="upload-button" onClick={handleUploadModalToggle}>
        Upload File </button>

      {/* Search Bar */}
      <input type="text" className="search-bar" placeholder="Search for a file..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}/>

      {/* Table with 3 columns */}
      <table className="file-list-table">
        <thead> <tr> <th>File Name</th> <th>IP & Location</th> <th>Price</th> </tr> </thead>
        
        <tbody>
          {filteredFiles.map((file, index) => (
            <tr key={index}>
              <td>{file.name}</td>
              <td>{file.ip} / {file.location}</td>
              <td>{file.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for Uploading */}
      {uploadModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h2>Upload File</h2>
            <form>
              <label>File Name:</label>
              <input type="text" name="fileName" placeholder="Enter file name" />

              <label>Set Price:</label>
              <input type="text" name="price" placeholder="Enter price" />

              <label>Available for Download:</label>
              <input type="checkbox" name="isAvailable" />

              <div className="modal-buttons">
                <button type="submit">Upload</button>
                <button type="button" onClick={handleUploadModalToggle}>Close</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
