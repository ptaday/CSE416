import React, { ChangeEvent } from 'react';
import CryptoJS from 'crypto-js';
import { FaRegCopy, FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

interface RegisterProps {
  handleLogin: (walletId: string) => void; // Function to set the wallet ID on successful registration
}

interface RegisterState {
  passphrase: string;
  publicKey: string;
  encryptedPrivateKey: string;
  username: string;
  error: string;
  showPassword: boolean;
  showPopup: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      generateKeyPair: (passphrase: string) => { publicKey: string; privateKey: string };
    };
  }
}

export class Register extends React.Component<RegisterProps, RegisterState> {
  constructor(props: RegisterProps) {
    super(props);
    this.state = {
      passphrase: '',
      publicKey: '',
      encryptedPrivateKey: '',
      username: '',
      error: '',
      showPassword: false,
      showPopup: false,
    };

    this.togglePopup = this.togglePopup.bind(this);
  }

  togglePopup() {
    this.setState({ showPopup: true }); // Show the popup
    setTimeout(() => {
        this.setState({ showPopup: false }); // Hide after 1 second
    }, 500);
}

  handlePassphraseChange = (event: ChangeEvent<HTMLInputElement>): void => {
    this.setState({ passphrase: event.target.value });
  };

  togglePasswordVisibility = () => {
    this.setState((prevState) => ({ showPassword: !prevState.showPassword }));
  };

  validatePassphrase = (passphrase: string): string => {
    if (passphrase.length != 0 && passphrase.length < 14) {
      return 'Must be at least 14 characters long.';
    }
    if (passphrase.length != 0 && !/[A-Z]/.test(passphrase)) {
      return 'Must contain at least one uppercase letter.';
    }
    if (passphrase.length != 0 && !/[0-9]/.test(passphrase)) {
      return 'Passphrase must contain at least one number.';
    }
    if (passphrase.length != 0 && !/[!@#$%^&*(),.?":{}|<>]/.test(passphrase)) {
      return 'Must contain at least one special character.';
    }
    return ''; // No errors
  };

  handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission

    const { passphrase } = this.state;

    // Validate the passphrase
    const validationError = this.validatePassphrase(passphrase);
    if (validationError) {
      this.setState({ error: validationError });
      return; // Exit the function if there are validation errors
    }

    try {
      // Generate key pair using the exposed electronAPI
      const { publicKey, privateKey } = window.electronAPI.generateKeyPair(passphrase);

      // Hash the public key to generate the username (SHA-256 hash)
      const publicKeyHash = CryptoJS.SHA256(publicKey).toString(CryptoJS.enc.Hex);

      // Encrypt the private key using AES encryption with the passphrase
      const encryptedPrivateKey = CryptoJS.AES.encrypt(privateKey, passphrase).toString();

      // Update state with public key, encrypted private key, and the username
      this.setState({
        publicKey,
        encryptedPrivateKey,
        username: publicKeyHash,
        error: '',
      });
    } catch (error) {
      console.error('Error generating key pair:', error);
      this.setState({ error: 'Error generating key pair' });
    }
  };

    // Function to copy text to clipboard
    copyToClipboard = (text: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          this.togglePopup();
        })
        .catch((err) => {
          console.error('Failed to copy text: ', err);
        });
    };

    directLogin = () => {
      this.props.handleLogin(this.state.username); // Call the handleLogin prop to notify the Main component
    };

    render() {
      const { passphrase, publicKey, username, error, showPassword, showPopup } = this.state;
  
      if (publicKey) {
        return (
          <div className="register-container">
            <p>Registration Successful!</p>
            <div className="register-successful-row">
              <label className="register-successful-label">Wallet ID </label>
              <textarea className="register-successful-input" readOnly value={username}></textarea>
              <FaRegCopy
                onClick={() => this.copyToClipboard(username)}
                style={{ cursor: 'pointer', marginLeft: '10px', fontSize: '1.5em' }}
                title="Copy to clipboard"
              />
            </div>
            <div className="register-successful-row">
              <label className="register-successful-label">Passphrase</label>
              <textarea className="register-successful-input" readOnly value={passphrase}></textarea>
              <FaRegCopy
                onClick={() => this.copyToClipboard(passphrase)}
                style={{ cursor: 'pointer', marginLeft: '10px', fontSize: '1.5em' }}
                title="Copy to clipboard"
              />
            </div>
            <p className = 'register-disclosure'>Please copy and keep these credentials secure.</p>
            <button className="direct-login-button" onClick={this.directLogin}>
              Login
            </button>
            {showPopup && (
                    <div className="popup-overlay">
                        <div className="copy-popup">
                            <p>Copied to clipboard!</p>
                        </div>
                    </div>
              )}
          </div>
        );
      } else {
        return (
          <div className="register-container">
            <form className = 'register-form' onSubmit={this.handleRegister}>
              <div className="password-container">
                <div className="register-label">
                <label id = 'register-label'>Set Passphrase </label>
                <input
                  className="register-input"
                  type={showPassword ? 'text' : 'password'}
                  value={passphrase}
                  onChange={this.handlePassphraseChange}
                title="Must be at least 14 characters, include an uppercase letter, a number, and a special character"
                required
                />
                {showPassword ? (
                  <FaEyeSlash onClick={this.togglePasswordVisibility} className="eye-icon" title="Hide password" />
                ) : (
                  <FaEye onClick={this.togglePasswordVisibility} className="eye-icon" title="Show password" />
                )}
                 {error && <p>*{error}</p>}
                 </div>
                 <button className="register-button" type="submit">Generate Wallet</button>
                 <p className = 'register-disclosure'>When you generate a wallet, a public/private key pair will be created. Your Wallet ID is your public key hash and your passphrase is used to encrypt your private key.</p>
              </div>
            </form>
          </div>
        );
      }
    }
}
