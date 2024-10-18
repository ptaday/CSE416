import React from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { Dashboard } from './Dashboard';
import Belugalight from './Beluga-Light.gif';

// Define an interface for component state
interface MainState {
  toggleLogin: boolean;
  toggleRegister: boolean;
  loggedIn: boolean;
  walletId: string; // State to hold the wallet ID
}

interface MainProps {}

export class Main extends React.Component<MainProps, MainState> {
  constructor(props: MainProps) {
    super(props);
    this.state = {
      toggleLogin: true, // Default is Login active
      toggleRegister: false,
      loggedIn: false, // Add state to manage login status
      walletId: '', // Initialize walletId state
    };

    this.toggleLogin = this.toggleLogin.bind(this);
    this.toggleRegister = this.toggleRegister.bind(this);
    this.handleLogin = this.handleLogin.bind(this); // Bind the new login handler
  }

  toggleLogin() {
    this.setState({
      toggleLogin: true,
      toggleRegister: false,
    });
  }

  toggleRegister() {
    this.setState({
      toggleLogin: false,
      toggleRegister: true,
    });
  }

  // Function to handle login and registration
  handleLogin(walletId: string) {
    this.setState({
      loggedIn: true,
      walletId: walletId // Store the wallet ID when logging in or registering
    });
  }

  render() {
    const { toggleLogin, toggleRegister, loggedIn, walletId } = this.state;

    // If the user is logged in, render the Dashboard
    if (loggedIn) {
      return <Dashboard walletId={walletId} walletBalance={100}></Dashboard>; // Pass wallet ID to Dashboard
    }

    return (
      <div className="main-container">
        <img className = 'logo-light' src={Belugalight} />
        <div className="main-nav">Beluga</div>
        <div className="tab-container">
          <div className={`tab ${toggleLogin ? 'active' : ''}`} onClick={this.toggleLogin}>
            Login
          </div>
          <div className={`tab ${toggleRegister ? 'active' : ''}`} onClick={this.toggleRegister}>
            Register
          </div>
        </div>

        {/* Render the selected form */}
        <div className="form-container">
          {toggleLogin && <Login handleLogin={this.handleLogin}/>}
          {toggleRegister && <Register handleLogin={this.handleLogin} />} {/* Pass handleLogin to Register */}
        </div>
      </div>
    );
  }
}
