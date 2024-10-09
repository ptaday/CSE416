import React from 'react';

interface PeersProps {
    isDarkTheme: boolean; 
}

export class Peers extends React.Component<PeersProps> {
    render() {
        const { isDarkTheme } = this.props; // Destructure the prop
        return (
            <div className={`peers-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}> {/* Apply theme class */}
                <h3>Connected Peers</h3>
                <div className="graph-placeholder">
                    <p>Graph or peer data will be displayed here.</p>
                </div>
            </div>
        );
    }
}

