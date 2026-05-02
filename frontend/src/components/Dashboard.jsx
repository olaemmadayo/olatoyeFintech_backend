import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';

const Dashboard = () => {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAccount = async () => {
      try {
        const response = await api.get('/account/me');
        setAccount(response.data.account);
        setBalance(response.data.account.balance);
      } catch (err) {
        navigate('/login');
      }
    };
    fetchAccount();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  if (!account) return <div>Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <nav className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">
           <strong>
              Welcome To {account.customer.firstName} {account.customer.lastName} Dashboard
            </strong> 
          </h1>
        <div className="space-x-4">
          <Link to="/transfer" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Transfer</Link>
          <Link to="/history" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">History</Link>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </div>
      </nav>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-semibold mb-4">Account Information</h2>
        <p><strong>Account Number:</strong> {account.accountNumber}</p>
        <p><strong>Balance:</strong> ₦{balance.toLocaleString()}</p>
        <p><strong>Bank:</strong> {account.bankName}</p>
        <p><strong>Customer Name:</strong> {account.customer.firstName} {account.customer.lastName}</p>
      </div>
    </div>
  );
};

export default Dashboard;