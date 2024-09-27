import React, { useState } from 'react';
import { FaSearch } from 'react-icons/fa';

export function Transactions() {
    const [searchTerm, setSearchTerm] = useState<string>(''); // Define searchTerm as a string

    // Function to handle search input
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    // Placeholder for filtered transactions based on searchTerm
    const filteredTransactions: Array<{ id: number; name: string }> = []; // Adjust this type as needed

    return (
        <div className="transactions-container">
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
