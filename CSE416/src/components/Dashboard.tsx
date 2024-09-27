import React from 'react';
import { FaUserCircle, FaWallet, FaBell } from 'react-icons/fa';
import { Transactions } from './Transactions';
import { CloudDrive } from './CloudDrive';
import { Wallet } from './Wallet';
import { Settings } from './Settings';

// Define an interface for component state
interface DashboardState {
    toggleTransactions: boolean;
    toggleDrive: boolean;
    toggleWallet: boolean;
    toggleSettings: boolean;
    toggleBackups: boolean;
    isDarkTheme: boolean; // State to track theme
}

// Define a type for the component props (if any in the future)
interface DashboardProps {}

export class Dashboard extends React.Component<DashboardProps, DashboardState> {
    constructor(props: DashboardProps) {
        super(props);
        this.state = {
            toggleTransactions: true,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            toggleBackups: false,
            isDarkTheme: false // Initial state for theme
        };

        this.toggleTransactions = this.toggleTransactions.bind(this);
        this.toggleDrive = this.toggleDrive.bind(this);
        this.toggleWallet = this.toggleWallet.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.toggleBackups = this.toggleBackups.bind(this);
        this.handleThemeChange = this.handleThemeChange.bind(this); 
    }

    toggleTransactions() {
        this.setState({
            toggleTransactions: true,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            toggleBackups: false
        });
    }

    toggleDrive() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: true,
            toggleWallet: false,
            toggleSettings: false,
            toggleBackups: false
        });
    }

    toggleWallet() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: true,
            toggleSettings: false,
            toggleBackups: false
        });
    }

    toggleSettings() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: true,
            toggleBackups: false
        });
    }

    toggleBackups() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            toggleBackups: true
        });
    }

    handleThemeChange(isDarkTheme: boolean) {
        this.setState({ isDarkTheme }); // Update the theme state
    }

    renderContent() {
        const { toggleTransactions, toggleDrive, toggleWallet, toggleSettings, toggleBackups, isDarkTheme } = this.state;

        if (toggleTransactions) {
            return <Transactions />;
        } else if (toggleDrive) {
            return <CloudDrive isDarkTheme={isDarkTheme} />;
        } else if (toggleWallet) {
            return <Wallet />;
        } else if (toggleSettings) {
            return (
                <Settings
                    isDarkTheme={isDarkTheme}
                    onThemeChange={this.handleThemeChange} 
                />
            );
        } else if (toggleBackups) {
            return <div>Backups Content</div>;
        }

        return null; // Default return for rendering content
    }

    render() {
        const { isDarkTheme } = this.state;

        return (
            <div className={isDarkTheme ? 'dark-theme' : 'light-theme'}> {/* Apply the theme */}
                {/* Navigation Bar */}
                <nav className="navbar">
                    <div className="nav-right">
                        <FaUserCircle /> Account
                    </div>
                    <div className="nav-left">
                        <FaWallet/>
                        <FaBell/>
                    </div>
                </nav>

                <div id="menu" className="menu">
                    <button
                        id="transactions"
                        className={`menu-button ${this.state.toggleTransactions ? 'active' : 'inactive'}`}
                        onClick={this.toggleTransactions}
                    >
                        Transactions
                    </button>
                    <button
                        id="cloudDrive"
                        className={`menu-button ${this.state.toggleDrive ? 'active' : 'inactive'}`}
                        onClick={this.toggleDrive}
                    >
                        Cloud Drive
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
                        id="backUps"
                        className={`menu-button ${this.state.toggleBackups ? 'active' : 'inactive'}`}
                        onClick={this.toggleBackups}
                    >
                        Backups
                    </button>
                </div>

                <div id="content">
                    <div id="contentScreen">
                        {this.renderContent()}
                    </div>
                </div>
            </div>
        );
    }
}
