import React from 'react';
import { FaMoneyBillWave, FaWallet, FaChartLine, FaArrowRight, FaRegCopy } from 'react-icons/fa';
import { GiWarPick } from 'react-icons/gi';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Belugalight from './Beluga-Light.gif';

interface WalletProps {
    isDarkTheme: boolean;
    walletId: string;      
    walletBalance: number;
}

interface Transaction {
    type: string;
    receiverId: string;
    amount: number;
    date: string;
    status: string;
}

interface WalletState {
    walletBalance: number;
    monthlyEarnings: number;
    monthlySpendings: number;
    receiverId: string;
    transferAmount: string;
    transferReason: string;
    showPopup: boolean;
    popupMessage: string;
    balanceHistory: number[];
    transactions: Transaction[];
}

export class Wallet extends React.Component<WalletProps, WalletState> {
    constructor(props: WalletProps) {
        super(props);
        this.state = {
            walletBalance: this.props.walletBalance,
            monthlyEarnings: 200,
            monthlySpendings: 150,
            receiverId: '',
            transferAmount: '',
            transferReason: '',
            showPopup: false,
            popupMessage: '',
            balanceHistory: [this.props.walletBalance],
            transactions: [],
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

    async handleTransfer(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const { receiverId, transferAmount, transferReason, walletBalance, balanceHistory, transactions } = this.state;
        const sanitizedAmount = transferAmount.replace(/^0+(?!\.)/, '');
        const amountToTransfer = parseFloat(sanitizedAmount);

        if (amountToTransfer > walletBalance) {
            this.togglePopup('Insufficient Wallet Balance');
            return;
        }

        try {
            const response = await fetch('http://127.0.0.1:3001/api/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: receiverId,
                    amount: amountToTransfer,
                    comment: transferReason,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                this.togglePopup(`Error: ${data.message || 'Failed to send transaction'}`);
                return;
            }

            const newBalance = walletBalance - amountToTransfer;
            const newBalanceHistory = [...balanceHistory, newBalance];

            const newTransaction: Transaction = {
                type: 'Transfer',
                receiverId: receiverId,
                amount: amountToTransfer,
                date: new Date().toISOString(),
                status: 'Completed',
            };

            this.setState({
                receiverId: '',
                walletBalance: newBalance,
                transferAmount: '',
                transferReason: '',
                balanceHistory: newBalanceHistory,
                transactions: [...transactions, newTransaction],
            });

            this.togglePopup(`Transaction successful! TXID: ${data.transaction_id}`);
        } catch (error) {
            console.error('Failed to send transaction:', error);
            this.togglePopup('Failed to reach the server.');
        }
    }

    copyWalletId() {
        const { walletId } = this.props;
        navigator.clipboard
            .writeText(walletId)
            .then(() => {
                this.togglePopup('Copied to clipboard!');
            })
            .catch((err) => {
                console.error('Failed to copy text: ', err);
            });
    }

    render() {
        const { walletBalance, monthlyEarnings, monthlySpendings, showPopup, popupMessage, balanceHistory, transactions } = this.state;
        const { isDarkTheme, walletId } = this.props;

        return (
            <div className={`wallet-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                <div id="current-balance" className="wallet-block">
                    <h3>Current Balance <FaMoneyBillWave /></h3>
                    <h4>{walletBalance}</h4>
                </div>
                <div className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Wallet ID <FaWallet /></h3>
                    <h4>
                        {walletId.slice(0, 10)}
                        <FaRegCopy style={{ cursor: 'pointer' }} onClick={this.copyWalletId} />
                    </h4>
                </div>
                <div className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Miner <GiWarPick /></h3>
                    <h4>
                        <form>
                            <input type="number" name="mineAmount" placeholder="Amount" required />
                            <button type="submit">Mine</button>
                        </form>
                    </h4>
                </div>
                <div className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Monthly Earnings <FaChartLine /></h3>
                    <h4>{monthlyEarnings}</h4>
                </div>
                <div className={`wallet-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Monthly Spending <FaChartLine /></h3>
                    <h4>{monthlySpendings}</h4>
                </div>
                <div className={`wallet-block transfer-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Transfer Money <FaArrowRight /></h3>
                    <form onSubmit={this.handleTransfer}>
                        <input type="text" name="receiverId" placeholder="Receiver ID" onChange={this.handleChange} value={this.state.receiverId} required />
                        <input type="number" name="transferAmount" placeholder="Amount" onChange={this.handleChange} value={this.state.transferAmount} min="0.01" step="0.01" required />
                        <input type="text" name="transferReason" placeholder="Reason" onChange={this.handleChange} value={this.state.transferReason} required />
                        <button type="submit">Send</button>
                    </form>
                </div>
                <div className={`wallet-block graph-block ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
                    <h3>Balance Flow</h3>
                    <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={balanceHistory.map((balance, index) => ({ index, balance }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="index" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="balance" stroke="#8884d8" activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
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
                            {transactions.map((transaction, index) => (
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
                            <img className="popup-logo" src={Belugalight} alt="Popup Logo" />
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
