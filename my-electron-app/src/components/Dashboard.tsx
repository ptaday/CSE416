import React from 'react';
import {FaBell } from 'react-icons/fa';
import { Peers } from './Peers';
import { CloudDrive } from './CloudDrive';
import { Transactions } from './Transactions';
import { Wallet } from './Wallet';
import { Settings } from './Settings';

// Define an interface for component state
interface DashboardState {
    toggleTransactions: boolean;
    toggleDrive: boolean;
    toggleWallet: boolean;
    toggleSettings: boolean;
    togglePeers: boolean;
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
            togglePeers: false,
            isDarkTheme: false // Initial state for theme
        };

        this.toggleTransactions = this.toggleTransactions.bind(this);
        this.toggleDrive = this.toggleDrive.bind(this);
        this.toggleWallet = this.toggleWallet.bind(this);
        this.toggleSettings = this.toggleSettings.bind(this);
        this.togglePeers = this.togglePeers.bind(this);
        this.handleThemeChange = this.handleThemeChange.bind(this); 
    }

    togglePeers() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            togglePeers: true
        });
    }

    toggleDrive() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: true,
            toggleWallet: false,
            toggleSettings: false,
            togglePeers: false
        });
    }

    toggleTransactions() {
        this.setState({
            toggleTransactions: true,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: false,
            togglePeers: false
        });
    }

    toggleWallet() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: true,
            toggleSettings: false,
            togglePeers: false
        });
    }

    toggleSettings() {
        this.setState({
            toggleTransactions: false,
            toggleDrive: false,
            toggleWallet: false,
            toggleSettings: true,
            togglePeers: false
        });
    }


    handleThemeChange(isDarkTheme: boolean) {
        this.setState({ isDarkTheme }); // Update the theme state
    }

    renderContent() {
        const { toggleTransactions, toggleDrive, toggleWallet, toggleSettings, togglePeers, isDarkTheme } = this.state;

        if (toggleTransactions) {
            return <Transactions isDarkTheme={isDarkTheme}/>;
        } else if (toggleDrive) {
            return <CloudDrive isDarkTheme={isDarkTheme} />;
        } else if (toggleWallet) {
            return <Wallet isDarkTheme={isDarkTheme} />;
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
        const { isDarkTheme } = this.state;

        return (
            <div className={isDarkTheme ? 'dark-theme' : 'light-theme'}> {/* Apply the theme */}
                {/* Navigation Bar */}
                <nav className= "{isDarkTheme ? 'dark-theme' : 'light-theme'} navbar">
                    <div className="nav-right">
                        Beluga
                    </div>
                    <div className="nav-left">
                        <FaBell/>
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