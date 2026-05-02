import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';

const History = () => {
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await api.get('/transaction/history');
        setTransactions(response.data.transactions);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchHistory();
  }, [navigate]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold mb-6">Transaction History</h2>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tx.direction === 'debit' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {tx.direction === 'debit' ? 'Sent' : 'Received'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{tx.from}</td>
                <td className="px-6 py-4 whitespace-nowrap">{tx.to}</td>
                <td className="px-6 py-4 whitespace-nowrap">₦{parseFloat(tx.amount).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">{tx.status}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => navigate('/')} className="mt-6 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
        Back to Dashboard
      </button>
    </div>
  );
};

export default History;