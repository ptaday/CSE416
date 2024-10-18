import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

interface TransactionsProps {
    isDarkTheme: boolean; 
    walletBalance: number; // Prop for wallet balance
}


export function Transactions({ isDarkTheme }: TransactionsProps) {
    const [searchTerm, setSearchTerm] = useState<string>(''); 

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const filteredTransactions: Array<{ id: number; name: string }> = []; 

    return (
        <div className={`transactions-container ${isDarkTheme ? 'dark-theme' : 'light-theme'}`}>
            <h3>Transactions</h3>
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />
                <FaSearch /> 
            </div>

            {/* Transactions content placeholder */}
            <div className="transactions-list">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((transaction, index) => (
                        <div key={index} className="transaction-item">
                            {/* Render individual transaction details */}
                            {transaction.name} {/* Placeholder for transaction name */}
                        </div>
                    ))
                ) : (
                    <p>No transactions found.</p> // Placeholder for now
                )}
            </div>
        </div>
    );
}
