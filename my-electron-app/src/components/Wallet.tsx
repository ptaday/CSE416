import React from 'react';
import { FaMoneyBillWave, FaWallet, FaChartLine, FaArrowRight } from 'react-icons/fa';

// Define the state interface for the Wallet component
interface WalletState {
    currentBalance: number; 
    walletID: string; 
    monthlyEarnings: number; 
    monthlySpendings: number; 
    receiverID: string; 
    transferAmount: string; 
    transferReason: string; 
}

export class Wallet extends React.Component<{}, WalletState> {
    constructor(props: {}) {
        super(props);
        this.state = {
            currentBalance: 1000,  // Placeholder initial value
            walletID: "123456789",  // Placeholder wallet ID
            monthlyEarnings: 200,    // Placeholder value
            monthlySpendings: 150,    // Placeholder value
            receiverID: '',
            transferAmount: '',
            transferReason: ''
        };

        this.handleTransfer = this.handleTransfer.bind(this);
        this.handleChange = this.handleChange.bind(this);
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

    render() {
        const { currentBalance, walletID, monthlyEarnings, monthlySpendings } = this.state;

        return (
            <div className="wallet-container">
                <div className="wallet-block">
                    <h3>Current Balance <FaMoneyBillWave /></h3>
                    <p>${currentBalance}</p>
                </div>
                <div className="wallet-block">
                    <h3>Wallet ID <FaWallet /> </h3>
                    <p>{walletID}</p>
                </div>
                <div className="wallet-block">
                    <h3>Monthly Earnings <FaChartLine /></h3>
                    <p>${monthlyEarnings}</p>
                </div>
                <div className="wallet-block">
                    <h3>Monthly Spending <FaChartLine /></h3>
                    <p>${monthlySpendings}</p>
                </div>
                <br />
                <div className="wallet-block transfer-block">
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
                <div className="wallet-block graph-block">
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