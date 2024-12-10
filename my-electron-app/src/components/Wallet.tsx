import React from 'react';
import { FaMoneyBillWave, FaWallet, FaChartLine, FaArrowRight, FaRegCopy } from 'react-icons/fa';
import { GiWarPick } from "react-icons/gi";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Belugalight from './Beluga-Light.gif';

interface WalletProps {
    isDarkTheme: boolean; // Prop to indicate the current theme
    walletId: string; // Prop for wallet ID
    walletBalance: number; // Prop for wallet balance
}

// Define the state interface for the Wallet component
interface WalletState {
    walletId: string; 
    walletBalance: number;
    monthlyEarnings: number; 
    monthlySpendings: number; 
    receiverId: string; 
    transferAmount: string; 
    transferReason: string; 
    showPopup: boolean;
    popupMessage: string;
    balanceHistory: number[];
    transactions: Transaction[]
}

interface Transaction {
    type: string;  // Transfer, Download, Received
    receiverId: string;
    amount: number;
    date: string;  // Use ISO format or similar for consistency
    status: string;  // e.g., 'Completed', 'Pending', etc.
}


export class Wallet extends React.Component<WalletProps, WalletState> {
    constructor(props: WalletProps) {
        super(props);
        this.state = {
            walletId: this.props.walletId,  // Placeholder wallet ID
            walletBalance: this.props.walletBalance,
            monthlyEarnings: 200,    // Placeholder value
            monthlySpendings: 150,    // Placeholder value
            receiverId: '',
            transferAmount: '',
            transferReason: '',
            showPopup: false,
            popupMessage: '',
            balanceHistory: [this.props.walletBalance],
            transactions: []
        };

        this.handleTransfer = this.handleTransfer.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.copyWalletId = this.copyWalletId.bind(this);
        this.togglePopup = this.togglePopup.bind(this);
    }

    togglePopup(message: string) {
        this.setState({ showPopup: true, popupMessage: message });
        setTimeout(() => {
          this.setState({ showPopup: false, popupMessage: '' });
        }, 1000); 
      }

    handleChange(event: React.ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;
        this.setState({ [name]: value } as unknown as Pick<WalletState, keyof WalletState>);
    }

    handleTransfer(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const { receiverId, transferAmount, transferReason, walletBalance, balanceHistory, transactions } = this.state;
        // Logic for transferring money
        const sanitizedAmount = transferAmount.replace(/^0+(?!\.)/, ''); // Strip leading zeros, but keep "0.x" intact
        const amountToTransfer = parseFloat(sanitizedAmount); // Convert to decimal number

        if(amountToTransfer > walletBalance){
            this.togglePopup('Insufficient Wallet Balance');
            return;
        }
        else{
            const newBalance = walletBalance - amountToTransfer; // Calculate the new balance

            // Update balance and add new record to history
            const newBalanceHistory = [...balanceHistory, newBalance];

            const newTransaction: Transaction = {
                type: 'Transfer',
                receiverId: receiverId,
                amount: amountToTransfer,
                date: new Date().toISOString(), // Store the current date
                status: 'Completed', // Status of the transaction
            };

            this.setState({
                receiverId: '',
                walletBalance: newBalance,
                transferAmount: '',
                transferReason: '',
                balanceHistory: newBalanceHistory,
                transactions: [...transactions, newTransaction]  
            });

            this.togglePopup(`Transferring ${amountToTransfer} to ${receiverId} for ${transferReason}`);
           
        }
    }

    copyWalletId() {
        const { walletId } = this.state;
        navigator.clipboard.writeText(walletId).then(() => {
            this.togglePopup('Copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    render() {
        const { walletId, walletBalance, monthlyEarnings, monthlySpendings, showPopup, popupMessage, balanceHistory } = this.state;
        const { isDarkTheme } = this.props;  // Get the theme prop

        return (
            <div className={`wallet-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                <div id = 'current-balance' className="wallet-block">
                    <h3>Current Balance <FaMoneyBillWave /></h3>
                    <h4>{walletBalance}</h4>
                </div>
                <div className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Wallet ID <FaWallet /> </h3>
                    <h4>
                        {walletId.slice(0, 10)}
                        <FaRegCopy style={{ cursor: 'pointer' }} onClick={this.copyWalletId} /> 
                    </h4>
                </div>
                <div className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Miner <GiWarPick  /> </h3>
                    <h4>
                    <form>
                    <input 
                        type="number" 
                        name="mineAmount" 
                        placeholder="Amount" 
                        required
                        />
                    </form>  
                    <button type="submit">Mine</button>
                    </h4>
                </div>
                <div  className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Monthly Earnings <FaChartLine /></h3>
                    <h4>{monthlyEarnings}</h4>
                </div>
                <div  className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Monthly Spending <FaChartLine /></h3>
                    <h4>{monthlySpendings}</h4>
                </div>
                <br />
                <div  className={`wallet-block transfer-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Transfer Money <FaArrowRight /></h3>
                    <form onSubmit={this.handleTransfer}>
                        <input 
                            type="text" 
                            name="receiverId" 
                            placeholder="Receiver ID" 
                            onChange={this.handleChange} 
                            value={this.state.receiverId} 
                            required
                        />
                        <br />
                        <input 
                            type="number" 
                            name="transferAmount" 
                            placeholder="Amount" 
                            onChange={this.handleChange} 
                            value={this.state.transferAmount} 
                            min = '0.01'
                            step = '0.01'
                            required
                        />
                        <br />
                        <input 
                            type="text" 
                            name="transferReason" 
                            placeholder="Reason" 
                            onChange={this.handleChange} 
                            value={this.state.transferReason} 
                            required
                        />
                        <br />
                        <button type="submit">Send</button>
                    </form>
                </div>
                <div className={`wallet-block graph-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                <h3>Balance Flow</h3>
                    <div className="graph-placeholder">
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={balanceHistory.map((balance, index) => ({ index, balance }))}>
                                <CartesianGrid className = {`wallet-axis ${isDarkTheme ? 'dark-theme' : 'light-theme'}`} strokeDasharray="3 3" />
                                <XAxis dataKey="index" className = {`wallet-axis ${isDarkTheme ? 'dark-theme' : 'light-theme'}`} />
                                <YAxis className = {`wallet-axis ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}/>
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="balance" stroke="#8884d8" activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className={`wallet-block transactions-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Transactions</h3>
                    <table className="wallet-transactions-table">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Receiver ID</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                        {this.state.transactions.map((transaction, index) => (
                            <tr key={index}>
                                <td>{transaction.type}</td>
                                <td>{transaction.receiverId}</td>
                                <td>{transaction.amount.toFixed(2)}</td>
                                <td>{new Date(transaction.date).toLocaleString()}</td>
                                <td>{transaction.status}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
                </div>
                {showPopup && (
                    <div className="popup-overlay">
                        <div className="copy-popup">
                            <p>{popupMessage}</p>
                            <img className = 'popup-logo' src={Belugalight} />
                        </div>
                    </div>
              )}
            </div>
        );
    }
}
