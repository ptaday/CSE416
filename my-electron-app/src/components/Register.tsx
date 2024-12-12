import React, { ChangeEvent } from 'react';
import { FaRegCopy, FaEye, FaEyeSlash } from 'react-icons/fa';

interface RegisterProps {
  handleLogin: (walletId: string, walletName: string) => void;
}

interface RegisterState {
  walletName: string;
  passphrase: string;
  walletIdFromBackend: string;
  error: string;
  showPassword: boolean;
  showPopup: boolean;
}

export class Register extends React.Component<RegisterProps, RegisterState> {
  constructor(props: RegisterProps) {
    super(props);
    this.state = {
      walletName: '',
      passphrase: '',
      walletIdFromBackend: '',
      error: '',
      showPassword: false,
      showPopup: false,
    };

    this.togglePopup = this.togglePopup.bind(this);
  }

  togglePopup() {
    this.setState({ showPopup: true });
    setTimeout(() => {
      this.setState({ showPopup: false });
    }, 500);
  }

  handleInputChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    this.setState({ [name]: value } as unknown as Pick<RegisterState, keyof RegisterState>);
  };

  togglePasswordVisibility = () => {
    this.setState((prevState) => ({ showPassword: !prevState.showPassword }));
  };

  validateInputs = (): string => {
    const { walletName, passphrase } = this.state;
    if (walletName.trim() === '') {
      return 'Wallet name cannot be empty.';
    }
    if (passphrase.length < 14) {
      return 'Passphrase must be at least 14 characters long.';
    }
    if (!/[A-Z]/.test(passphrase)) {
      return 'Passphrase must contain at least one uppercase letter.';
    }
    if (!/[0-9]/.test(passphrase)) {
      return 'Passphrase must contain at least one number.';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passphrase)) {
      return 'Passphrase must contain at least one special character.';
    }
    return '';
  };

  handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationError = this.validateInputs();
    if (validationError) {
      this.setState({ error: validationError });
      return;
    }

    const { walletName, passphrase } = this.state;

    fetch('http://127.0.0.1:3001/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wallet_name: walletName, passphrase }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.wallet_id) {
          const parsedWalletId = this.parseWalletId(data.wallet_id);
          this.setState({ walletIdFromBackend: parsedWalletId, error: '' });
          // CHANGE: Passing walletName along with walletId
          this.props.handleLogin(parsedWalletId, walletName);
          console.log(`Registration Successful! Wallet Name: ${walletName}, Wallet ID: ${parsedWalletId}`);

        } else {
          this.setState({ error: 'Failed to register wallet.' });
        }
      })
      .catch((error) => {
        console.error('Error registering wallet:', error);
        this.setState({ error: 'Error registering wallet.' });
      });
  };

  parseWalletId = (walletId: string): string => {
    const match = walletId.match(/\((bcrt1[a-zA-Z0-9]+)\)/);
    return match ? match[1] : walletId;
  };

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

  render() {
    const { walletName, passphrase, walletIdFromBackend, error, showPassword, showPopup } = this.state;

    if (walletIdFromBackend) {
      return (
        <div className="register-container">
          <p>Registration Successful!</p>
          <div className="register-successful-row">
            <label className="register-successful-label">Wallet ID</label>
            <textarea className="register-successful-input" readOnly value={walletIdFromBackend}></textarea>
            <FaRegCopy
              onClick={() => this.copyToClipboard(walletIdFromBackend)}
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
          <p className="register-disclosure">Please copy and keep these credentials secure.</p>
          {showPopup && (
            <div className="popup-overlay">
              <div className="copy-popup">
                <p>Copied to clipboard!</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="register-container">
        <form className="register-form" onSubmit={this.handleRegister}>
          <label className="register-label">Wallet Name</label>
          <input
            className="register-input"
            type="text"
            name="walletName"
            value={walletName}
            onChange={this.handleInputChange}
            required
          />
          <label className="register-label">Set Passphrase</label>
          <input
            className="register-input"
            type={showPassword ? 'text' : 'password'}
            name="passphrase"
            value={passphrase}
            onChange={this.handleInputChange}
            title="Must be at least 14 characters, include an uppercase letter, a number, and a special character"
            required
          />
          {showPassword ? (
            <FaEyeSlash onClick={this.togglePasswordVisibility} className="eye-icon" title="Hide password" />
          ) : (
            <FaEye onClick={this.togglePasswordVisibility} className="eye-icon" title="Show password" />
          )}
          {error && <p>*{error}</p>}
          <button className="register-button" type="submit">
            Generate Wallet
          </button>
        </form>
        {showPopup && (
          <div className="popup-overlay">
            <div className="copy-popup">
              <p>Copied to clipboard!</p>
            </div>
          </div>
        )}
      </div>
    );
  }
}
