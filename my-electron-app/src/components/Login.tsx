import React from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

interface LoginProps {
  handleLogin: (walletId: string) => void; // Update prop type to include wallet ID
}

interface LoginState {
  publicKeyHashInput: string;
  passphraseInput: string;
  error: string; 
  showPassword: boolean; // New state variable for password visibility
}

export class Login extends React.Component<LoginProps, LoginState> {
  constructor(props: LoginProps) {
    super(props);
    this.state = {
      publicKeyHashInput: '',
      passphraseInput: '',
      error: '',
      showPassword: false, // Initialize password visibility state
    };
  }

  // Handle form submission
  handleLogin = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();  // Prevent page refresh on form submit
    const { publicKeyHashInput, passphraseInput } = this.state;

    // Reset error state
    this.setState({
      error: ''
    });

    // Validate inputs
    if (publicKeyHashInput.trim() === '' || passphraseInput.trim() === '') {
      this.setState({ error: 'Fields cannot be empty.' });
      return; // Exit if validation fails
    }

    // Call the handleLogin prop with wallet ID
    this.props.handleLogin(publicKeyHashInput); // Pass the wallet ID to the parent
  };

  // Handle input changes
  handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    } as unknown as Pick<LoginState, keyof LoginState>);
  };

  // Toggle password visibility
  togglePasswordVisibility = () => {
    this.setState((prevState) => ({ showPassword: !prevState.showPassword }));
  };

  render() {
    const { publicKeyHashInput, passphraseInput, error, showPassword } = this.state;

    return (
      <div className='login-container'>
        <form onSubmit={this.handleLogin}>
          <label className='login-label'> 
            Wallet ID
          </label>
          <input
            className='login-input'
            type="text"
            name="publicKeyHashInput"
            value={publicKeyHashInput}
            onChange={this.handleChange}
            required
          />
          <br />
          <label className='login-label'>
            Passphrase
          </label>
            <input
              className='login-input'
              type={showPassword ? 'text' : 'password'} // Toggle input type
              name="passphraseInput"
              value={passphraseInput}
              onChange={this.handleChange}
              required
            />
            {/* Toggle button for password visibility */}
            {showPassword ? (
              <FaEyeSlash onClick={this.togglePasswordVisibility} className="eye-icon" title="Hide password" />
            ) : (
              <FaEye onClick={this.togglePasswordVisibility} className="eye-icon" title="Show password" />
            )}
          <br />
          {error && <p>*{error}</p>}
          <div className='login-form'>
            <button className='login-button' type="submit">Login</button>
          </div>
        </form>
      </div>
    );
  }
}
