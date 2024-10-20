import React from 'react';
import { Peers } from './Peers';
import { CloudDrive } from './CloudDrive';
import { FileShare } from './FileShare';
import { Transactions } from './Transactions';
import { Wallet } from './Wallet';
import { Settings } from './Settings';
import { Main } from './Main';
import Belugalight from './Beluga-Light.gif';
import Belugadark from './Beluga-Dark.gif';

// Define an interface for component state
interface DashboardState {
    toggleTransactions: boolean;
    toggleDrive: boolean;
    toggleWallet: boolean;
    toggleSettings: boolean;
    toggleShare: boolean;
    togglePeers: boolean;
    toggleLogout: boolean,
    showLogoutPopup: boolean;
    isDarkTheme: boolean; // State to track theme
}

// Define a type for the component props (if any in the future)
interface DashboardProps {
    walletId: string; // Prop for wallet ID
    walletBalance: number; // Prop for wallet balance
}

export class Dashboard extends React.Component<DashboardProps, DashboardState> {
    constructor(props: DashboardProps) {
        super(props);
        this.state = {
            toggleTransactions: true,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            toggleShare: false,
            togglePeers: false,
            toggleLogout: false,
            showLogoutPopup: false,
            isDarkTheme: false // Initial state for theme
        };

        this.toggleTransactions = this.toggleTransactions.bind(this);
        this.toggleDrive = this.toggleDrive.bind(this);
        this.toggleWallet = this.toggleWallet.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.togglePeers = this.togglePeers.bind(this);
        this.toggleShare = this.toggleShare.bind(this);
        this.toggleLogout = this.toggleLogout.bind(this); 
        this.toggleLogoutPopup = this.toggleLogoutPopup.bind(this);
        this.handleThemeChange = this.handleThemeChange.bind(this); 
    }

    togglePeers() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            toggleShare: false,
            togglePeers: true,
            toggleLogout: false,
        });
    }

    toggleDrive() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: true,
            toggleWallet: false,
            toggleSettings: false,
            toggleShare: false,
            togglePeers: false,
            toggleLogout: false,
        });
    }

    toggleTransactions() {
        this.setState({
            toggleTransactions: true,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            toggleShare: false,
            togglePeers: false,
            toggleLogout: false,
        });
    }

    toggleWallet() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: true,
            toggleShare: false,
            toggleSettings: false,
            togglePeers: false,
            toggleLogout: false,
        });
    }

    toggleSettings() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: true,
            toggleShare: false,
            togglePeers: false,
            toggleLogout: false,
        });
    }

    toggleLogout() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleShare: false,
            toggleSettings: false,
            togglePeers: false,
            showLogoutPopup: false,
            toggleLogout: true,
        });
    }
    toggleShare() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleShare: true,
            toggleSettings: false,
            togglePeers: false,
            showLogoutPopup: false,
            toggleLogout: false,
        });
    }

    toggleLogoutPopup() {
        this.setState(prevState => ({ showLogoutPopup: !prevState.showLogoutPopup })); // Toggle popup visibility
    }

    handleThemeChange(isDarkTheme: boolean) {
        this.setState({ isDarkTheme }); // Update the theme state
    }

    renderContent() {
        const { toggleTransactions, toggleDrive, toggleWallet, toggleSettings, togglePeers, isDarkTheme, toggleShare } = this.state;

        if (toggleTransactions) {
            return <Transactions isDarkTheme={isDarkTheme} walletBalance={this.props.walletBalance} />;
          } else if (toggleDrive) {
            return <CloudDrive isDarkTheme={isDarkTheme} />;
          }else if(toggleShare){
            return <FileShare isDarkTheme={isDarkTheme} />;
          }
           else if (toggleWallet) {
            return <Wallet isDarkTheme={isDarkTheme} walletId={this.props.walletId} walletBalance={this.props.walletBalance} />; // Pass props to Wallet
          } else if (toggleSettings) {      
            return (
                <Settings
                    isDarkTheme={isDarkTheme}
                    onThemeChange={this.handleThemeChange} 
                />
            );
        } else if (togglePeers) {
            return <Peers isDarkTheme={isDarkTheme} />;
        }

        return null; // Default return for rendering content
    }

    render() {
        const { toggleLogout, showLogoutPopup, isDarkTheme } = this.state;

        if (toggleLogout){
            return <Main></Main>
        }
        else return (
            <div className={isDarkTheme ? 'dark-theme' : 'light-theme'}> {/* Apply the theme */}
                {/* Navigation Bar */}
                <nav className= "{isDarkTheme ? 'dark-theme' : 'light-theme'} navbar">
                    <div className="nav-right">
                        Beluga
                    </div>
                    <div className = 'nav-left'>
                    {!isDarkTheme &&  <img className = 'nav-logo-light' src={Belugalight} />}
                    {isDarkTheme &&  <img className = 'nav-logo-dark' src={Belugadark} />}
                    </div>
                </nav>

                <div id="menu" className="menu">
                    <button
                        id="peers"
                        className={`menu-button ${this.state.togglePeers ? 'active' : 'inactive'}`}
                        onClick={this.togglePeers}
                    >
                        Peers
                    </button>
                    <button
                        id="fileShare"
                        className={`menu-button ${this.state.toggleShare ? 'active' : 'inactive'}`}
                        onClick={this.toggleShare}
                    >
                        File Share
                    </button>
                    <button
                        id="cloudDrive"
                        className={`menu-button ${this.state.toggleDrive ? 'active' : 'inactive'}`}
                        onClick={this.toggleDrive}
                    >
                        Cloud Drive
                    </button>
                    <button
                        id="transactions"
                        className={`menu-button ${this.state.toggleTransactions ? 'active' : 'inactive'}`}
                        onClick={this.toggleTransactions}
                    >
                        Transactions
                    </button>
                    <button
                        id="wallet"
                        className={`menu-button ${this.state.toggleWallet ? 'active' : 'inactive'}`}
                        onClick={this.toggleWallet}
                    >
                        Wallet
                    </button>
                    <button
                        id="settings"
                        className={`menu-button ${this.state.toggleSettings ? 'active' : 'inactive'}`}
                        onClick={this.toggleSettings}
                    >
                        Settings
                    </button>
                    <button
                        id="logout"
                        className={`menu-button ${this.state.toggleLogout ? 'active' : 'inactive'}`}
                        onClick={this.toggleLogoutPopup}
                    >
                        Logout
                    </button>
                </div>

                {showLogoutPopup && (
                    <div className="popup-overlay">
                        <div className="popup">
                            <h2>Confirm Logout</h2>
                            <p>Are you sure you want to log out?</p>
                            <button onClick={this.toggleLogout}>Yes</button>
                            <button onClick={this.toggleLogoutPopup}>No</button>
                        </div>
                    </div>
                )}

                <div id="content">
                    <div id="contentScreen">
                        {this.renderContent()}
                    </div>
                </div>
            </div>
        );
    }
}