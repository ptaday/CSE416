import React from 'react';

interface SettingsProps {
    isDarkTheme: boolean; // Prop for dark theme
    onThemeChange: (isDarkTheme: boolean) => void; // Function prop for theme change
}

interface SettingsState {
    selectedOption: 'appearance' | 'notifications'; // Track the selected option
}

export class Settings extends React.Component<SettingsProps, SettingsState> {
    constructor(props: SettingsProps) {
        super(props);
        this.state = {
            selectedOption: 'appearance' // Default option
        };

        this.selectOption = this.selectOption.bind(this);
        this.toggleDarkTheme = this.toggleDarkTheme.bind(this);
        this.toggleLightTheme = this.toggleLightTheme.bind(this);
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
        const { selectedOption } = this.state; // Track the selected option

        return (
            <div className='settings-container'>
                <div className='settings-sidebar'>
                    <h3>Settings</h3>
                    <button
                        className={`settings-menu-button ${selectedOption === 'appearance' ? 'active' : ''}`}
                        onClick={() => this.selectOption('appearance')}
                    >
                        Appearance
                    </button>
                    <button
                        className={`settings-menu-button ${selectedOption === 'notifications' ? 'active' : ''}`}
                        onClick={() => this.selectOption('notifications')}
                    >
                        Notifications
                    </button>
                </div>
                <div className='settings-content'>
                    {selectedOption === 'appearance' && (
                        <div>
                            <h3>Themes</h3>
                            <button
                                className={isDarkTheme ? 'inactive-theme' : 'active-theme'} 
                                id='settings-light-theme'
                                onClick={this.toggleLightTheme}
                            >
                                Light Theme
                            </button>
                            <button
                                className={isDarkTheme ? 'active-theme' : 'inactive-theme'} 
                                id='settings-dark-theme'
                                onClick={this.toggleDarkTheme}
                            >
                                Dark Theme
                            </button>
                        </div>
                    )}
                    {selectedOption === 'notifications' && (
                        <div>
                            <h3>Notifications</h3>
                            <p>No settings available yet.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }
}
