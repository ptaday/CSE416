import React from 'react';
import { FaMoneyBillWave, FaWallet, FaChartLine, FaArrowRight, FaCopy } from 'react-icons/fa';

interface WalletProps {
    isDarkTheme: boolean; // Prop to indicate the current theme
}

// Define the state interface for the Wallet component
interface WalletState {
    currentBalance: number; 
    walletID: string; 
    monthlyEarnings: number; 
    monthlySpendings: number; 
    receiverID: string; 
    transferAmount: string; 
    transferReason: string; 
    copied: boolean;
}

export class Wallet extends React.Component<WalletProps, WalletState> {
    constructor(props: WalletProps) {
        super(props);
        this.state = {
            currentBalance: 1000,  // Placeholder initial value
            walletID: "123456789",  // Placeholder wallet ID
            monthlyEarnings: 200,    // Placeholder value
            monthlySpendings: 150,    // Placeholder value
            receiverID: '',
            transferAmount: '',
            transferReason: '',
            copied: false
        };

        this.handleTransfer = this.handleTransfer.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.copyWalletID = this.copyWalletID.bind(this);
    }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        this.setState({ [name]: value } as unknown as Pick<WalletState, keyof WalletState>);
    }

    handleTransfer() {
        const { receiverID, transferAmount, transferReason } = this.state;
        // Logic for transferring money
        console.log(`Transferring ${transferAmount} to ${receiverID} for ${transferReason}`);
        // Reset fields after transfer
        this.setState({
            receiverID: '',
            transferAmount: '',
            transferReason: ''
        });
    }

    copyWalletID() {
        const { walletID } = this.state;
        navigator.clipboard.writeText(walletID).then(() => {
            this.setState({ copied: true });
            setTimeout(() => this.setState({ copied: false }), 1000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    render() {
        const { currentBalance, walletID, monthlyEarnings, monthlySpendings, copied } = this.state;
        const { isDarkTheme } = this.props;  // Get the theme prop

        return (
            <div className={`wallet-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                <div id = 'current-balance' className="wallet-block">
                    <h3>Current Balance <FaMoneyBillWave /></h3>
                    <p>{currentBalance}</p>
                </div>
                <div className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Wallet ID <FaWallet /> </h3>
                    <p>
                        {walletID} 
                        <FaCopy style={{ cursor: 'pointer' }} onClick={this.copyWalletID} /> 
                        {copied && <span style={{ color: '#0d47a1' }}>Copied!</span>}
                    </p>
                </div>
                <div  className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Monthly Earnings <FaChartLine /></h3>
                    <p>{monthlyEarnings}</p>
                </div>
                <div  className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Monthly Spending <FaChartLine /></h3>
                    <p>{monthlySpendings}</p>
                </div>
                <br />
                <div  className={`wallet-block transfer-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Transfer Money <FaArrowRight /></h3>
                    <input 
                        type="text" 
                        name="receiverID" 
                        placeholder="Receiver ID" 
                        onChange={this.handleChange} 
                        value={this.state.receiverID} 
                    />
                    <br />
                    <input 
                        type="number" 
                        name="transferAmount" 
                        placeholder="Amount" 
                        onChange={this.handleChange} 
                        value={this.state.transferAmount} 
                    />
                    <br />
                    <input 
                        type="text" 
                        name="transferReason" 
                        placeholder="Reason" 
                        onChange={this.handleChange} 
                        value={this.state.transferReason} 
                    />
                    <br />
                    <button onClick={this.handleTransfer}>Send</button>
                </div>
                <div className={`wallet-block graph-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Revenue Graph</h3>
                    <div className="graph-placeholder">
                        {/* Placeholder for the revenue graph */}
                        <p>Graph will be displayed here</p>
                    </div>
                </div>
            </div>
        );
    }
}
