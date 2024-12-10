import React, { useState } from 'react';
import '../Peers.css';

interface ProxyNode {
  ip: string;
  location: string;
  price: string;
}

interface HistoryEntry {
  location: string;
  timeStarted: string;
  timeEnded?: string;
  duration?: string;
  ip?: string;
  expanded: boolean;
}

interface PeersProps {
  isDarkTheme: boolean;
}

export const Peers: React.FC<PeersProps> = ({ isDarkTheme }) => {
  const [connectedProxy, setConnectedProxy] = useState<string | null>(null);
  const [becomeProxy, setBecomeProxy] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [confirmationPopup, setConfirmationPopup] = useState<null | ProxyNode>(null);
  const [successPopup, setSuccessPopup] = useState(false);
  const [connectionStartTime, setConnectionStartTime] = useState<Date | null>(null); 
  const [pricePerMB, setPricePerMB] = useState<string>('');
  const [priceModalVisible, setPriceModalVisible] = useState(false); 

  const proxyList: ProxyNode[] = [
    { ip: '211.2.123.1', location: 'London', price: '0.0456 BC' },
    { ip: '145.51.100.2', location: 'Rio De Janeiro', price: '0.0398 BC' },
    { ip: '178.1.2.3', location: 'Moscow', price: '0.0521 BC' },
    { ip: '163.0.565.4', location: 'Hong Kong', price: '0.0482 BC' },
  ];

  const filteredProxies = proxyList.filter((proxy) =>
    proxy.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProxyClick = (proxy: ProxyNode) => {
    if (becomeProxy) {
      window.alert("You cannot connect to a proxy while you are acting as a proxy yourself.");
      return; 
    }

    if (connectedProxy && connectionStartTime) {
      const endTime = new Date();
      const lastConnection = history[history.length - 1];

      const durationMs = endTime.getTime() - connectionStartTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationSeconds = Math.floor((durationMs % 60000) / 1000);

      const updatedHistory = [...history];
      updatedHistory[updatedHistory.length - 1] = {
      ...lastConnection,
      timeEnded: endTime.toLocaleString(),
      duration: `${durationMinutes} ${durationMinutes > 1 ? 'minutes' : 'minute'} ${durationSeconds} ${durationSeconds > 1 ? 'seconds' : 'second'}`,
        expanded: false,
      };

      setHistory(updatedHistory);
      setConnectionStartTime(null);
    }

    setConfirmationPopup(proxy);
  };

  const handleConfirmation = (confirm: boolean) => {
    if (confirm && confirmationPopup) {
      const startTime = new Date();
      setConnectedProxy(confirmationPopup.ip);
      setConnectionStartTime(startTime);
      setHistory([
        ...history,
        {
          location: confirmationPopup.location,
          timeStarted: startTime.toLocaleString(), 
          expanded: false,
          ip: confirmationPopup.ip,
        },
      ]);
      setSuccessPopup(true);
      setTimeout(() => {
        setSuccessPopup(false);
      }, 1000);
    }
    setConfirmationPopup(null);
  };

  const handleDisconnect = () => {
    if (connectedProxy && connectionStartTime) {
      const endTime = new Date();
      const lastConnection = history[history.length - 1];

      const durationMs = endTime.getTime() - connectionStartTime.getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationSeconds = Math.floor((durationMs % 60000) / 1000);

      const updatedHistory = [...history];
      updatedHistory[updatedHistory.length - 1] = {
      ...lastConnection,
      timeEnded: endTime.toLocaleString(),
      duration: `${durationMinutes} ${durationMinutes > 1 ? 'minutes' : 'minute'} ${durationSeconds} ${durationSeconds > 1 ? 'seconds' : 'second'}`,
        expanded: false,
      };

      setHistory(updatedHistory);
      setConnectedProxy(null);
      setConnectionStartTime(null); 
    }
  };

  const toggleHistoryExpansion = (index: number) => {
    const updatedHistory = history.map((entry, i) =>
      i === index ? { ...entry, expanded: !entry.expanded } : entry
    );
    setHistory(updatedHistory);
  };

  const handleBecomeProxyClick = () => {
    if (becomeProxy) {
      setBecomeProxy(false);
    } else {
      setPriceModalVisible(true);
    }
  };

  const handleSetPrice = () => {
    if (!pricePerMB) {
      window.alert('Please set a valid price per MB.');
      return;
    }
    setBecomeProxy(true);
    setPriceModalVisible(false);
  };

  return (
    <div className={`peers-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
      <h3>Proxy System</h3>

      <div className="proxy-system-overview">
        <div className="proxy-status">
          <p>Current Proxy: {connectedProxy || '(Not Connected)'}</p>
        </div>
        <div className="status-text">
          <p>Status: {connectedProxy ? 'Connected' : 'Disconnected'}</p>
        </div>

        <div className="toggle-proxy">
          {becomeProxy && (
            <p>
              Note: You cannot connect to another proxy while being a proxy yourself.
            </p>
          )}

          {connectedProxy ? (
            <button className="disconnect-button ${isDarkTheme ? 'dark-button' : 'light-button'}" onClick={handleDisconnect}>
              Disconnect
            </button>
          ) : (
            <button
              className={`toggle-button ${becomeProxy ? 'active' : 'inactive'} ${isDarkTheme ? 'dark-button' : 'light-button'} `}
              onClick={handleBecomeProxyClick} 
            >
              {becomeProxy ? 'Stop Being Proxy' : 'Become Proxy'}
            </button>
          )}
        </div>
      </div>

      <input
        type="text"
        className="search-bar"
        placeholder="Search by location..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={becomeProxy} 
      />
      <p>Click on any location to connect</p>
      <table className={`proxy-list-table ${becomeProxy ? 'disabled' : ''}`}>
        <thead>
          <tr>
            <th>IP Address</th>
            <th>Location</th>
            <th>Price Per MB</th>
          </tr>
        </thead>
        <tbody>
          {filteredProxies.map((proxy, index) => (
            <tr key={index} onClick={() => handleProxyClick(proxy)}>
              <td>{proxy.ip}</td>
              <td>{proxy.location}</td>
              <td>{proxy.price}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4>Proxy History</h4>
      <table className="history-table">
        <thead>
          <tr>
            <th>Location</th>
            <th>Time Started</th>
            <th>Time Ended</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, index) => (
            <React.Fragment key={index}>
              <tr onClick={() => toggleHistoryExpansion(index)}>
                <td>{entry.location}</td>
                <td>{entry.timeStarted}</td>
                <td>{entry.timeEnded || 'Ongoing'}</td>
                <td>{entry.expanded ? 'Hide Details' : 'Show Details'}</td>
              </tr>
              {entry.expanded && (
                <tr className="expanded-row">
                  <td colSpan={4}>
                    <p>Duration: {entry.duration}</p>
                    <p>IP: {entry.ip}</p>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      {confirmationPopup && (
        <div className="modal">
          <div className="modal-content">
            <h2>Confirm Connection</h2>
            <p>Do you want to connect to {confirmationPopup.location}?</p>
            <button className={`${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => handleConfirmation(true)}>Yes</button>
            <button className={`${isDarkTheme ? 'dark-button' : 'light-button'}`} onClick={() => handleConfirmation(false)}>No</button>
          </div>
        </div>
      )}

      {successPopup && (
        <div className="modal">
          <div className="modal-content">
            <h2>Connection Successful!</h2>
          </div>
        </div>
      )}

      {priceModalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h2>Set Price Per MB</h2>
            <input
              type="number"
              value={pricePerMB}
              onChange={(e) => setPricePerMB(e.target.value)}
              placeholder="Enter price in BC"
            />
            <button className={`${isDarkTheme ? 'dark-button' : 'light-button'}`}  onClick={handleSetPrice}>Set Price</button>
            <button className={`${isDarkTheme ? 'dark-button' : 'light-button'}`}   onClick={() => setPriceModalVisible(false)}>Cancel</button>
          </div>
          </div>
      )}
    </div>
  );
};