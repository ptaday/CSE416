import React from 'react';
import { FaMoon } from 'react-icons/fa';
import { LuSun } from 'react-icons/lu';

interface SettingsProps {
    isDarkTheme: boolean; // Prop for dark theme
    onThemeChange: (isDarkTheme: boolean) => void; // Function prop for theme change
}

interface SettingsState {
    selectedOption: 'appearance' | 'notifications'; // Track the selected option
    notificationSettings: { [key: string]: boolean }; 
}

export class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        this.state = {
            selectedOption: 'appearance', // Default option
            notificationSettings: {
                newTransaction: false,
                newDownload: false,
                newCashInflow: false
            }
        };

        this.selectOption = this.selectOption.bind(this);
        this.toggleDarkTheme = this.toggleDarkTheme.bind(this);
        this.toggleLightTheme = this.toggleLightTheme.bind(this);
        this.toggleNotification = this.toggleNotification.bind(this);
    }

    toggleNotification(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, checked } = event.target;
        this.setState((prevState) => ({
            notificationSettings: {
                ...prevState.notificationSettings,
                [name]: checked // Toggle the checkbox state
            }
        }));
    }

    selectOption(option: 'appearance' | 'notifications') {
        this.setState({ selectedOption: option });
    }

    toggleDarkTheme() {
        this.props.onThemeChange(true); 
    }

    toggleLightTheme() {
        this.props.onThemeChange(false);
    }

    render() {
        const { isDarkTheme } = this.props; 
        const { selectedOption, notificationSettings } = this.state; // Track the selected option

        return (
            <div className={`settings-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                <div className={`settings-sidebar ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Settings</h3>
                    <button
                        className={`settings-menu-button ${selectedOption === 'appearance' ? 'active' : 'inactive'}  ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}
                        onClick={() => this.selectOption('appearance')}
                    >
                        Appearance
                    </button>
                    <button
                        className={`settings-menu-button ${selectedOption === 'notifications' ? 'active' : 'inactive'}  ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}
                        onClick={() => this.selectOption('notifications')}
                    >
                        Notifications
                    </button>
                </div>
                <div className='settings-content '>
                    {selectedOption === 'appearance' && (
                        <div>
                        <h3>Themes</h3>
                        <div className="theme-icons">
                            <LuSun
                                size={24} 
                                className={`theme-icon ${isDarkTheme ? 'inactive-theme' : 'active-theme'}`}
                                onClick={this.toggleLightTheme} 
                                style={{ cursor: 'pointer' }} 
                            />
                            <FaMoon 
                                size={20} 
                                className={`theme-icon ${isDarkTheme ? 'active-theme' : 'inactive-theme'}`}
                                onClick={this.toggleDarkTheme} 
                                style={{ cursor: 'pointer' }} 
                            />
                        </div>
                    </div>
                    )}
                    {selectedOption === 'notifications' && (
                        <div>
                        <h3>Notifications</h3>
                        <p>I want to receive notifications for...</p>
                        <div className = 'notifications-label'>
                            <label>
                                <input
                                    type="checkbox"
                                    name="newTransaction"
                                    checked={notificationSettings.newTransaction}
                                    onChange={this.toggleNotification}
                                />
                                Every new transaction
                            </label>
                        </div>
                        <div className = 'notifications-label'>
                            <label>
                                <input
                                    type="checkbox"
                                    name="download"
                                    checked={notificationSettings.download}
                                    onChange={this.toggleNotification}
                                />
                                Every new download
                            </label>
                        </div>
                        <div className = 'notifications-label'>
                            <label>
                                <input
                                    type="checkbox"
                                    name="cashInflow"
                                    checked={notificationSettings.cashInflow}
                                    onChange={this.toggleNotification}
                                />
                                Every new cash flow
                            </label>
                        </div>
                    </div>
                    )}
                </div>
            </div>
        );
    }
}
